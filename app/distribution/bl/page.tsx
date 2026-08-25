"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlBadge } from "@/components/badges";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function BlListPage() {
  const { state, dispatch, can } = useStore();
  const router = useRouter();
  const [commande, setCommande] = useState(state.commandes[0]?.id ?? 0);
  const [tournee, setTournee] = useState(state.tournees[0]?.id ?? 0);
  const cmdNum = (id: number) => state.commandes.find((c) => c.id === id)?.numero ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Distribution" title="Bons de livraison" description="Confirmez la livraison et enregistrez la signature du client." />
      {can("CREATE_BL") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Commande">
            <select className={inputClass} value={commande} onChange={(e) => setCommande(Number(e.target.value))}>
              {state.commandes.map((c) => <option key={c.id} value={c.id}>{c.numero}</option>)}
            </select>
          </Field>
          <Field label="Tournée">
            <select className={inputClass} value={tournee} onChange={(e) => setTournee(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.tournees.map((t) => <option key={t.id} value={t.id}>{t.numero}</option>)}
            </select>
          </Field>
          <Button disabled={!commande} onClick={() => void dispatch({ type: "CREATE_BL", commande, tournee: tournee || undefined })}>Créer BL</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "c", label: "Commande" }, { key: "s", label: "Statut" }, { key: "sig", label: "Signature" }]}
          rows={state.bonsLivraison.map((b) => ({
            n: b.numero,
            c: cmdNum(b.commande),
            s: <BlBadge status={b.statut} />,
            sig: b.signature_client ? "Oui" : "Non",
            href: `/distribution/bl/${b.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
