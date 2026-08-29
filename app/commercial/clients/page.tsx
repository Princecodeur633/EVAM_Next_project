"use client";

import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { TYPE_CLIENT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function ClientsPage() {
  const { state } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Ventes" title="Clients" description="Particuliers, sociétés et clients sous contrat. Un client bloqué ne peut plus commander." />
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Code" }, { key: "n", label: "Nom" }, { key: "t", label: "Type" }, { key: "e", label: "Encours" }, { key: "b", label: "Bloqué" }]}
          rows={state.clients.map((c) => ({
            c: c.code,
            n: c.nom,
            t: TYPE_CLIENT_LABEL[c.type_client] ?? c.type_client,
            e: formatDa(num(c.encours_autorise)),
            b: c.bloque ? <StatusBadge tone="danger">Oui</StatusBadge> : <StatusBadge tone="success">Non</StatusBadge>,
          }))}
        />
      </Panel>
    </div>
  );
}
