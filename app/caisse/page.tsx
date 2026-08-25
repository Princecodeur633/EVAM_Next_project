"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { MODE_PAIEMENT_LABEL, STATUT_FACTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";
import type { ModePaiement } from "@/lib/types";

export default function CaissePage() {
  const { state, dispatch, clientName, can } = useStore();
  const session = state.sessionsCaisse.find((s) => s.statut === "OUVERTE");
  const [mode, setMode] = useState<ModePaiement>("ESPECES");
  const [caisse, setCaisse] = useState(state.caisses[0]?.id ?? 0);
  const [solde, setSolde] = useState(0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Caisse"
        title="Factures et encaissements"
        description="Ouvrez une session, puis encaissez les factures en espèces, mobile money, virement ou chèque."
      />
      {!session && can("ENCAISSER") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Caisse">
            <select className={inputClass} value={caisse} onChange={(e) => setCaisse(Number(e.target.value))}>
              {state.caisses.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Solde d'ouverture">
            <input type="number" className={inputClass} value={solde} onChange={(e) => setSolde(Number(e.target.value))} />
          </Field>
          <Button disabled={!caisse} onClick={() => void dispatch({ type: "CREATE_SESSION", caisse, solde_ouverture: solde })}>Ouvrir session</Button>
        </Panel>
      )}
      {session && <p className="text-[13px] text-muted">Session ouverte · solde d’ouverture {formatDa(num(session.solde_ouverture))}</p>}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "Facture" }, { key: "c", label: "Client" }, { key: "m", label: "Montant" }, { key: "s", label: "Statut" }, { key: "act", label: "" }]}
          rows={state.factures.map((f) => ({
            n: f.numero,
            c: clientName(f.client),
            m: formatDa(num(f.montant_total)),
            s: <StatusBadge tone={f.statut === "PAYEE" ? "success" : "warning"}>{STATUT_FACTURE_LABEL[f.statut]}</StatusBadge>,
            act: session && f.statut === "EMISE" && can("ENCAISSER") ? (
              <span className="flex gap-2 items-center">
                <select className="h-8 border border-line rounded px-1 text-[12px]" value={mode} onChange={(e) => setMode(e.target.value as ModePaiement)}>
                  {(Object.keys(MODE_PAIEMENT_LABEL) as ModePaiement[]).map((k) => <option key={k} value={k}>{MODE_PAIEMENT_LABEL[k]}</option>)}
                </select>
                <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "ENCAISSER", session_caisse: session.id, facture: f.id, montant: num(f.montant_total), mode_paiement: mode })}>
                  Encaisser
                </button>
              </span>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
