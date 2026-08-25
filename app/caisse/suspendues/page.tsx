"use client";

import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { STATUT_FACTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function FacturesPartiellesPage() {
  const { state, clientName } = useStore();
  const rows = state.factures.filter((f) => f.statut === "PARTIELLEMENT_PAYEE" || f.statut === "EMISE");
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Caisse" title="Factures non soldées" description="Factures émises ou partiellement payées, en attente d’encaissement." />
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "c", label: "Client" }, { key: "m", label: "Montant" }, { key: "s", label: "Statut" }]}
          rows={rows.map((f) => ({
            n: f.numero,
            c: clientName(f.client),
            m: formatDa(num(f.montant_total)),
            s: <StatusBadge tone="warning">{STATUT_FACTURE_LABEL[f.statut]}</StatusBadge>,
          }))}
        />
      </Panel>
    </div>
  );
}
