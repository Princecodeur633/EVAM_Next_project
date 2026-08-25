"use client";

import Link from "next/link";
import { OfBadge } from "@/components/badges";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function CoutsPage() {
  const { state, productName } = useStore();
  const closed = state.ofList.filter((o) => o.cost);
  const totalCost = closed.reduce((a, o) => a + (o.cost ?? 0), 0);
  const avgCost = closed.length ? totalCost / closed.length : 0;

  const byProduct = state.products.map((p) => ({
    label: p.name.split(" ")[0],
    value: Math.round(
      state.ofList.filter((o) => o.productId === p.id && o.cost).reduce((a, o) => a + (o.cost ?? 0), 0),
    ),
  }));

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Coûts · Performance"
        title="Coût des OF"
        description="CMUP × consommation réelle. Le coût se lit dans le flux, pas dans un export isolé."
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <KpiCard label="OF valorisés" value={closed.length} hint="Après clôture qualité" />
        <KpiCard label="Coût cumulé" value={formatDa(totalCost)} tone="teal" hint="Somme des OF clôturés" />
        <KpiCard label="Coût moyen / OF" value={formatDa(avgCost)} hint="Indicateur atelier" />
      </div>

      <WidgetCard title="Répartition des coûts par famille produit" subtitle="Lecture performance production">
        <BarChart data={byProduct} height={180} format={(n) => formatDa(n)} />
      </WidgetCard>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">OF</th>
              <th className="text-left px-3 py-2">Produit</th>
              <th className="text-right px-3 py-2">Coût</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.ofList.map((o) => (
              <tr key={o.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/production/of/${o.id}`}>
                    {o.id}
                  </Link>
                </td>
                <td className="px-3 py-2">{productName(o.productId)}</td>
                <td className="px-3 py-2 text-right num">{o.cost ? formatDa(o.cost) : "À la clôture"}</td>
                <td className="px-3 py-2">
                  <OfBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
