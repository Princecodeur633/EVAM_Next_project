"use client";

import { useEffect, useState } from "react";
import { Plus, Split, Trash2, Zap } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { RefCrud } from "@/components/RefCrud";
import { Button, DataTable, Guard, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { INDUCTEUR_LABEL, STATUT_DONNEE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { CleDeSite, CoutParSite, FactureCharge, StatutDonnee } from "@/lib/types";
import { cn, formatDa, formatQty, num } from "@/lib/utils";

const CLES_DE_SITE: CleDeSite[] = ["SURFACE_M2", "EFFECTIF", "TEMPS_UTILISATION_H", "VOLUME_OCCUPE_M3", "EMPLACEMENTS_PALETTES"];
const optDonnee = (Object.keys(STATUT_DONNEE_LABEL) as StatutDonnee[]).map((k) => ({ value: k, label: STATUT_DONNEE_LABEL[k] }));

/**
 * Factures à ventiler : une facture (ex. électricité SBEE) se découpe en parts — forage commun,
 * site Eau, site Jus & Yaourt, infrastructures — chacune devenant une charge de la cascade. La
 * somme des parts doit égaler le montant de la facture ; sinon le coût de la période est incomplet.
 */
export function FacturesAVentiler({ periode, gestion }: { periode: string; gestion: boolean }) {
  const { state, dispatch } = useStore();
  const [ventiler, setVentiler] = useState<FactureCharge | null>(null);
  const factures = state.facturesCharges.filter((f) => f.periode === periode);
  const incompletes = factures.filter((f) => !f.est_ventilee);

  async function parEtape(f: FactureCharge) {
    await dispatch({ type: "EXEC", run: () => actions.repartirFactureParEtape(f.id), refresh: ["facturesCharges", "charges"] });
  }

  return (
    <div className="space-y-3">
      {incompletes.length > 0 && (
        <Guard variant="warn" title={`${incompletes.length} facture(s) pas entièrement ventilée(s)`}>
          Une partie du coût de la période manque tant que la somme des parts n’égale pas le montant de la facture.
        </Guard>
      )}
      <RefCrud
        titre={`Factures à ventiler ${periode}`}
        description="Saisissez la facture puis découpez-la en parts (« Ventiler ») ou, pour l’électricité, répartissez-la par étape au prorata des kWh relevés."
        items={factures}
        endpoint={endpoints.facturesCharges}
        refresh={["facturesCharges", "charges"]}
        writable={gestion}
        supprimable={() => true}
        rechercheDans={(f) => [f.numero, f.reference, f.fournisseur]}
        libelleItem={(f) => `${f.numero} · ${f.reference}`}
        vide="Aucune facture à ventiler sur cette période."
        valeursInitiales={{ reference: "", fournisseur: "", periode, montant_total: "", date_facture: "", observations: "" }}
        champs={[
          { cle: "reference", label: "Référence de la facture", requis: true, placeholder: "Facture SBEE n° 1234" },
          { cle: "fournisseur", label: "Fournisseur", placeholder: "SBEE" },
          { cle: "periode", label: "Période (AAAA-MM)", requis: true },
          { cle: "montant_total", label: "Montant total (FCFA)", type: "number", requis: true },
          { cle: "date_facture", label: "Date de la facture", type: "date" },
          { cle: "observations", label: "Observations", type: "textarea" },
        ]}
        colonnes={[
          { cle: "n", label: "N°", rendu: (f) => <span className="num font-medium">{f.numero}</span> },
          { cle: "r", label: "Facture", rendu: (f) => `${f.reference}${f.fournisseur ? ` · ${f.fournisseur}` : ""}` },
          { cle: "m", label: "Montant", className: "text-right", rendu: (f) => <span className="num">{formatDa(num(f.montant_total))}</span> },
          { cle: "v", label: "Ventilé", className: "text-right", rendu: (f) => <span className="num">{formatDa(num(f.montant_ventile))}</span> },
          {
            cle: "s",
            label: "État",
            rendu: (f) =>
              f.est_ventilee ? <StatusBadge tone="success">Ventilée</StatusBadge> : <StatusBadge tone="warning">Reste {formatDa(num(f.reste_a_ventiler))}</StatusBadge>,
          },
          { cle: "p", label: "Parts", className: "text-right", rendu: (f) => <span className="num">{f.parts.length}</span> },
        ]}
        actionsDrawer={(f, fermer) => (
          <DrawerSection title="Parts de la facture" hint="Chaque part devient une charge (élément de coût, site, activité). La ventilation remplace les parts existantes.">
            {f.parts.length > 0 && (
              <ul className="rounded-[9px] border border-line divide-y divide-line text-[12.5px]">
                {f.parts.map((p) => (
                  <li key={p.id} className="px-3 py-2 flex justify-between gap-3">
                    <span>
                      {p.nature_libelle}
                      <span className="text-muted"> · {p.usine_code ?? (p.activite ? state.activites.find((a) => a.id === p.activite)?.code : null) ?? "commune"}</span>
                    </span>
                    <span className="num">{formatDa(num(p.montant))}</span>
                  </li>
                ))}
              </ul>
            )}
            {gestion && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    fermer();
                    setVentiler(f);
                  }}
                >
                  <Split size={14} /> Ventiler en parts
                </Button>
                <Button variant="secondary" onClick={() => void parEtape(f).then(fermer)}>
                  <Zap size={14} /> Répartir par étape (kWh relevés)
                </Button>
              </div>
            )}
          </DrawerSection>
        )}
      />
      {ventiler && <VentilationDrawer facture={ventiler} onClose={() => setVentiler(null)} />}
    </div>
  );
}

