"use client";

import Link from "next/link";
import { OrderBadge } from "@/components/badges";
import { DonutChart, KpiCard, SparkBars, WidgetCard } from "@/components/charts";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function CaissePage() {
  const { state, customerName } = useStore();
  const aPayer = state.invoices.filter((i) => i.status === "a_payer");
  const payees = state.invoices.filter((i) => i.status === "payee");
  const suspendues = state.invoices.filter((i) => i.status === "suspendue");
  const aEncaisser = aPayer.reduce((a, i) => a + i.amount, 0);
  const encaissé = state.payments.filter((p) => p.success).reduce((a, p) => a + p.amount, 0);

  const mix = [
    { label: "À encaisser", value: aPayer.length || 0.001, color: "var(--chart-3)" },
    { label: "Payées", value: payees.length, color: "var(--chart-5)" },
    { label: "Suspendues", value: suspendues.length || 0.001, color: "var(--danger)" },
  ];

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Caisse · Finance"
        title="Encaissements du jour"
        description="Espèces, CB ou virement selon le type client. Un échec suspend la facture, libère le stock, et interdit Sage."
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <KpiCard label="À encaisser" value={formatDa(aEncaisser)} tone="warning" hint={`${aPayer.length} facture(s)`} />
        <KpiCard label="Déjà encaissé" value={formatDa(encaissé)} tone="success" hint="Paiements réussis" />
        <KpiCard
          label="Session caisse"
          value={state.cashSession.open ? "Ouverte" : "Clôturée"}
          hint={`Théorique ${formatDa(state.cashSession.theoretical)}`}
          tone={state.cashSession.open ? "teal" : "default"}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Panel>
          <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-surface-2">
            <h2 className="text-[13px] font-semibold">File à encaisser</h2>
            <SparkBars values={[12, 18, 9, 22, 15, 28, 20]} tone="success" />
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted border-b border-line">
                <th className="text-left px-3 py-2">Facture</th>
                <th className="text-left px-3 py-2">Client</th>
                <th className="text-right px-3 py-2">Montant</th>
                <th className="text-left px-3 py-2">Commande</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {aPayer.map((inv) => {
                const order = state.orders.find((o) => o.id === inv.orderId);
                return (
                  <tr key={inv.id} className="border-b border-line hover:bg-primary-soft/40">
                    <td className="px-3 py-2 num font-medium">{inv.number}</td>
                    <td className="px-3 py-2">{order ? customerName(order.customerId) : "—"}</td>
                    <td className="px-3 py-2 text-right num">{formatDa(inv.amount)}</td>
                    <td className="px-3 py-2">{order && <OrderBadge status={order.status} />}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/caisse/encaissement/${inv.id}`}
                        className="inline-flex items-center h-8 px-3 text-[13px] font-medium rounded-[7px] bg-primary text-white hover:bg-primary-hover"
                      >
                        Encaisser
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {aPayer.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted text-[13px]">
                    Aucune facture à encaisser.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <WidgetCard title="Répartition" subtitle="Statuts factures">
          <DonutChart data={mix} centerValue={String(aPayer.length)} centerLabel="en file" />
          <Link href="/caisse/suspendues" className="mt-4 block text-[12px] text-primary font-medium hover:underline">
            Voir les factures suspendues →
          </Link>
        </WidgetCard>
      </div>
    </div>
  );
}
