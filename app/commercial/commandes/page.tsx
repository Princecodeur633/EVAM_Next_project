"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderBadge } from "@/components/badges";
import { BarChart, DonutChart, KpiCard, WidgetCard } from "@/components/charts";
import { Button, DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime } from "@/lib/utils";

export default function CommandesPage() {
  const { state, customerName } = useStore();
  const router = useRouter();

  const active = state.orders.filter((o) => !["livree", "annulee", "suspendue"].includes(o.status));
  const ca = state.orders.reduce((a, o) => {
    const inv = state.invoices.find((i) => i.id === o.invoiceId);
    return a + (inv?.amount ?? 0);
  }, 0);

  const statusMix = [
    { label: "À payer", value: state.orders.filter((o) => o.status === "a_payer").length || 0.001, color: "var(--chart-3)" },
    { label: "Payées", value: state.orders.filter((o) => o.status === "payee").length || 0.001, color: "var(--chart-5)" },
    { label: "Livrées", value: state.orders.filter((o) => o.status === "livree").length || 0.001, color: "var(--chart-2)" },
    { label: "Suspendues", value: state.orders.filter((o) => o.status === "suspendue").length || 0.001, color: "var(--danger)" },
  ];

  const prepBars = [
    { label: "À préparer", value: state.orders.filter((o) => o.prepStatus === "a_preparer").length },
    { label: "Partielle", value: state.orders.filter((o) => o.prepStatus === "partielle").length },
    { label: "Complète", value: state.orders.filter((o) => o.prepStatus === "complete").length },
  ];

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Commercial · Performance"
        title="Commandes clients"
        description="Aucune commande n'est validée sans vérification du stock disponible (physique − déjà réservé)."
        actions={
          <Link href="/commercial/commandes/nouvelle">
            <Button>Nouvelle commande</Button>
          </Link>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <KpiCard label="Commandes actives" value={active.length} tone="warning" hint="Hors livrées / annulées" />
        <KpiCard label="CA commandé" value={formatDa(ca)} tone="success" hint="Montant factures liées" />
        <KpiCard
          label="Suspendues"
          value={state.orders.filter((o) => o.status === "suspendue").length}
          tone="danger"
          hint="Paiement échoué"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetCard title="Portefeuille commandes" subtitle="Répartition par statut">
          <DonutChart data={statusMix} centerValue={String(state.orders.length)} centerLabel="total" />
        </WidgetCard>
        <WidgetCard title="Préparation" subtitle="Avancement logistique des commandes">
          <BarChart data={prepBars} height={160} />
        </WidgetCard>
      </div>

      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Client" },
            { key: "st", label: "Statut" },
            { key: "m", label: "Montant" },
            { key: "at", label: "Créée" },
          ]}
          rows={state.orders.map((o) => {
            const inv = state.invoices.find((i) => i.id === o.invoiceId);
            return {
              href: `/commercial/commandes/${o.id}`,
              n: <span className="num font-medium">{o.number}</span>,
              c: customerName(o.customerId),
              st: <OrderBadge status={o.status} />,
              m: <span className="num">{formatDa(inv?.amount ?? 0)}</span>,
              at: formatDateTime(o.createdAt),
            };
          })}
          onRowClick={(r) => router.push(String(r.href))}
        />
      </Panel>
    </div>
  );
}
