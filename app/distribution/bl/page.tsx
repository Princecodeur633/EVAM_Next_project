"use client";

import Link from "next/link";
import { BlBadge } from "@/components/badges";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function BlListPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Distribution" title="Bons de livraison" description="Un BL impayé est verrouillé. Pas d'action primaire « valider »." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">BL</th>
              <th className="text-left px-3 py-2">Commande</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.deliveryNotes.map((b) => (
              <tr key={b.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/distribution/bl/${b.id}`}>
                    {b.number}
                  </Link>
                </td>
                <td className="px-3 py-2 num">{state.orders.find((o) => o.id === b.orderId)?.number}</td>
                <td className="px-3 py-2">
                  <BlBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
