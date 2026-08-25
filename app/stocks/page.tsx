"use client";

import Link from "next/link";
import { CapacityGauge, DonutChart, KpiCard, WidgetCard } from "@/components/charts";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { availableQty, formatDa, formatQty } from "@/lib/utils";

export default function StocksPage() {
  const { state, productName, materialName } = useStore();
  const pf = state.stock.filter((s) => s.articleType === "produit" && s.depotId === "dep-pf");
  const mp = state.stock.filter((s) => s.articleType === "matiere" && s.depotId === "dep-mp");
  const pfQty = pf.reduce((a, s) => a + s.qty, 0);
  const reserved = pf.reduce((a, s) => a + s.reserved, 0);
  const available = pfQty - reserved;
  const quarantaine = state.stock.filter((s) => s.depotId === "dep-q").reduce((a, s) => a + s.qty, 0);

  const depotMix = [
    { label: "PF vendable", value: available, color: "var(--chart-2)" },
    { label: "Réservé", value: reserved || 0.001, color: "var(--chart-3)" },
    { label: "Quarantaine", value: quarantaine || 0.001, color: "var(--danger)" },
  ];

  const seuilAlerts = state.materials.filter((m) => {
    const qty = mp.filter((s) => s.articleId === m.id).reduce((a, s) => a + s.qty, 0);
    return qty < m.minStock;
  }).length;

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Stocks · Capacité"
        title="Situation"
        description="Disponible = physique − réservé. CMUP en lecture seule. Deux origines d'entrée : clôture OF (PF) ou réception fournisseur (matières)."
      />

      <div className="grid sm:grid-cols-4 gap-3">
        <KpiCard label="PF physique" value={formatQty(pfQty)} hint="Dépôt produits finis" />
        <KpiCard label="Disponible" value={formatQty(available)} tone="success" hint="Vendable immédiatement" />
        <KpiCard label="Réservé" value={formatQty(reserved)} tone="warning" hint="Commandes en cours" />
        <KpiCard label="Alertes matières" value={seuilAlerts} tone={seuilAlerts ? "danger" : "default"} hint="Sous seuil min" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetCard title="Répartition stock PF" subtitle="Disponible vs réservé vs quarantaine">
          <DonutChart data={depotMix} centerValue={formatQty(pfQty)} centerLabel="unités PF" />
        </WidgetCard>
        <WidgetCard title="Occupation dépôts" subtitle="Capacité indicative magasin">
          <div className="space-y-4">
            <CapacityGauge label="Produits finis" used={Math.min(92, Math.round((pfQty / 8000) * 100))} capacity={100} unit="%" />
            <CapacityGauge label="Matières premières" used={Math.min(88, Math.round((mp.reduce((a, s) => a + s.qty, 0) / 50000) * 100))} capacity={100} unit="%" />
            <CapacityGauge label="Quarantaine" used={Math.min(40, quarantaine ? 35 : 5)} capacity={100} unit="%" />
          </div>
        </WidgetCard>
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2 font-medium">Article</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Dépôt</th>
              <th className="text-left px-3 py-2 font-medium">Lot</th>
              <th className="text-right px-3 py-2 font-medium">Physique</th>
              <th className="text-right px-3 py-2 font-medium">Réservé</th>
              <th className="text-right px-3 py-2 font-medium">Disponible</th>
              <th className="text-right px-3 py-2 font-medium">CMUP</th>
            </tr>
          </thead>
          <tbody>
            {state.stock.map((s) => {
              const name = s.articleType === "produit" ? productName(s.articleId) : materialName(s.articleId);
              const depot = state.depots.find((d) => d.id === s.depotId);
              return (
                <tr key={s.id} className="border-b border-line hover:bg-primary-soft/30">
                  <td className="px-3 py-2">
                    <Link className="text-primary" href={`/stocks/article/${s.articleId}`}>
                      {name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={s.articleType === "produit" ? "teal" : "neutral"}>
                      {s.articleType === "produit" ? "PF" : "Matière"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    {depot?.name}
                    {depot?.kind === "quarantaine" && <span className="block text-[11px] text-danger">Non vendable</span>}
                  </td>
                  <td className="px-3 py-2 num">{s.lot ?? "—"}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(s.qty, 1)}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(s.reserved, 1)}</td>
                  <td className="px-3 py-2 text-right num font-medium">{formatQty(availableQty(s.qty, s.reserved), 1)}</td>
                  <td className="px-3 py-2 text-right num">{formatDa(s.cmup)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
