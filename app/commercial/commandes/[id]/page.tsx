"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OrderBadge } from "@/components/badges";
import { Guard, ORDER_STEPS, PageHeader, Panel, StatusStepper } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, productName, customerName } = useStore();
  const order = state.orders.find((o) => o.id === id);
  if (!order) return <p>Commande introuvable</p>;
  const invoice = state.invoices.find((i) => i.id === order.invoiceId);
  const bl = state.deliveryNotes.find((b) => b.orderId === order.id);
  const customer = state.customers.find((c) => c.id === order.customerId);
  const step =
    order.status === "suspendue" || order.status === "annulee"
      ? "a_payer"
      : order.status === "payee"
        ? "payee"
        : order.status;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Commande" title={order.number} status={<OrderBadge status={order.status} />} description={customerName(order.customerId)} />
      <StatusStepper steps={ORDER_STEPS} current={step} />

      {order.status === "suspendue" && (
        <Guard variant="block" title="Facture suspendue — stock libéré, non transférable en comptabilité">
          Motif : {order.suspendReason}. Une facture suspendue n'est jamais exportée vers Sage 100.
        </Guard>
      )}
      {invoice?.status === "a_payer" && (
        <Guard variant="warn" title="Paiement et préparation en parallèle — livraison verrouillée">
          Le préparateur peut avancer. Le BL reste bloqué tant que la caisse n'a pas encaissé.
        </Guard>
      )}
      {invoice?.status === "payee" && order.status !== "livree" && (
        <Guard variant="ok" title="Payée — livraison autorisée">
          Le PaymentGuard du BL est levé.
        </Guard>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-4 lg:col-span-2">
          <h2 className="text-[13px] font-semibold mb-2">Lignes</h2>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted">
                <th className="text-left py-1">Produit</th>
                <th className="text-right py-1">Qté</th>
                <th className="text-right py-1">PU HT</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.productId} className="border-t border-line">
                  <td className="py-1.5">{productName(l.productId)}</td>
                  <td className="py-1.5 text-right num">{l.qty}</td>
                  <td className="py-1.5 text-right num">{formatDa(l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel className="p-4 space-y-2 text-[13px]">
          <h2 className="text-[13px] font-semibold">Objets liés</h2>
          <p>
            Facture{" "}
            <Link className="text-primary num" href="/caisse">
              {invoice?.number}
            </Link>{" "}
            · {formatDa(invoice?.amount ?? 0)}
          </p>
          <p>
            Préparation : {order.prepStatus}{" "}
            <Link className="text-primary" href="/distribution/preparations">
              file
            </Link>
          </p>
          <p>
            BL{" "}
            <Link className="text-primary num" href={bl ? `/distribution/bl/${bl.id}` : "/distribution/bl"}>
              {bl?.number}
            </Link>
          </p>
          <p>Client {customer?.type} · moyens {customer?.paymentMethods.join(", ")}</p>
        </Panel>
      </div>
    </div>
  );
}
