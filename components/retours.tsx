"use client";

import { useEffect, useState } from "react";
import { PackageCheck, RefreshCw, ScanSearch, Undo2 } from "lucide-react";
import { Button, DataTable, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { RESULTAT_CONTROLE_RETOUR_LABEL, STATUT_RETOUR_PHYSIQUE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ReclamationAReceptionner, ResultatControleRetour, RetourPhysique } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

/**
 * Retours clients côté Magasinier et Qualité : ils ne lisent pas les réclamations (prix, description),
 * mais reçoivent la liste des réclamations à réceptionner, enregistrent le retour physique (mis en
 * quarantaine), le contrôlent, puis terminent le reconditionnement éventuel.
 */
export function RetoursClients() {
  const { state, can } = useStore();
  const [aReceptionner, setAReceptionner] = useState<ReclamationAReceptionner[] | null>(null);
  const nbRetours = state.retoursPhysiques.length;

  // Rechargée après chaque retour enregistré (une réclamation réceptionnée sort de la liste).
  useEffect(() => {
    let annule = false;
    void actions
      .reclamationsAReceptionner()
      .then((r) => !annule && setAReceptionner(r))
      .catch(() => !annule && setAReceptionner([]));
    return () => {
      annule = true;
    };
  }, [nbRetours]);

  const enQuarantaine = state.retoursPhysiques.filter((r) => r.statut === "EN_QUARANTAINE");
  const recondAFaire = state.reconditionnements.filter((r) => r.statut === "EN_ATTENTE");

  return (
    <div className="space-y-4 max-w-[1280px]">
      <PageHeader
        eyebrow="Retours clients"
        title="Retours à traiter"
        description="Réception du produit retourné (mis en quarantaine), contrôle (récupérable ou non), puis reconditionnement. La solution au client (remplacement, avoir, remboursement) reste au Commercial."
      />
      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold flex items-center gap-2">
          <Undo2 size={15} className="text-muted" /> À réceptionner ({aReceptionner?.length ?? "…"})
        </h2>
        {aReceptionner === null ? (
          <p className="px-4 py-6 text-[12.5px] text-muted">Chargement…</p>
        ) : aReceptionner.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun retour annoncé.</p>
        ) : (
          <ul className="divide-y divide-line">
            {aReceptionner.map((r) => (
              <ReceptionRetour key={r.id} reclamation={r} peutReceptionner={can("CREATE_RETOUR_PHYSIQUE")} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold flex items-center gap-2">
          <ScanSearch size={15} className="text-muted" /> En quarantaine, à contrôler ({enQuarantaine.length})
        </h2>
        {enQuarantaine.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun retour en attente de contrôle.</p>
        ) : (
          <ul className="divide-y divide-line">
            {enQuarantaine.map((r) => (
              <ControleRetourLigne key={r.id} retour={r} peutControler={can("CREATE_CONTROLE_RETOUR")} />
            ))}
          </ul>
        )}
      </Panel>

      {recondAFaire.length > 0 && (
        <Panel className="overflow-hidden">
          <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold flex items-center gap-2">
            <RefreshCw size={15} className="text-muted" /> Reconditionnements à terminer ({recondAFaire.length})
          </h2>
          <ul className="divide-y divide-line">
            {recondAFaire.map((r) => (
              <ReconditionnementLigne key={r.id} id={r.id} description={r.description} peutTerminer={can("TERMINER_RECONDITIONNEMENT")} />
            ))}
          </ul>
        </Panel>
      )}

      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Historique des retours</h2>
        <DataTable
          emptyText="Aucun retour enregistré."
          columns={[
            { key: "r", label: "Réclamation" },
            { key: "c", label: "Client" },
            { key: "a", label: "Article" },
            { key: "q", label: "Quantité", className: "text-right" },
            { key: "l", label: "Lot" },
            { key: "d", label: "Reçu le" },
            { key: "s", label: "Statut" },
          ]}
          rows={[...state.retoursPhysiques]
            .sort((a, b) => b.date_reception.localeCompare(a.date_reception))
            .map((r) => ({
              r: <span className="num font-medium">{r.reclamation_numero ?? `n°${r.reclamation}`}</span>,
              c: r.client_nom ?? "—",
              a: r.article_designation ? `${r.article_code} · ${r.article_designation}` : "—",
              q: <span className="num">{formatQty(num(r.quantite_retournee), 0)}</span>,
              l: r.lot_numero ?? "—",
              d: formatDateTime(r.date_reception),
              s: <StatusBadge tone={r.statut === "EN_QUARANTAINE" ? "warning" : "success"}>{STATUT_RETOUR_PHYSIQUE_LABEL[r.statut]}</StatusBadge>,
            }))}
        />
      </Panel>
    </div>
  );
}

function ReceptionRetour({ reclamation, peutReceptionner }: { reclamation: ReclamationAReceptionner; peutReceptionner: boolean }) {
  const { state, dispatch } = useStore();
  const [qty, setQty] = useState(String(num(reclamation.quantite)));
  const [lot, setLot] = useState(0);
  const [busy, setBusy] = useState(false);
  const lots = state.lots.filter((l) => l.article === reclamation.article);

  async function receptionner() {
    setBusy(true);
    await dispatch({ type: "CREATE_RETOUR_PHYSIQUE", reclamation: reclamation.id, quantite_retournee: Number(qty), lot: lot || undefined });
    setBusy(false);
  }

  return (
    <li className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">
          <span className="num">{reclamation.numero}</span> · {reclamation.client_nom}
        </p>
        <p className="text-[12px] text-muted">
          {reclamation.article_code} · {reclamation.article_designation} · {formatQty(num(reclamation.quantite), 0)} annoncé(s)
          {reclamation.bon_livraison_numero && ` · BL ${reclamation.bon_livraison_numero}`}
        </p>
      </div>
      {peutReceptionner && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="number" min="0" step="any" aria-label="Quantité reçue" className={cn(inputClass, "h-8 w-[100px] num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
          {lots.length > 0 && (
            <select aria-label="Lot" className={cn(inputClass, "h-8 w-[170px]")} value={lot} onChange={(e) => setLot(Number(e.target.value))}>
              <option value={0}>Lot inconnu</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.numero_lot}
                </option>
              ))}
            </select>
          )}
          <Button className="h-8" disabled={!(Number(qty) > 0) || busy} onClick={() => void receptionner()}>
            <PackageCheck size={14} /> Réceptionner
          </Button>
        </div>
      )}
    </li>
  );
}

function ControleRetourLigne({ retour, peutControler }: { retour: RetourPhysique; peutControler: boolean }) {
  const { dispatch } = useStore();
  const [resultat, setResultat] = useState<ResultatControleRetour>("RECUPERABLE_DIRECT");
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <li className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">
          <span className="num">{retour.reclamation_numero ?? `Réclamation n°${retour.reclamation}`}</span> · {retour.client_nom ?? "—"}
        </p>
        <p className="text-[12px] text-muted">
          {retour.article_designation ?? "—"} · {formatQty(num(retour.quantite_retournee), 0)} reçu(s) le {formatDateTime(retour.date_reception)}
          {retour.lot_numero && ` · lot ${retour.lot_numero}`}
        </p>
      </div>
      {peutControler && (
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Résultat du contrôle" className={cn(inputClass, "h-8 w-[230px]")} value={resultat} onChange={(e) => setResultat(e.target.value as ResultatControleRetour)}>
            {(Object.keys(RESULTAT_CONTROLE_RETOUR_LABEL) as ResultatControleRetour[]).map((k) => (
              <option key={k} value={k}>
                {RESULTAT_CONTROLE_RETOUR_LABEL[k]}
              </option>
            ))}
          </select>
          <input aria-label="Observations" placeholder="Observations" className={cn(inputClass, "h-8 w-[180px]")} value={obs} onChange={(e) => setObs(e.target.value)} />
          <Button
            className="h-8"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await dispatch({ type: "CREATE_CONTROLE_RETOUR", retour_physique: retour.id, resultat, observations: obs.trim() });
              setBusy(false);
            }}
          >
            Enregistrer le contrôle
          </Button>
        </div>
      )}
    </li>
  );
}

function ReconditionnementLigne({ id, description, peutTerminer }: { id: number; description: string; peutTerminer: boolean }) {
  const { dispatch } = useStore();
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <li className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-[13px] flex-1 min-w-0">{description || `Reconditionnement n°${id}`}</p>
      {peutTerminer && (
        <div className="flex items-center gap-2">
          <input type="number" min="0" step="any" placeholder="Qté reconditionnée" aria-label="Quantité reconditionnée" className={cn(inputClass, "h-8 w-[150px] num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
          <Button
            className="h-8"
            disabled={!(Number(qty) >= 0) || qty === "" || busy}
            onClick={async () => {
              setBusy(true);
              await dispatch({ type: "TERMINER_RECONDITIONNEMENT", id, quantite_reconditionnee: Number(qty) });
              setBusy(false);
            }}
          >
            Terminer
          </Button>
        </div>
      )}
    </li>
  );
}
