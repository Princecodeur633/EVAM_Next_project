"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_PREP_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function PreparationsPage() {
  const { state, dispatch, can } = useStore();
  const router = useRouter();
  const [commande, setCommande] = useState(state.commandes[0]?.id ?? 0);
  const cmdNum = (id: number) => state.commandes.find((c) => c.id === id)?.numero ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Distribution" title="Préparations" description="Préparez les commandes, puis confirmez la sortie magasin." />
      {can("CREATE_PREP") && (
        <Panel className="p-4 grid sm:grid-cols-2 gap-3 items-end">
          <Field label="Commande">
            <select className={inputClass} value={commande} onChange={(e) => setCommande(Number(e.target.value))}>
              {state.commandes.map((c) => <option key={c.id} value={c.id}>{c.numero}</option>)}
            </select>
          </Field>
          <Button disabled={!commande} onClick={() => void dispatch({ type: "CREATE_PREP", commande })}>Lancer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "id", label: "#" }, { key: "c", label: "Commande" }, { key: "s", label: "Statut" }, { key: "act", label: "" }]}
          rows={state.preparations.map((p) => ({
            id: p.id,
            c: cmdNum(p.commande),
            s: <StatusBadge tone="info">{STATUT_PREP_LABEL[p.statut]}</StatusBadge>,
            act: (
              <span className="flex gap-2">
                {p.statut === "A_PREPARER" && can("PREP_CONFIRMER") && (
                  <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "PREP_CONFIRMER", id: p.id })}>Confirmer préparation</button>
                )}
                {p.statut === "EN_PREPARATION" && can("PREP_SORTIE") && (
                  <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "PREP_SORTIE", id: p.id })}>Confirmer sortie</button>
                )}
              </span>
            ),
            href: `/distribution/preparations/${p.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
