"use client";

import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function CommandesFournisseursPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Approvisionnement" title="Commandes fournisseurs" description="Issus des DA validées. La réception mesurera l'écart commandé / reçu." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">N°</th>
              <th className="text-left px-3 py-2">Fournisseur</th>
              <th className="text-left px-3 py-2">DA</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.purchaseOrders.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-3 py-2 num">{p.number}</td>
                <td className="px-3 py-2">{state.suppliers.find((s) => s.id === p.supplierId)?.name}</td>
                <td className="px-3 py-2 num">{state.purchaseRequests.find((d) => d.id === p.daId)?.number}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={p.status === "recue" ? "success" : "warning"}>{p.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
