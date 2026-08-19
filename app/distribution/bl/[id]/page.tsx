"use client";

import { useParams } from "next/navigation";
import { BlBadge } from "@/components/badges";
import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function BlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, customerName, productName } = useStore();
  const bl = state.deliveryNotes.find((b) => b.id === id);
  const order = state.orders.find((o) => o.id === bl?.orderId);
  const invoice = state.invoices.find((i) => i.id === order?.invoiceId);
  if (!bl || !order || !invoice) return <p>BL introuvable</p>;
  const paid = invoice.status === "payee";

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Bon de livraison" title={bl.number} status={<BlBadge status={bl.status} />} description={customerName(order.customerId)} />
      {paid ? (
        <Guard variant="ok" title="Facture payée — livraison autorisée">
          {invoice.number} · {formatDa(invoice.amount)}
        </Guard>
      ) : (
        <Guard
          variant="block"
          title="Livraison interdite — facture non payée"
          action={
            <a href={`/caisse/encaissement/${invoice.id}`} className="text-[13px] text-primary underline">
              Aller à la caisse
            </a>
          }
        >
          La préparation a pu avancer. Le BL reste verrouillé tant que {invoice.number} n'est pas encaissée.
        </Guard>
      )}
      <Panel className="p-4">
        {order.lines.map((l) => (
          <p key={l.productId} className="text-[13px]">
            {productName(l.productId)} · {l.qty}
          </p>
        ))}
        <div className="flex gap-2 mt-4">
          <Button disabled={!paid || bl.status === "livre"} onClick={() => dispatch({ type: "VALIDATE_BL", orderId: order.id })}>
            Valider le BL
          </Button>
          <Button variant="secondary" disabled={!paid || bl.status === "verrouille"} onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
      </Panel>
    </div>
  );
}
