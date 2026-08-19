"use client";

import Link from "next/link";
import { ClaimBadge } from "@/components/badges";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ReclamationsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="P2 — maquette prévue" title="Réclamations" description="Lien commande / lot / BL. Décision : quarantaine, acceptation, rejet." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">N°</th>
              <th className="text-left px-3 py-2">Commande</th>
              <th className="text-left px-3 py-2">Lot</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.claims.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/reclamations/${c.id}`}>
                    {c.number}
                  </Link>
                </td>
                <td className="px-3 py-2 num">{state.orders.find((o) => o.id === c.orderId)?.number}</td>
                <td className="px-3 py-2 num">{c.lot}</td>
                <td className="px-3 py-2">
                  <ClaimBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
