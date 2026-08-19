"use client";

import { useRouter } from "next/navigation";
import { OfBadge } from "@/components/badges";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function OfListPage() {
  const { state, productName } = useStore();
  const router = useRouter();
  return (
    <div>
      <PageHeader
        eyebrow="Production"
        title="Ordres de fabrication"
        description="Cycle : créé → planifié → en production → fin production → contrôle qualité → clôturé. La clôture qualité seule fait entrer le lot en stock PF."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "id", label: "OF" },
            { key: "p", label: "Produit" },
            { key: "q", label: "Prévu / réel" },
            { key: "st", label: "Statut" },
            { key: "lot", label: "Lot" },
            { key: "at", label: "Créé" },
          ]}
          rows={state.ofList.map((o) => ({
            id: <span className="num font-medium">{o.id}</span>,
            p: productName(o.productId),
            q: <span className="num">{o.qtyPlanned} / {o.qtyReal}</span>,
            st: <OfBadge status={o.status} />,
            lot: <span className="num">{o.lot ?? "—"}</span>,
            at: formatDateTime(o.createdAt),
            href: `/production/of/${o.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
