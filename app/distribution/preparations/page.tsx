"use client";

import Link from "next/link";
import { OrderBadge } from "@/components/badges";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function PreparationsPage() {
  const { state, customerName } = useStore();
  const list = state.orders.filter((o) => !["suspendue", "annulee"].includes(o.status));
  return (
    <div>
      <PageHeader
        eyebrow="Distribution"
        title="File de préparation"
        description="Les commandes validées peuvent être préparées même avant paiement. La livraison, elle, attend la caisse."
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Commande</th>
              <th className="text-left px-3 py-2">Client</th>
              <th className="text-left px-3 py-2">Paiement</th>
              <th className="text-left px-3 py-2">Préparation</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/distribution/preparations/${o.id}`}>
                    {o.number}
                  </Link>
                </td>
                <td className="px-3 py-2">{customerName(o.customerId)}</td>
                <td className="px-3 py-2">
                  <OrderBadge status={o.status} />
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone={o.prepStatus === "complete" ? "success" : o.prepStatus === "partielle" ? "warning" : "neutral"}>
                    {o.prepStatus}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
