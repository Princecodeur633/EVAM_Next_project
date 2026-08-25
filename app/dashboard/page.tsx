"use client";

import { KpiCard } from "@/components/charts";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { STATUT_OF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, formatQty, num } from "@/lib/utils";

export default function DashboardPage() {
  const { state, articleName } = useStore();
  const ofOpen = state.ofList.filter((o) => o.statut !== "CLOTURE").length;
  const lotsWait = state.lots.filter((l) => l.statut === "EN_ATTENTE").length;
  const stock = state.stock.reduce((a, s) => a + stockDisponible(s), 0);
  const ca = state.encaissements.reduce((a, e) => a + num(e.montant), 0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Pilotage" title="Tableau de bord" description="Vue d’ensemble de l’usine : stocks, encaissements, production et qualité." />
      <div className="grid sm:grid-cols-4 gap-3">
        <KpiCard label="Stock disponible" value={formatQty(stock, 0)} />
        <KpiCard label="Encaissements" value={formatDa(ca)} tone="success" />
        <KpiCard label="OF ouverts" value={ofOpen} tone="warning" />
        <KpiCard label="Lots en attente" value={lotsWait} tone={lotsWait ? "warning" : "success"} />
      </div>
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "OF" }, { key: "a", label: "Article" }, { key: "s", label: "Statut" }]}
          rows={state.ofList.slice(0, 8).map((o) => ({ n: o.numero, a: articleName(o.article), s: STATUT_OF_LABEL[o.statut] ?? o.statut }))}
        />
      </Panel>
    </div>
  );
}
