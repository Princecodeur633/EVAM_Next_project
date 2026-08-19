"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { availableQty, formatDa, formatQty } from "@/lib/utils";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";

export default function StocksPage() {
  const { state, productName, materialName } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Stocks" title="Situation" description="Disponible = physique − réservé. CMUP en lecture seule. Deux origines d'entrée : clôture OF (PF) ou réception fournisseur (matières)." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2 font-medium">Article</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Dépôt</th>
              <th className="text-left px-3 py-2 font-medium">Lot</th>
              <th className="text-right px-3 py-2 font-medium">Physique</th>
              <th className="text-right px-3 py-2 font-medium">Réservé</th>
              <th className="text-right px-3 py-2 font-medium">Disponible</th>
              <th className="text-right px-3 py-2 font-medium">CMUP</th>
            </tr>
          </thead>
          <tbody>
            {state.stock.map((s) => {
              const name = s.articleType === "produit" ? productName(s.articleId) : materialName(s.articleId);
              const depot = state.depots.find((d) => d.id === s.depotId);
              return (
                <tr key={s.id} className="border-b border-line">
                  <td className="px-3 py-2">
                    <Link className="text-primary" href={`/stocks/article/${s.articleId}`}>
                      {name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={s.articleType === "produit" ? "teal" : "neutral"}>
                      {s.articleType === "produit" ? "PF" : "Matière"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2">{depot?.name}</td>
                  <td className="px-3 py-2 num">{s.lot ?? "—"}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(s.qty, 1)}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(s.reserved, 1)}</td>
                  <td className="px-3 py-2 text-right num font-medium">{formatQty(availableQty(s.qty, s.reserved), 1)}</td>
                  <td className="px-3 py-2 text-right num">{formatDa(s.cmup)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
