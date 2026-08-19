"use client";

import { useParams } from "next/navigation";
import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function PreparationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, productName } = useStore();
  const order = state.orders.find((o) => o.id === id);
  if (!order) return <p>Commande introuvable</p>;
  const invoice = state.invoices.find((i) => i.id === order.invoiceId);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Préparation" title={order.number} />
      {invoice?.status !== "payee" ? (
        <Guard variant="warn" title="Facture non payée — la préparation peut continuer">
          Le BL restera verrouillé. Préparer n'autorise pas à livrer.
        </Guard>
      ) : (
        <Guard variant="ok" title="Facture payée">
          Après préparation complète, le BL peut être validé.
        </Guard>
      )}
      <Panel className="p-4">
        {order.lines.map((l) => (
          <p key={l.productId} className="text-[13px]">
            {productName(l.productId)} · {l.qty}
          </p>
        ))}
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={() => dispatch({ type: "PREPARE_ORDER", orderId: order.id, status: "partielle" })}>
            Partielle
          </Button>
          <Button onClick={() => dispatch({ type: "PREPARE_ORDER", orderId: order.id, status: "complete" })}>Complète</Button>
        </div>
      </Panel>
    </div>
  );
}
