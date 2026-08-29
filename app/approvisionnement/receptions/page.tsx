"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function ReceptionsPage() {
  const { state, dispatch, can, userName } = useStore();
  const router = useRouter();
  const [commande, setCommande] = useState(state.commandesFournisseur[0]?.id ?? 0);
  const cfNum = (id: number) => state.commandesFournisseur.find((c) => c.id === id)?.numero ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Magasin" title="Réceptions achat" description="Enregistrez les quantités reçues. Le statut de la commande fournisseur se met à jour automatiquement." />
      {can("CREATE_RECEPTION") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <Field label="Commande fournisseur">
            <select className={inputClass} value={commande} onChange={(e) => setCommande(Number(e.target.value))}>
              {state.commandesFournisseur.map((c) => <option key={c.id} value={c.id}>{c.numero}</option>)}
            </select>
          </Field>
          <Button disabled={!commande} onClick={() => void dispatch({ type: "CREATE_RECEPTION", commande })}>Créer réception</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Commande" }, { key: "p", label: "Réceptionnée par" }, { key: "ok", label: "Conforme" }, { key: "d", label: "Date" }]}
          rows={state.receptions.map((r) => ({
            c: cfNum(r.commande),
            p: userName(r.receptionne_par),
            ok: r.conforme ? "Oui" : "Non",
            d: formatDateTime(r.date_reception),
            href: `/approvisionnement/receptions/${r.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
