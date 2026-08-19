"use client";

import Link from "next/link";
import { OrderBadge } from "@/components/badges";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function CaissePage() {
  const { state, customerName } = useStore();
  const aPayer = state.invoices.filter((i) => i.status === "a_payer");
  return (
    <div>
      <PageHeader
        eyebrow="Caisse"
        title="Encaissements du jour"
        description="Espèces, CB ou virement selon le type client. Un échec suspend la facture, libère le stock, et interdit Sage."
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
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
                <tr key={inv.id} className="border-b border-line">
                  <td className="px-3 py-2 num font-medium">{inv.number}</td>
                  <td className="px-3 py-2">{order ? customerName(order.customerId) : "—"}</td>
                  <td className="px-3 py-2 text-right num">{formatDa(inv.amount)}</td>
                  <td className="px-3 py-2">{order && <OrderBadge status={order.status} />}</td>
                  <td className="px-3 py-2">
                    <Link href={`/caisse/encaissement/${inv.id}`} className="inline-flex items-center h-8 px-3 text-[13px] font-medium rounded-[6px] bg-primary text-white">
                      Encaisser
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
