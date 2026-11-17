"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { ChoixSiteMois, fcfaCentimes, useSiteEauParDefaut } from "@/components/eau";
import { Button, DataTable, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, api, endpoints } from "@/lib/api";
import { BLOC_EAU_LABEL, DECISION_REVISION_EAU, FAMILLE_CHARGE_LABEL, STATUT_CHARGE_ATTENDUE_EAU, moisCourant, moisPrecedent } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CalculReelEau, ChargesAttenduesEau, EvolutionCoutEau } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

const m3 = (v: string | null | undefined) => (v == null ? "—" : `${formatQty(num(v), 3)} m³`);
const pct = (v: string | null | undefined, decimales = 2) => (v == null ? "—" : `${formatQty(num(v), decimales)} %`);

/**
 * Coût réel du mois de l'eau traitée, charges attendues, clôture et révision du standard.
 * La clôture conserve le calcul du jour, fige les saisies du mois et valorise l'eau des OF au standard.
 */
export default function CoutReelEauPage() {
  const { state, dispatch, can } = useStore();
  const gestion = can("PARAM_EAU");
  const defaut = useSiteEauParDefaut();
  const [choixUsine, setUsine] = useState(0);
  const usine = choixUsine || defaut;
  const [mois, setMois] = useState(moisPrecedent(moisCourant()));
  const [calcul, setCalcul] = useState<CalculReelEau | null>(null);
  const [attendues, setAttendues] = useState<ChargesAttenduesEau | null>(null);
  const [evolution, setEvolution] = useState<EvolutionCoutEau | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const charger = useCallback(async () => {
    if (!usine || !mois) return;
    try {
      const [c, a, e] = await Promise.all([actions.coutReelEau(usine, mois), actions.chargesAttenduesEau(usine, mois), actions.evolutionCoutEau(usine)]);
      setCalcul(c);
      setAttendues(a);
      setEvolution(e);
      setErreur(null);
    } catch (x) {
      setCalcul(null);
      setErreur(x instanceof Error ? x.message : "Calcul impossible.");
    }
  }, [usine, mois]);

  useEffect(() => {
    void charger();
  }, [charger, state.cloturesEau, state.validationsSansImputationEau, state.charges, state.coutsStandardsEau]);

  const cloture = state.cloturesEau.find((c) => c.usine === usine && c.mois === mois);
  const s = calcul?.synthese;
  const terminee = mois < moisCourant();
  const peutCloturer = gestion && !cloture && terminee && !!calcul && calcul.bloquants.length === 0 && calcul.manquantes.length === 0;
  const valorisations = state.valorisationsEauOF.filter((v) => cloture && v.cloture === cloture.id);

  async function cloturer() {
    if (!window.confirm(`Clôturer ${mois} ? Les saisies du mois seront figées et la clôture ne s’annule pas.`)) return;
    setBusy(true);
    await dispatch({ type: "EXEC", run: () => actions.cloturerMoisEau(usine, mois), refresh: ["cloturesEau", "valorisationsEauOF", "coutsStandardsEau", "coutsReels"] });
    setBusy(false);
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Coût de l’eau"
        title="Coût réel & clôture"
        description="Volume = bouteilles conformes des OF du site clôturés dans le mois. Les charges au besoin et exceptionnelles sont suivies à part : seul le coût courant se compare au standard."
      />
      <Panel className="p-4 space-y-2">
        <ChoixSiteMois usine={usine} mois={mois} onUsine={setUsine} onMois={setMois}>
          <div className="flex-1" />
          {cloture ? (
            <StatusBadge tone="success">
              Clôturé le {formatDateTime(cloture.date_cloture)}
              {cloture.cloture_par_nom ? ` par ${cloture.cloture_par_nom}` : ""}
            </StatusBadge>
          ) : (
            gestion && (
              <Button disabled={busy || !peutCloturer} onClick={() => void cloturer()} title={!terminee ? "Le mois n’est pas terminé" : undefined}>
                <Lock size={14} /> Clôturer {mois}
              </Button>
            )
          )}
        </ChoixSiteMois>
        {!cloture && attendues && (
          <p className="text-[12px] text-muted">
            Date limite pour imputer les charges du mois : {formatDate(attendues.date_limite)}. Les mois se clôturent dans l’ordre ; une clôture fige relevés, exceptions, pertes,
            interventions, pièces et charges rattachées à l’eau.
          </p>
        )}
      </Panel>
      {erreur && <p className="text-[12.5px] text-danger">{erreur}</p>}
      {calcul && (
        <>
          {calcul.bloquants.length > 0 && !cloture && (
            <Guard variant="block" title="Clôture impossible">
              <ul className="space-y-0.5">
                {calcul.bloquants.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </Guard>
          )}
          {calcul.alertes.length > 0 && (
            <Guard variant="warn" title={`${calcul.alertes.length} alerte(s)`}>
              <ul className="space-y-0.5">
                {calcul.alertes.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Guard>
          )}
          {cloture?.decision && (
            <Guard
              variant={cloture.decision === "NOUVEAU_PROPOSE" ? "warn" : "ok"}
              title={`Révision : ${DECISION_REVISION_EAU[cloture.decision].label}`}
              action={cloture.decision === "NOUVEAU_PROPOSE" ? <Link href="/eau" className="text-[12.5px] font-medium text-primary">Valider le standard proposé</Link> : undefined}
            >
              Écart hors charges au besoin et exceptionnelles : {pct(cloture.ecart_courant_pct)}
              {cloture.volume_prevu_m3 ? ` · volume ${m3(cloture.volume_m3)} sur ${m3(cloture.volume_prevu_m3)} prévus` : ""}.
            </Guard>
          )}
          {s && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Chiffre label="Coût réel total" valeur={fcfaCentimes(s.cout_reel_total)} sous={`${fcfaCentimes(s.cout_m3)} / m³`} fort />
              <Chiffre label="Coût courant (comparé au standard)" valeur={`${fcfaCentimes(s.cout_m3_courant)} / m³`} sous={`Standard ${fcfaCentimes(s.cout_standard_m3)} · écart ${pct(s.ecart_courant_pct)}`} fort />
              <Chiffre label="Eau valorisée dans les OF" valeur={fcfaCentimes(s.eau_valorisee_of)} sous={`Écart du mois ${fcfaCentimes(s.ecart_du_mois)}`} />
              <Chiffre label="Au besoin / exceptionnel" valeur={`${fcfaCentimes(s.charges_au_besoin)} / ${fcfaCentimes(s.charges_exceptionnelles)}`} sous={`Perte anormale ${fcfaCentimes(s.valeur_perte_anormale)}`} />
            </div>
          )}
          <div className="grid xl:grid-cols-2 gap-3">
            <Panel className="overflow-hidden">
              <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">
                Volume : {m3(calcul.volumes.volume_m3)} · part du site eau {calcul.volumes.part_site_eau != null ? pct(String(num(calcul.volumes.part_site_eau) * 100)) : "—"}
              </h2>
              <DataTable
                emptyText="Aucun OF du site clôturé dans le mois."
                columns={[
                  { key: "a", label: "Format" },
                  { key: "c", label: "Conformes", className: "text-right" },
                  { key: "r", label: "Rejetées", className: "text-right" },
                  { key: "v", label: "Volume", className: "text-right" },
                  { key: "t", label: "Rejet" },
                ]}
                rows={calcul.volumes.formats.map((f) => ({
                  a: f.article,
                  c: <span className="num">{formatQty(num(f.bouteilles_conformes), 0)}</span>,
                  r: <span className="num">{formatQty(num(f.bouteilles_rejetees), 0)}</span>,
                  v: <span className="num">{m3(f.volume_m3)}</span>,
                  t: f.classement_rejet ? (
                    <StatusBadge tone={f.classement_rejet === "Perte anormale" ? "danger" : "neutral"}>
                      {pct(String(num(f.taux_rejet) * 100))} · {f.classement_rejet}
                    </StatusBadge>
                  ) : (
                    "—"
                  ),
                }))}
              />
              <p className="px-4 py-2 text-[12px] text-muted border-t border-line">
                Eau captée vers le site {m3(calcul.volumes.eau_captee_site_m3)} · taux de pertes du site {calcul.volumes.taux_pertes_site != null ? pct(String(num(calcul.volumes.taux_pertes_site) * 100)) : "—"} · rejets
                normaux {m3(calcul.volumes.pertes_rejets_normales_m3)}, anormaux {m3(calcul.volumes.pertes_rejets_anormales_m3)}
              </p>
            </Panel>
            <Panel className="p-4 space-y-1 text-[13px]">
              <h2 className="text-[13px] font-semibold mb-1">Électricité du site (répartie aux kW × heures)</h2>
              <p>
                Facture : <span className="num">{fcfaCentimes(calcul.electricite.facture_site)}</span> pour {formatQty(num(calcul.electricite.total_kw_heures), 1)} kWh
              </p>
              <p>Forage : <span className="num">{fcfaCentimes(calcul.electricite.part_forage)}</span></p>
              <p>Traitement : <span className="num">{fcfaCentimes(calcul.electricite.part_traitement)}</span></p>
              <p>Production (hors coût de l’eau) : <span className="num">{fcfaCentimes(calcul.electricite.part_production_hors_eau)}</span></p>
              <h2 className="text-[13px] font-semibold pt-2">Synthèse</h2>
              <p>
                Forage avant partage {fcfaCentimes(s?.cout_forage_avant_partage)} → site eau {fcfaCentimes(s?.cout_forage_site_eau)}, autres sites {fcfaCentimes(s?.cout_forage_autres_sites)}
              </p>
              <p>Traitement {fcfaCentimes(s?.cout_traitement)} · coût courant {fcfaCentimes(s?.cout_reel_courant)}</p>
              <p>Écart total au standard : {pct(s?.ecart_total_pct)}</p>
            </Panel>
          </div>
          <Panel className="overflow-hidden">
            <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Charges du mois : prévu / réel (avant part du site)</h2>
            <DataTable
              emptyText="Aucune charge."
              columns={[
                { key: "l", label: "Charge" },
                { key: "p", label: "Prévu", className: "text-right" },
                { key: "r", label: "Réel courant", className: "text-right" },
                { key: "b", label: "Au besoin", className: "text-right" },
                { key: "e", label: "Exceptionnel", className: "text-right" },
              ]}
              rows={calcul.charges.map((c) => ({
                l: (
                  <span className="inline-flex flex-col">
                    <span>{c.libelle}</span>
                    <span className="text-[11.5px] text-muted">
                      {BLOC_EAU_LABEL[c.bloc].split(" (")[0]} · {FAMILLE_CHARGE_LABEL[c.famille]}
                      {c.kw_heures ? ` · ${formatQty(num(c.kw_heures), 1)} kWh` : ""}
                    </span>
                  </span>
                ),
                p: <span className="num">{fcfaCentimes(c.prevu)}</span>,
                r: <span className="num">{fcfaCentimes(c.reel_avant_part)}</span>,
                b: <span className="num">{c.au_besoin_avant_part ? fcfaCentimes(c.au_besoin_avant_part) : "—"}</span>,
                e: <span className="num">{c.exceptionnel_avant_part ? fcfaCentimes(c.exceptionnel_avant_part) : "—"}</span>,
              }))}
            />
          </Panel>
          {calcul.sorties_stock.mouvements.length > 0 && (
            <Panel className="overflow-hidden">
              <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Sorties de stock vers l’eau ({calcul.sorties_stock.valorisation})</h2>
              <DataTable
                columns={[
                  { key: "m", label: "Mouvement" },
                  { key: "a", label: "Article" },
                  { key: "q", label: "Quantité", className: "text-right" },
                  { key: "e", label: "Élément" },
                  { key: "v", label: "Valeur", className: "text-right" },
                ]}
                rows={calcul.sorties_stock.mouvements.map((x) => ({
                  m: `${x.mouvement} · ${formatDate(x.date)}`,
                  a: x.article,
                  q: <span className="num">{x.type === "RETOUR" ? `−${x.quantite}` : x.quantite}</span>,
                  e: x.element,
                  v: (
                    <span className="inline-flex flex-col items-end">
                      <span className="num">{fcfaCentimes(x.valeur)}</span>
                      {x.valeur_cmup && x.valeur_cmup !== x.valeur && <span className="text-[11.5px] text-muted">CMUP {fcfaCentimes(x.valeur_cmup)}</span>}
                    </span>
                  ),
                }))}
              />
            </Panel>
          )}
          {attendues && attendues.charges.length > 0 && <ChargesAttendues mois={mois} attendues={attendues} figee={!!cloture} />}
          {valorisations.length > 0 && (
            <Panel className="overflow-hidden">
              <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Eau valorisée dans les OF du mois</h2>
              <DataTable
                columns={[
                  { key: "o", label: "OF" },
                  { key: "v", label: "Volume", className: "text-right" },
                  { key: "e", label: "Eau au standard", className: "text-right" },
                  { key: "p", label: "Électricité production", className: "text-right" },
                  { key: "t", label: "Total", className: "text-right" },
                ]}
                rows={valorisations.map((v) => ({
                  o: v.of_numero,
                  v: <span className="num">{m3(v.volume_m3)}</span>,
                  e: <span className="num">{fcfaCentimes(v.montant_eau)}</span>,
                  p: <span className="num">{fcfaCentimes(v.electricite_production)}</span>,
                  t: <span className="num font-medium">{fcfaCentimes(v.montant_total)}</span>,
                }))}
              />
            </Panel>
          )}
        </>
      )}
      {evolution && evolution.mois.length > 0 && (
        <Panel className="overflow-hidden">
          <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Évolution (mois clôturés)</h2>
          <DataTable
            columns={[
              { key: "m", label: "Mois" },
              { key: "r", label: "Réel / m³", className: "text-right" },
              { key: "c", label: "Courant / m³", className: "text-right" },
              { key: "s", label: "Standard / m³", className: "text-right" },
              { key: "e", label: "Écart courant", className: "text-right" },
              { key: "d", label: "Décision" },
            ]}
            rows={evolution.mois.map((l) => ({
              m: l.mois,
              r: <span className="num">{fcfaCentimes(l.cout_m3)}</span>,
              c: <span className="num">{fcfaCentimes(l.cout_m3_courant)}</span>,
              s: <span className="num">{fcfaCentimes(l.cout_standard_m3)}</span>,
              e: <span className={cn("num", num(l.ecart_courant_pct) > 5 || num(l.ecart_courant_pct) < -5 ? "text-warning font-medium" : "")}>{pct(l.ecart_courant_pct)}</span>,
              d: (
                <span className="inline-flex flex-col">
                  <span>{l.decision_libelle || "—"}</span>
                  {l.standard_propose && (
                    <span className="text-[11.5px] text-muted">
                      {fcfaCentimes(l.standard_propose.cout_m3)} / m³ pour {l.standard_propose.mois_application} ({l.standard_propose.statut === "VALIDE" ? "validé" : l.standard_propose.statut === "REJETE" ? "rejeté" : "à valider"})
                    </span>
                  )}
                </span>
              ),
            }))}
          />
        </Panel>
      )}
    </div>
  );
}

/** Charges attendues du mois : imputées, validées sans imputation (avec un motif) ou manquantes. */
function ChargesAttendues({ mois, attendues, figee }: { mois: string; attendues: ChargesAttenduesEau; figee: boolean }) {
  const { dispatch, can } = useStore();
  const [motifs, setMotifs] = useState<Record<number, string>>({});
  const peut = can("VALIDER_SANS_IMPUTATION_EAU") && !figee;

  async function valider(element: number) {
    await dispatch({
      type: "EXEC",
      run: () => api.post(endpoints.validationsSansImputationEau, { element, mois, motif: (motifs[element] ?? "").trim() }),
      refresh: ["validationsSansImputationEau"],
    });
  }

  return (
    <Panel className="overflow-hidden">
      <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Charges attendues ({attendues.charges.filter((c) => c.statut === "MANQUANTE").length} manquante(s))</h2>
      <DataTable
        columns={[
          { key: "l", label: "Charge" },
          { key: "s", label: "Statut" },
          { key: "a", label: "" },
        ]}
        rows={attendues.charges.map((c) => ({
          l: c.libelle,
          s: (
            <span className="inline-flex flex-col items-start">
              <StatusBadge tone={STATUT_CHARGE_ATTENDUE_EAU[c.statut].tone}>{STATUT_CHARGE_ATTENDUE_EAU[c.statut].label}</StatusBadge>
              {c.motif && <span className="text-[11.5px] text-muted">{c.motif}</span>}
            </span>
          ),
          a:
            c.statut === "MANQUANTE" && peut ? (
              <span className="inline-flex items-center gap-2">
                <input className={cn(inputClass, "w-56 h-8")} placeholder="Motif (ex : aucun entretien ce mois)" value={motifs[c.element] ?? ""} onChange={(e) => setMotifs((m) => ({ ...m, [c.element]: e.target.value }))} />
                <Button variant="secondary" className="h-8 px-2.5 text-[12px]" disabled={!(motifs[c.element] ?? "").trim()} onClick={() => void valider(c.element)}>
                  Valider sans imputation
                </Button>
              </span>
            ) : c.statut === "MANQUANTE" ? (
              <span className="text-[12px] text-muted">À imputer dans Coûts › Cascade › Charges</span>
            ) : null,
        }))}
      />
    </Panel>
  );
}

function Chiffre({ label, valeur, sous, fort }: { label: string; valeur: string; sous?: string; fort?: boolean }) {
  return (
    <Panel className="p-3">
      <p className="text-[11.5px] text-muted">{label}</p>
      <p className={cn("num mt-0.5", fort ? "text-[17px] font-semibold" : "text-[14px] font-medium")}>{valeur}</p>
      {sous && <p className="text-[11.5px] text-muted mt-0.5">{sous}</p>}
    </Panel>
  );
}
