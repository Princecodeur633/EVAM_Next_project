"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_SESSION_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime, num } from "@/lib/utils";

export default function SessionsCaissePage() {
  const { state, dispatch, can, userName } = useStore();
  const [theo, setTheo] = useState("");
  const [compte, setCompte] = useState("");
  const [justif, setJustif] = useState("");
  const caisseNom = (id: number) => state.caisses.find((c) => c.id === id)?.nom ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Caisse" title="Sessions de caisse" description="Clôturez en indiquant le solde théorique et le solde compté. Tout écart doit être justifié." />
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Caisse" }, { key: "caissier", label: "Caissier" }, { key: "s", label: "Statut" }, { key: "o", label: "Ouverture" }, { key: "act", label: "" }]}
          rows={state.sessionsCaisse.map((s) => ({
            c: caisseNom(s.caisse),
            caissier: userName(s.caissier),
            s: <StatusBadge tone={s.statut === "OUVERTE" ? "warning" : "success"}>{STATUT_SESSION_LABEL[s.statut]}</StatusBadge>,
            o: formatDateTime(s.date_ouverture),
            act: s.statut === "OUVERTE" && can("CLOTURER_CAISSE") ? (
              <span className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                <input className="h-8 w-full sm:w-24 border border-line rounded px-2 text-[12px]" placeholder="Théorique" value={theo} onChange={(e) => setTheo(e.target.value)} />
                <input className="h-8 w-full sm:w-24 border border-line rounded px-2 text-[12px]" placeholder="Compté" value={compte} onChange={(e) => setCompte(e.target.value)} />
                <button className="text-primary text-[12px] whitespace-nowrap" onClick={() => void dispatch({ type: "CLOTURER_CAISSE", id: s.id, solde_theorique: theo, solde_compte: compte })}>Clôturer</button>
              </span>
            ) : formatDa(num(s.solde_compte_cloture)),
          }))}
        />
      </Panel>
      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Écarts de caisse</h2>
        <Field label="Justification">
          <input className={inputClass} value={justif} onChange={(e) => setJustif(e.target.value)} />
        </Field>
        {state.ecartsCaisse.map((e) => (
          <p key={e.id} className="text-[13px]">Écart {formatDa(num(e.montant_ecart))} · {e.justification}</p>
        ))}
        {can("JUSTIFIER_ECART") && state.sessionsCaisse.filter((s) => s.statut === "CLOTUREE").slice(0, 1).map((s) => (
          <Button key={s.id} disabled={!justif.trim()} onClick={() => void dispatch({ type: "JUSTIFIER_ECART", session_caisse: s.id, montant_ecart: num(s.solde_compte_cloture) - num(s.solde_theorique_cloture), justification: justif })}>
            Justifier le dernier écart
          </Button>
        ))}
      </Panel>
    </div>
  );
}
