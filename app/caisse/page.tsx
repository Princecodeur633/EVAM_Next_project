"use client";

import { useState } from "react";
import { Button, DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { MODE_PAIEMENT_LABEL, STATUT_FACTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";
import type { ModePaiement } from "@/lib/types";
import { telechargerFacturePdf } from "@/lib/facturePdf";

export default function CaissePage() {
  const { state, dispatch, clientName, articleName, can, currentUser } = useStore();
  // Un encaissement n'est accepté par le backend que sur la session OUVERTE
  // du caissier connecté (voir EncaissementSerializer.validate_session_caisse) :
  // ne jamais prendre "la première session ouverte" trouvée, qui pourrait
  // appartenir à un autre caissier.
  const session = state.sessionsCaisse.find((s) => s.statut === "OUVERTE" && s.caissier === currentUser?.id);
  const maCaisse = state.caisses.find((c) => c.caissier === currentUser?.id);
  const [mode, setMode] = useState<ModePaiement>("ESPECES");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Caisse"
        title="Factures et encaissements"
        description="Ouvrez une session, puis encaissez les factures en espèces, mobile money, virement ou chèque."
      />
      {!session && can("ENCAISSER") && (
        <Panel className="p-4 flex flex-wrap items-center justify-between gap-3">
          {maCaisse ? (
            <>
              <p className="text-[13px] text-muted">
                Caisse « {maCaisse.nom} » — solde repris de la dernière clôture : {formatDa(num(maCaisse.solde_actuel))}
              </p>
              <Button onClick={() => void dispatch({ type: "CREATE_SESSION" })}>Ouvrir ma session</Button>
            </>
          ) : (
            <p className="text-[13px] text-danger">
              Aucune caisse ne vous est affectée : demandez à l’Administrateur SI de vous en attribuer une (Administration → Caisses).
            </p>
          )}
        </Panel>
      )}
      {session && <p className="text-[13px] text-muted">Session ouverte · solde d’ouverture {formatDa(num(session.solde_ouverture))}</p>}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "Facture" },
            { key: "c", label: "Client" },
            { key: "m", label: "Montant" },
            { key: "s", label: "Statut" },
            { key: "pdf", label: "" },
            { key: "act", label: "" },
          ]}
          rows={state.factures.map((f) => {
            const client = state.clients.find((c) => c.id === f.client);
            const commande = state.commandes.find((c) => c.id === f.commande);
            const lignes = state.lignesFacture.filter((l) => l.facture === f.id);
            return {
              n: f.numero,
              c: clientName(f.client),
              m: formatDa(num(f.montant_total)),
              s: <StatusBadge tone={f.statut === "PAYEE" ? "success" : "warning"}>{STATUT_FACTURE_LABEL[f.statut]}</StatusBadge>,
              pdf: client && commande && lignes.length > 0 ? (
                <button
                  className="text-primary text-[12px] whitespace-nowrap"
                  onClick={() => telechargerFacturePdf({ facture: f, client, commande, lignes, articleName })}
                >
                  PDF
                </button>
              ) : "—",
              act: session && f.statut === "EMISE" && can("ENCAISSER") ? (
                <span className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <select className="h-8 border border-line rounded px-1 text-[12px]" value={mode} onChange={(e) => setMode(e.target.value as ModePaiement)}>
                    {(Object.keys(MODE_PAIEMENT_LABEL) as ModePaiement[]).map((k) => <option key={k} value={k}>{MODE_PAIEMENT_LABEL[k]}</option>)}
                  </select>
                  <button className="text-primary text-[12px] whitespace-nowrap" onClick={() => void dispatch({ type: "ENCAISSER", session_caisse: session.id, facture: f.id, montant: num(f.montant_total), mode_paiement: mode })}>
                    Encaisser
                  </button>
                </span>
              ) : "—",
            };
          })}
        />
      </Panel>
    </div>
  );
}
