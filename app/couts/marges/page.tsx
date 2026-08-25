"use client";

import { BarChart, DonutChart, KpiCard, WidgetCard } from "@/components/charts";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function MargesPage() {
  const { state, productName } = useStore();

  const rows = state.products.map((p) => {
    const cmup = state.stock.find((s) => s.articleId === p.id && s.depotId === "dep-pf")?.cmup ?? 0;
    const marge = p.priceHt - cmup;
    const rate = p.priceHt ? (marge / p.priceHt) * 100 : 0;
    return { p, cmup, marge, rate };
  });

  const best = [...rows].sort((a, b) => b.marge - a.marge)[0];
  const avgRate = rows.length ? rows.reduce((a, r) => a + r.rate, 0) / rows.length : 0;
  const chart = rows.map((r) => ({ label: r.p.name.split(" ")[0], value: Math.round(r.marge) }));
  const mix = rows.map((r, i) => ({
    label: r.p.name.split(" ")[0],
    value: Math.max(0, r.marge),
    color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"][i % 3],
  }));

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Finance · Marges"
        title="Marges produits"
        description="Prix de vente catalogue vs coût de revient (CMUP stock PF). Lecture pour la comptabilité et la direction."
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <KpiCard label="Taux de marge moyen" value={`${avgRate.toFixed(1)} %`} tone="success" hint="Sur le catalogue actif" />
        <KpiCard
          label="Meilleure marge"
          value={formatDa(Math.max(...rows.map((r) => r.marge), 0))}
          tone="teal"
          hint={best?.p.name}
        />
        <KpiCard label="Références suivies" value={rows.length} hint="Produits finis actifs" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetCard title="Marge unitaire (DA)" subtitle="Prix HT − CMUP">
          <BarChart data={chart} height={180} format={(n) => formatDa(n)} />
        </WidgetCard>
        <WidgetCard title="Contribution relative" subtitle="Part de chaque famille dans la marge">
          <DonutChart data={mix} centerLabel="marge" centerValue="mix" />
        </WidgetCard>
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Produit</th>
              <th className="text-right px-3 py-2">Prix HT</th>
              <th className="text-right px-3 py-2">CMUP PF</th>
              <th className="text-right px-3 py-2">Marge unitaire</th>
              <th className="text-right px-3 py-2">Taux</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.p.id} className="border-b border-line">
                <td className="px-3 py-2">{productName(r.p.id)}</td>
                <td className="px-3 py-2 text-right num">{formatDa(r.p.priceHt)}</td>
                <td className="px-3 py-2 text-right num">{formatDa(r.cmup)}</td>
                <td className="px-3 py-2 text-right">
                  <StatusBadge tone={r.marge > 0 ? "success" : "danger"}>{formatDa(r.marge)}</StatusBadge>
                </td>
                <td className="px-3 py-2 text-right num">{r.rate.toFixed(1)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
