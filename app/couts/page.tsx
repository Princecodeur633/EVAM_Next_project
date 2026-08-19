"use client";

import Link from "next/link";
import { OfBadge } from "@/components/badges";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function CoutsPage() {
  const { state, productName } = useStore();
  const closed = state.ofList.filter((o) => o.cost);
  return (
    <div>
      <PageHeader eyebrow="Coûts" title="Coût des OF" description="CMUP × consommation réelle. Le coût se lit dans le flux, pas dans un export isolé." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">OF</th>
              <th className="text-left px-3 py-2">Produit</th>
              <th className="text-right px-3 py-2">Coût</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.ofList.map((o) => (
              <tr key={o.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/production/of/${o.id}`}>
                    {o.id}
                  </Link>
                </td>
                <td className="px-3 py-2">{productName(o.productId)}</td>
                <td className="px-3 py-2 text-right num">{o.cost ? formatDa(o.cost) : "À la clôture"}</td>
                <td className="px-3 py-2">
                  <OfBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {closed.length === 0 && <p className="text-[13px] text-muted mt-3">Aucun OF clôturé avec coût calculé pour le moment.</p>}
    </div>
  );
}
