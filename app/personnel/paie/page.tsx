"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Segmented } from "@/components/Filters";
import { Button, DataTable, Field, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, api, detail, endpoints } from "@/lib/api";
import { PERIODICITE_PAIE_LABEL, STATUT_ETAT_PAIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { EtatPaie, PeriodicitePaie, StatutEtatPaie } from "@/lib/types";
import { cn, dateISO, formatDa, formatDate, formatQty, num } from "@/lib/utils";

type Filtre = StatutEtatPaie | "TOUS";

const TONE: Record<StatutEtatPaie, "neutral" | "info" | "success" | "danger"> = {
  BROUILLON: "neutral",
  VALIDE: "info",
  PAYE: "success",
  ANNULE: "danger",
};

/**
 * Paie des ouvriers : le RH prépare, la DAF (ou la Direction) valide ou annule, le caissier paie
 * en espèces sur sa session ouverte. Chaque état se calcule jour par jour sur les pointages validés.
 */
export default function PaiePage() {
  const { state, dispatch, can, currentUser } = useStore();
  const peutPreparer = can("PREPARER_PAIE");
  const peutValider = can("VALIDER_PAIE");
  const peutPayer = can("PAYER_PAIE");
  const [filtre, setFiltre] = useState<Filtre>(peutPayer ? "VALIDE" : peutValider ? "BROUILLON" : "TOUS");
  const [annulation, setAnnulation] = useState<EtatPaie | null>(null);
  const [busy, setBusy] = useState(false);

  const session = state.sessionsCaisse.find((s) => s.statut === "OUVERTE" && s.caissier === currentUser?.id);
  const statuts: StatutEtatPaie[] = peutPayer ? ["VALIDE", "PAYE"] : ["BROUILLON", "VALIDE", "PAYE", "ANNULE"];
  const lignes = state.etatsPaie.filter((e) => filtre === "TOUS" || e.statut === filtre);
  const signables = lignes.filter((e) => e.statut === "VALIDE" || e.statut === "PAYE");
  const aujourdhui = dateISO();

  async function executer(run: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run, refresh: peutPayer ? ["etatsPaie", "decaissements", "sessionsCaisse"] : ["etatsPaie"] });
    setBusy(false);
    return ok;
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Personnel"
        title="Paie des ouvriers"
        description="Par semaine (lundi-dimanche) ou par mois civil, sur les pointages validés. Pas d’heures supplémentaires, de primes ni de charges sociales ; montant arrondi au franc."
        actions={
          <Button variant="secondary" disabled={signables.length === 0} onClick={() => void actions.emargementPaie(signables.map((e) => e.id))}>
            <FileText size={14} /> Fiche d’émargement
          </Button>
        }
      />
      {peutPreparer && <Preparation />}
      {peutPayer && !session && (
        <Guard variant="warn" title="Session de caisse fermée" action={<Link href="/caisse/cloture" className="text-[12.5px] font-medium text-primary">Ouvrir ma session</Link>}>
          Le paiement sort de votre session : ouvrez-la avant de payer.
        </Guard>
      )}
      <Segmented
        label="Statut"
        value={filtre}
        onChange={setFiltre}
        options={[
          ...(peutPayer ? [] : [{ value: "TOUS" as const, label: "Tous", count: state.etatsPaie.length }]),
          ...statuts.map((s) => ({ value: s, label: STATUT_ETAT_PAIE_LABEL[s], count: state.etatsPaie.filter((e) => e.statut === s).length })),
        ]}
      />
      <Panel className="overflow-hidden">
        <DataTable
          emptyText="Aucun état de paie."
          columns={[
            { key: "n", label: "État" },
            { key: "o", label: "Ouvrier" },
            { key: "p", label: "Période" },
            { key: "j", label: "Jours", className: "text-right" },
            { key: "m", label: "Montant", className: "text-right" },
            { key: "s", label: "Statut" },
            { key: "x", label: "" },
          ]}
          rows={lignes.map((e) => ({
            n: <span className="num">{e.numero}</span>,
            o: `${e.ouvrier_matricule} · ${e.ouvrier_nom}`,
            p: (
              <span className="inline-flex flex-col">
                <span>
                  {formatDate(e.date_debut)} → {formatDate(e.date_fin)}
                </span>
                <span className="text-[11.5px] text-muted">{PERIODICITE_PAIE_LABEL[e.periodicite]}</span>
              </span>
            ),
            j: (
              <span className="inline-flex flex-col items-end">
                <span className="num">{formatQty(num(e.jours_travailles), 1)}</span>
                {num(e.jours_absence_retenus) > 0 && <span className="text-[11.5px] text-muted">{formatQty(num(e.jours_absence_retenus), 1)} retenu(s)</span>}
                {e.jours_non_pointes > 0 && <span className="text-[11.5px] text-warning">{e.jours_non_pointes} non pointé(s)</span>}
              </span>
            ),
            m: <span className="num font-medium">{formatDa(num(e.montant))}</span>,
            s: (
              <span className="inline-flex flex-col items-start gap-0.5">
                <StatusBadge tone={TONE[e.statut]}>{STATUT_ETAT_PAIE_LABEL[e.statut]}</StatusBadge>
                {e.decaissement_numero && <span className="text-[11.5px] text-muted">{e.decaissement_numero}</span>}
                {e.motif_annulation && <span className="text-[11.5px] text-muted">{e.motif_annulation}</span>}
              </span>
            ),
            x: (
              <span className="inline-flex items-center justify-end gap-2.5 text-[12px]">
                {peutPreparer && e.statut === "BROUILLON" && (
                  <>
                    <button className="text-primary" disabled={busy} onClick={() => void executer(() => actions.recalculerPaie(e.id))}>
                      Recalculer
                    </button>
                    <button
                      className="text-danger"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Supprimer l’état ${e.numero} ?`)) void executer(() => api.del(detail(endpoints.etatsPaie, e.id)));
                      }}
                    >
                      Supprimer
                    </button>
                  </>
                )}
                {peutValider && e.statut === "BROUILLON" && (
                  <button
                    className={cn("text-success", e.date_fin > aujourdhui && "opacity-40")}
                    disabled={busy || e.date_fin > aujourdhui}
                    title={e.date_fin > aujourdhui ? `La période se termine le ${formatDate(e.date_fin)}` : undefined}
                    onClick={() => void executer(() => actions.validerPaie(e.id))}
                  >
                    Valider
                  </button>
                )}
                {peutValider && e.statut === "VALIDE" && (
                  <button className="text-danger" disabled={busy} onClick={() => setAnnulation(e)}>
                    Annuler
                  </button>
                )}
                {peutPayer && e.statut === "VALIDE" && (
                  <Button
                    className="h-7 px-2.5 text-[12px]"
                    disabled={busy || !session}
                    onClick={() => {
                      if (window.confirm(`Remettre ${formatDa(num(e.montant))} en espèces à ${e.ouvrier_nom} ?`)) void executer(() => actions.payerPaie(e.id));
                    }}
                  >
                    Payer
                  </Button>
                )}
              </span>
            ),
          }))}
        />
      </Panel>
      {annulation && <Annulation etat={annulation} onClose={() => setAnnulation(null)} onConfirm={(motif) => executer(() => actions.annulerPaie(annulation.id, motif))} />}
    </div>
  );
}

/** Préparation par le RH : un état pour chaque ouvrier payé à cette périodicité sur la période de la date. */
function Preparation() {
  const { dispatch } = useStore();
  const [periodicite, setPeriodicite] = useState<PeriodicitePaie>("MENSUELLE");
  const [date, setDate] = useState(dateISO());
  const [resultat, setResultat] = useState<{ crees: number; erreurs: Record<string, string[]> } | null>(null);
  const [busy, setBusy] = useState(false);

  async function preparer() {
    setBusy(true);
    setResultat(null);
    await dispatch({
      type: "EXEC",
      run: async () => {
        const r = await actions.preparerPaie(periodicite, date);
        setResultat({ crees: r.etats.length, erreurs: r.erreurs });
      },
      refresh: ["etatsPaie"],
    });
    setBusy(false);
  }

  const bloques = resultat ? Object.entries(resultat.erreurs) : [];
  return (
    <Panel className="p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="sm:w-48">
          <Field label="Paie">
            <select className={inputClass} value={periodicite} onChange={(e) => setPeriodicite(e.target.value as PeriodicitePaie)}>
              {(Object.keys(PERIODICITE_PAIE_LABEL) as PeriodicitePaie[]).map((p) => (
                <option key={p} value={p}>
                  {PERIODICITE_PAIE_LABEL[p]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:w-44">
          <Field label="Une date de la période">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Button disabled={busy || !date} onClick={() => void preparer()}>
          Préparer la paie
        </Button>
      </div>
      {resultat && <p className="text-[12.5px]">{resultat.crees} état(s) préparé(s).</p>}
      {bloques.length > 0 && (
        <Guard variant="warn" title={`${bloques.length} ouvrier(s) non préparé(s)`}>
          <ul className="space-y-0.5">
            {bloques.map(([matricule, messages]) => (
              <li key={matricule}>
                {matricule} : {messages.join(" ")}
              </li>
            ))}
          </ul>
        </Guard>
      )}
    </Panel>
  );
}

function Annulation({ etat, onClose, onConfirm }: { etat: EtatPaie; onClose: () => void; onConfirm: (motif: string) => Promise<boolean> }) {
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmer() {
    setBusy(true);
    const ok = await onConfirm(motif.trim());
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Annuler ${etat.numero}`}
      subtitle={`${etat.ouvrier_nom} · ${formatDa(num(etat.montant))}`}
      footer={
        <Button variant="danger" disabled={busy || !motif.trim()} onClick={() => void confirmer()}>
          Annuler l’état de paie
        </Button>
      }
    >
      <DrawerSection title="Motif" hint="La charge est contre-passée et les coûts imputés aux OF sont retirés.">
        <Field label="Motif d’annulation">
          <textarea className={cn(inputClass, "h-20 py-2")} value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
