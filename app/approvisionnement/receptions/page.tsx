"use client";

import Link from "next/link";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ReceptionsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Approvisionnement" title="Réceptions" description="Écarts commandé / reçu. Seule la réception conforme (ou écart validé) entre en stock matières." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">N°</th>
              <th className="text-left px-3 py-2">Commande</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.receptions.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/approvisionnement/receptions/${r.id}`}>
                    {r.number}
                  </Link>
                </td>
                <td className="px-3 py-2 num">{state.purchaseOrders.find((p) => p.id === r.poId)?.number}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={r.status === "ecart" ? "warning" : "success"}>{r.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
