"use client";

import Link from "next/link";
import { Button, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function InventairesPage() {
  const { state, dispatch, can } = useStore();
  return (
    <div>
      <PageHeader
        eyebrow="Stocks"
        title="Inventaires"
        description="Session de comptage : théorique vs physique, puis validation des écarts (écriture d'ajustement, CMUP inchangé)."
        actions={
          can("OPEN_INVENTORY") ? (
            <Button onClick={() => dispatch({ type: "OPEN_INVENTORY", depotId: state.depotId })}>
              Ouvrir une session ({state.depots.find((d) => d.id === state.depotId)?.name})
            </Button>
          ) : undefined
        }
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2 font-medium">Session</th>
              <th className="text-left px-3 py-2 font-medium">Dépôt</th>
              <th className="text-left px-3 py-2 font-medium">Date</th>
              <th className="text-left px-3 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.inventories.map((inv) => (
              <tr key={inv.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/stocks/inventaires/${inv.id}`}>
                    {inv.id}
                  </Link>
                </td>
                <td className="px-3 py-2">{state.depots.find((d) => d.id === inv.depotId)?.name}</td>
                <td className="px-3 py-2 num">{inv.date}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={inv.status === "valide" ? "success" : inv.status === "compte" ? "warning" : "info"}>
                    {inv.status}
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
