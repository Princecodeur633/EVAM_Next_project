"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatDa, formatQty } from "@/lib/utils";
import { DataTable, Metric, PageHeader, Panel } from "@/components/ui";
import { OfBadge, OrderBadge } from "@/components/badges";

export default function DashboardPage() {
  const { state, productName, customerName } = useStore();
  const stockPf = state.stock.filter((s) => s.articleType === "produit");
  const caJour = state.payments.filter((p) => p.success && p.at.startsWith("2026-08-19")).reduce((a, p) => a + p.amount, 0);
  const ofOpen = state.ofList.filter((o) => !["cloture", "bloque"].includes(o.status)).length;
  const suspendues = state.invoices.filter((i) => i.status === "suspendue").length;
  const alertes = state.materials.filter((m) => {
    const qty = state.stock.filter((s) => s.articleId === m.id).reduce((a, s) => a + s.qty, 0);
    return qty < m.minStock;
  }).length;

  return (
    <div>
      <PageHeader
        eyebrow="Direction"
        title="Tableau de bord"
        description="Indicateurs vitaux uniquement — pas un reporting de module. Drill-down vers le flux réel."
      />
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <Metric label="Stock PF (unités)" value={formatQty(stockPf.reduce((a, s) => a + s.qty, 0))} hint="Lots vendables uniquement" />
        <Metric label="CA du jour" value={formatDa(caJour)} hint="Encaissements réussis" tone="success" />
        <Metric label="OF en cours" value={ofOpen} hint="Hors clôturés / bloqués" tone="warning" />
        <Metric label="Factures suspendues" value={suspendues} hint="Jamais exportables Sage" tone="danger" />
        <Metric label="Alertes seuils" value={alertes} hint="Matières sous minimum" tone={alertes ? "warning" : "default"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel>
          <div className="px-4 py-3 border-b border-line flex justify-between">
            <h2 className="text-[13px] font-semibold">Ordres de fabrication actifs</h2>
            <Link href="/production/of" className="text-[12px] text-primary">Voir les OF</Link>
          </div>
          <DataTable
            columns={[
              { key: "id", label: "OF" },
              { key: "p", label: "Produit" },
              { key: "st", label: "Statut" },
              { key: "lot", label: "Lot", className: "num" },
            ]}
            rows={state.ofList
              .filter((o) => o.status !== "cloture")
              .map((o) => ({
                href: `/production/of/${o.id}`,
                id: <span className="num">{o.id}</span>,
                p: productName(o.productId),
                st: <OfBadge status={o.status} />,
                lot: o.lot ?? "—",
              }))}
          />
        </Panel>
        <Panel>
          <div className="px-4 py-3 border-b border-line flex justify-between">
            <h2 className="text-[13px] font-semibold">Commandes du jour</h2>
            <Link href="/commercial/commandes" className="text-[12px] text-primary">Commercial</Link>
          </div>
          <DataTable
            columns={[
              { key: "n", label: "Commande" },
              { key: "c", label: "Client" },
              { key: "st", label: "Statut" },
            ]}
            rows={state.orders.map((o) => ({
              n: <span className="num">{o.number}</span>,
              c: customerName(o.customerId),
              st: <OrderBadge status={o.status} />,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
