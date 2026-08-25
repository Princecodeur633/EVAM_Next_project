"use client";

import { useRouter } from "next/navigation";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function StocksPage() {
  const { state, articleName } = useStore();
  const router = useRouter();
  const depotName = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Stocks"
        title="Situation de stock"
        description="Disponible = quantité physique − bloquée − réservée, par dépôt."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "a", label: "Article" },
            { key: "d", label: "Dépôt" },
            { key: "p", label: "Physique" },
            { key: "b", label: "Bloquée" },
            { key: "r", label: "Réservée" },
            { key: "v", label: "Disponible" },
          ]}
          rows={state.stock.map((s) => ({
            a: articleName(s.article),
            d: depotName(s.depot),
            p: formatQty(Number(s.quantite_physique), 2),
            b: formatQty(Number(s.quantite_bloquee), 2),
            r: formatQty(Number(s.quantite_reservee), 2),
            v: formatQty(stockDisponible(s), 2),
            href: `/stocks/article/${s.article}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