type Part = { cle: number; nature: number; montant: string; usine: number; activite: number; equipement: number; statut_donnee: StatutDonnee; observations: string };

function VentilationDrawer({ facture, onClose }: { facture: FactureCharge; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [parts, setParts] = useState<Part[]>(() =>
    facture.parts.length
      ? facture.parts.map((p, i) => ({
          cle: i + 1,
          nature: p.nature,
          montant: String(num(p.montant)),
          usine: p.usine ?? 0,
          activite: p.activite ?? 0,
          equipement: p.equipement ?? 0,
          statut_donnee: p.statut_donnee,
          observations: p.observations ?? "",
        }))
      : [{ cle: 1, nature: 0, montant: "", usine: 0, activite: 0, equipement: 0, statut_donnee: "REEL", observations: "" }],
  );
  const [busy, setBusy] = useState(false);
  const total = parts.reduce((a, p) => a + (Number(p.montant) || 0), 0);
  const reste = num(facture.montant_total) - total;
  const valide = parts.length > 0 && parts.every((p) => p.nature && Number(p.montant) > 0) && Math.abs(reste) < 0.005;
  const maj = (cle: number, champ: Partial<Part>) => setParts((ps) => ps.map((p) => (p.cle === cle ? { ...p, ...champ } : p)));
  const natures = state.naturesCout.filter((n) => n.actif);

  async function enregistrer() {
    setBusy(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        actions.ventilerFactureCharge(
          facture.id,
          parts.map((p) => ({
            nature: p.nature,
            montant: Number(p.montant),
            usine: p.usine || null,
            activite: p.activite || null,
            equipement: p.equipement || null,
            statut_donnee: p.statut_donnee,
            observations: p.observations.trim(),
          })),
        ),
      refresh: ["facturesCharges", "charges"],
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={`Ventiler ${facture.numero}`}
      subtitle={`${facture.reference} · ${formatDa(num(facture.montant_total))} · ${facture.periode}`}
      icon={<Split size={17} />}
      footer={
        <>
          <span className={cn("mr-auto text-[12.5px] num", Math.abs(reste) < 0.005 ? "text-success" : "text-warning")}>
            Reste à ventiler : {formatDa(reste)}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valide || busy} onClick={() => void enregistrer()}>
            {busy ? "Enregistrement…" : "Enregistrer la ventilation"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Parts" hint="Site : la part se répartit entre les seules activités du site. Activité : affectation directe. Ni l’un ni l’autre : charge commune (forage, infrastructures), répartie par la clé de l’élément de coût.">
        <div className="space-y-2">
          {parts.map((p) => (
            <div key={p.cle} className="rounded-[9px] border border-line p-2.5 grid sm:grid-cols-[minmax(0,1fr)_120px] gap-2">
              <select aria-label="Élément de coût" className={cn(inputClass, "h-9 text-[12.5px]")} value={p.nature} onChange={(e) => maj(p.cle, { nature: Number(e.target.value) })}>
                <option value={0}>Élément de coût…</option>
                {natures.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.libelle}
                    {n.etape_libelle ? ` [${n.etape_libelle}]` : ""}
                  </option>
                ))}
              </select>
              <input type="number" min="0" step="any" aria-label="Montant" placeholder="Montant" className={cn(inputClass, "h-9 num text-right")} value={p.montant} onChange={(e) => maj(p.cle, { montant: e.target.value })} />
              <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                <select aria-label="Site" className={cn(inputClass, "h-9 text-[12.5px]")} value={p.usine} onChange={(e) => maj(p.cle, { usine: Number(e.target.value) })}>
                  <option value={0}>Site : —</option>
                  {state.usines.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
                <select aria-label="Activité" className={cn(inputClass, "h-9 text-[12.5px]")} value={p.activite} onChange={(e) => maj(p.cle, { activite: Number(e.target.value) })}>
                  <option value={0}>Activité : —</option>
                  {state.activites.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.designation}
                    </option>
                  ))}
                </select>
                <select aria-label="Donnée" className={cn(inputClass, "h-9 text-[12.5px]")} value={p.statut_donnee} onChange={(e) => maj(p.cle, { statut_donnee: e.target.value as StatutDonnee })}>
                  {optDonnee.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label="Retirer la part"
                  onClick={() => setParts((ps) => ps.filter((x) => x.cle !== p.cle))}
                  className="h-9 w-9 justify-self-end rounded-[6px] flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="h-8 px-2.5 text-[12.5px] self-start"
          onClick={() =>
            setParts((ps) => [...ps, { cle: Date.now(), nature: 0, montant: reste > 0 ? String(reste) : "", usine: 0, activite: 0, equipement: 0, statut_donnee: "REEL", observations: "" }])
          }
        >
          <Plus size={14} /> Ajouter une part
        </Button>
      </DrawerSection>
    </Drawer>
  );
}

/** Compteurs d'eau brute, clés de site (surface, effectif…) et relevés d'électricité par étape. */
export function CompteursEtCles({ periode, gestion }: { periode: string; gestion: boolean }) {
  const { state } = useStore();
  const usines = state.usines.map((u) => ({ value: u.id, label: u.nom }));
  const activites = state.activites.map((a) => ({ value: a.id, label: a.designation }));
  const etapes = [...state.etapesStandard].sort((a, b) => a.ordre_reference - b.ordre_reference).map((e) => ({ value: e.id, label: e.libelle }));
  const energie = state.naturesCout.filter((n) => n.actif && n.categorie === "PRODUCTION" && n.categorie_economique === "ENERGIE").map((n) => ({ value: n.id, label: `${n.libelle}${n.etape_libelle ? ` [${n.etape_libelle}]` : ""}` }));
  const cible = (u?: string | null, a?: string | null) => `${u ?? "—"}${a ? ` / ${a}` : " (site entier)"}`;

  return (
    <div className="space-y-4">
      <RefCrud
        titre={`Compteurs d’eau brute ${periode}`}
        description="Volume capté au forage commun, par site (ligne sans activité) ou par activité : clé « volume d’eau brute captée » du forage. Une estimation doit être justifiée."
        items={state.volumesEauSites.filter((v) => v.periode === periode)}
        endpoint={endpoints.volumesEauSites}
        refresh={["volumesEauSites"]}
        writable={gestion}
        supprimable={() => true}
        rechercheDans={(v) => [v.usine_code, v.activite_code, v.source]}
        libelleItem={(v) => `${cible(v.usine_code, v.activite_code)} · ${v.periode}`}
        vide="Aucun relevé sur cette période."
        valeursInitiales={{ periode, usine: 0, activite: 0, volume_m3: "", statut_donnee: "REEL", source: "", justification: "" }}
        champs={[
          { cle: "periode", label: "Période (AAAA-MM)", requis: true },
          { cle: "usine", label: "Site / usine", type: "select", requis: true, options: usines },
          { cle: "activite", label: "Activité (vide = site entier)", type: "select", options: activites },
          { cle: "volume_m3", label: "Volume d’eau (m³)", type: "number", requis: true },
          { cle: "statut_donnee", label: "Donnée", type: "select", options: optDonnee },
          { cle: "source", label: "Source", placeholder: "Relevé du compteur forage → site Eau" },
          { cle: "justification", label: "Justification (si estimé)", type: "textarea", visible: (f) => f.statut_donnee === "ESTIME" },
        ]}
        colonnes={[
          { cle: "c", label: "Compteur", rendu: (v) => cible(v.usine_code, v.activite_code) },
          { cle: "v", label: "Volume", className: "text-right", rendu: (v) => <span className="num">{formatQty(num(v.volume_m3), 3)} m³</span> },
          { cle: "d", label: "Donnée", rendu: (v) => (v.statut_donnee === "ESTIME" ? <StatusBadge tone="warning">Estimé</StatusBadge> : "Réel") },
          { cle: "s", label: "Source", rendu: (v) => v.source || "—" },
        ]}
      />
      <RefCrud
        titre="Clés de site"
        description="Surface, effectif, temps d’utilisation, volume occupé, emplacements de palettes : par site ou par activité, à partir d’une date. Elles partagent une charge commune entre sites puis entre activités."
        items={[...state.valeursCles].sort((a, b) => a.inducteur.localeCompare(b.inducteur) || b.date_debut.localeCompare(a.date_debut))}
        endpoint={endpoints.valeursCles}
        refresh={["valeursCles"]}
        writable={gestion}
        supprimable={() => true}
        rechercheDans={(v) => [INDUCTEUR_LABEL[v.inducteur], v.usine_code, v.activite_code, v.source]}
        libelleItem={(v) => `${INDUCTEUR_LABEL[v.inducteur]} · ${cible(v.usine_code, v.activite_code)}`}
        valeursInitiales={{ inducteur: "SURFACE_M2", usine: 0, activite: 0, valeur: "", date_debut: new Date().toISOString().slice(0, 10), source: "" }}
        champs={[
          { cle: "inducteur", label: "Clé", type: "select", requis: true, options: CLES_DE_SITE.map((c) => ({ value: c, label: INDUCTEUR_LABEL[c] })) },
          { cle: "usine", label: "Site / usine", type: "select", requis: true, options: usines },
          { cle: "activite", label: "Activité (vide = site entier)", type: "select", options: activites },
          { cle: "valeur", label: "Valeur", type: "number", requis: true },
          { cle: "date_debut", label: "Valable à partir du", type: "date", requis: true },
          { cle: "source", label: "Source", placeholder: "Plan des bâtiments, registre du personnel…" },
        ]}
        colonnes={[
          { cle: "k", label: "Clé", rendu: (v) => INDUCTEUR_LABEL[v.inducteur] },
          { cle: "c", label: "Site / activité", rendu: (v) => cible(v.usine_code, v.activite_code) },
          { cle: "v", label: "Valeur", className: "text-right", rendu: (v) => <span className="num">{formatQty(num(v.valeur), 3)}</span> },
          { cle: "d", label: "Depuis le", rendu: (v) => v.date_debut },
          { cle: "s", label: "Source", rendu: (v) => v.source || "—" },
        ]}
      />
      <RefCrud
        titre={`Relevés d’électricité par étape ${periode}`}
        description="kWh par étape (compteur ou estimation validée) : « Répartir par étape » découpe la facture d’électricité de la période au prorata de ces relevés. Précisez l’élément de coût si l’étape en a plusieurs."
        items={state.relevesElectricite.filter((r) => r.periode === periode)}
        endpoint={endpoints.relevesElectricite}
        refresh={["relevesElectricite"]}
        writable={gestion}
        supprimable={() => true}
        rechercheDans={(r) => [r.etape_libelle, r.nature_libelle, r.source]}
        libelleItem={(r) => `${r.etape_libelle ?? "Étape"} · ${r.periode}`}
        vide="Aucun relevé sur cette période."
        valeursInitiales={{ periode, etape: 0, nature: 0, usine: 0, activite: 0, facture: 0, kwh: "", statut_donnee: "REEL", source: "", justification: "" }}
        champs={[
          { cle: "periode", label: "Période (AAAA-MM)", requis: true },
          { cle: "etape", label: "Étape", type: "select", requis: true, options: etapes },
          { cle: "nature", label: "Élément de coût « Énergie »", type: "select", aide: "Vide = l’élément Énergie de l’étape.", options: energie },
          { cle: "kwh", label: "Consommation (kWh)", type: "number", requis: true },
          { cle: "usine", label: "Site / usine", type: "select", options: usines },
          { cle: "activite", label: "Activité", type: "select", options: activites },
          {
            cle: "facture",
            label: "Facture (vide = facture de la période)",
            type: "select",
            options: state.facturesCharges.filter((f) => f.periode === periode).map((f) => ({ value: f.id, label: `${f.numero} · ${f.reference}` })),
          },
          { cle: "statut_donnee", label: "Donnée", type: "select", options: optDonnee },
          { cle: "source", label: "Source", placeholder: "Compteur C3 atelier soufflage" },
          { cle: "justification", label: "Justification (si estimé)", type: "textarea", visible: (f) => f.statut_donnee === "ESTIME" },
        ]}
        colonnes={[
          { cle: "e", label: "Étape", rendu: (r) => r.etape_libelle ?? "—" },
          { cle: "n", label: "Élément", rendu: (r) => r.nature_libelle ?? "Énergie de l’étape" },
          { cle: "k", label: "kWh", className: "text-right", rendu: (r) => <span className="num">{formatQty(num(r.kwh), 1)}</span> },
          { cle: "c", label: "Site / activité", rendu: (r) => (r.usine_code || r.activite_code ? cible(r.usine_code, r.activite_code) : "—") },
          { cle: "d", label: "Donnée", rendu: (r) => (r.statut_donnee === "ESTIME" ? <StatusBadge tone="warning">Estimé</StatusBadge> : "Réel") },
        ]}
      />
    </div>
  );
}

/** Coûts, électricité et rentabilité par site puis par activité (règle client). */
export function CoutsParSite({ periode }: { periode: string }) {
  const { state } = useStore();
  const [donnees, setDonnees] = useState<CoutParSite | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    let annule = false;
    setDonnees(null);
    setErreur(null);
    void actions
      .coutParSite(periode)
      .then((d) => !annule && setDonnees(d))
      .catch((e) => !annule && setErreur(e instanceof Error ? e.message : "Données indisponibles."));
    return () => {
      annule = true;
    };
  }, [periode, state.charges.length, state.facturesCharges.length]);

  if (erreur) return <Panel className="p-4 text-[13px] text-danger">{erreur}</Panel>;
  if (!donnees) return <Panel className="p-4 text-[13px] text-muted">Calcul…</Panel>;
  const m = (v: string | number | null | undefined) => (v == null ? "—" : formatDa(num(v)));

  return (
    <div className="space-y-4">
      {donnees.factures_incompletes.length > 0 && (
        <Guard variant="warn" title="Factures pas entièrement ventilées">
          <ul className="space-y-0.5">
            {donnees.factures_incompletes.map((f) => (
              <li key={f.facture}>
                <span className="num font-medium">{f.facture}</span> · {f.reference} · reste {formatDa(num(f.reste_a_ventiler))} sur {formatDa(num(f.montant_total))}
              </li>
            ))}
          </ul>
        </Guard>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Panel className="p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">Production non répartie</p>
          <p className="text-[17px] font-semibold num">{m(donnees.production_non_repartie)}</p>
        </Panel>
        <Panel className="p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">Frais généraux non incorporés</p>
          <p className="text-[17px] font-semibold num">{m(donnees.frais_generaux_non_incorpores)}</p>
        </Panel>
      </div>
      {donnees.sites.map((s) => (
        <Panel key={s.usine} className="overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-[13px] font-semibold flex-1">
              {s.nom} <span className="text-muted font-normal">({s.usine})</span>
            </h2>
            <span className="text-[12px] text-muted">
              Charges <span className="num font-medium text-ink">{m(s.charges_imputees)}</span> · dont électricité <span className="num">{m(s.electricite)}</span> · restées au site{" "}
              <span className="num">{m(s.reste_au_site)}</span>
            </span>
          </div>
          <DataTable
            emptyText="Aucune activité sur ce site."
            columns={[
              { key: "a", label: "Activité" },
              { key: "c", label: "Charges imputées", className: "text-right" },
              { key: "o", label: "Descendues aux OF", className: "text-right" },
              { key: "r", label: "Restées à l’activité", className: "text-right" },
              { key: "u", label: "Unités produites", className: "text-right" },
              { key: "cu", label: "Coût unitaire moyen", className: "text-right" },
              { key: "ca", label: "CA HT", className: "text-right" },
              { key: "mg", label: "Marge", className: "text-right" },
            ]}
            rows={s.activites.map((a) => ({
              a: (
                <span className="inline-flex flex-col">
                  <span className="font-medium">{a.designation}</span>
                  <span className="text-[11.5px] text-muted">
                    {a.ofs_clotures} OF clôturé(s) · électricité {m(a.dont_electricite)}
                  </span>
                </span>
              ),
              c: <span className="num">{m(a.charges_imputees)}</span>,
              o: <span className="num">{m(a.descendu_aux_of)}</span>,
              r: <span className="num">{m(a.reste_a_l_activite)}</span>,
              u: <span className="num">{formatQty(num(a.unites_produites), 0)}</span>,
              cu: <span className="num">{a.cout_unitaire_moyen != null ? formatQty(num(a.cout_unitaire_moyen), 2) : "—"}</span>,
              ca: <span className="num">{m(a.chiffre_affaires_ht)}</span>,
              mg: (
                <span className={cn("num", a.marge != null && num(a.marge) < 0 && "text-danger")}>
                  {m(a.marge)}
                  {a.taux_marge != null && <span className="block text-[11px] text-muted">{formatQty(a.taux_marge, 1)} %</span>}
                </span>
              ),
            }))}
          />
        </Panel>
      ))}
    </div>
  );
}
