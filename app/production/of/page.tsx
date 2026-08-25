"use client";

import { useRouter } from "next/navigation";
import { OfBadge } from "@/components/badges";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty } from "@/lib/utils";

export default function OfListPage() {
  const { state, productName } = useStore();
  const router = useRouter();

  const pipeline = [
    { label: "Planifié", value: state.ofList.filter((o) => o.status === "planifie").length },
    { label: "Prod.", value: state.ofList.filter((o) => o.status === "en_production").length },
    { label: "Fin prod.", value: state.ofList.filter((o) => o.status === "fin_production").length },
    { label: "Clôturé", value: state.ofList.filter((o) => o.status === "cloture").length },
    { label: "Bloqué", value: state.ofList.filter((o) => o.status === "bloque").length },
  ];

  const open = state.ofList.filter((o) => !["cloture", "bloque"].includes(o.status)).length;
  const waitQ = state.ofList.filter((o) => o.status === "fin_production").length;
  const plannedQty = state.ofList.reduce((a, o) => a + o.qtyPlanned, 0);

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Production · Capacité"
        title="Ordres de fabrication"
        description="Cycle : créé → planifié → en production → fin production → contrôle qualité → clôturé. La clôture qualité seule fait entrer le lot en stock PF."
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <KpiCard label="OF actifs" value={open} tone="warning" hint="Hors clôturés / bloqués" />
        <KpiCard label="Attente qualité" value={waitQ} tone={waitQ ? "warning" : "success"} hint="Lots à contrôler" />
        <KpiCard label="Volume planifié" value={formatQty(plannedQty)} hint="Somme des OF" tone="teal" />
      </div>

      <WidgetCard title="Pipeline atelier" subtitle="Répartition des OF par étape">
        <BarChart data={pipeline} height={160} />
      </WidgetCard>

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
            q: (
              <span className="num">
                {o.qtyPlanned} / {o.qtyReal}
              </span>
            ),
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
