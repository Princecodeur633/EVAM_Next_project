"use client";

import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty } from "@/lib/utils";

const TONE = {
  entree: "success" as const,
  sortie: "warning" as const,
  retour: "info" as const,
  transfert: "teal" as const,
  ajustement: "neutral" as const,
};

export default function MouvementsPage() {
  const { state, productName, materialName } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Stocks" title="Mouvements" description="Entrées, sorties, retours, transferts. Chaque ligne porte son CMUP." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2 font-medium">Date</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Article</th>
              <th className="text-right px-3 py-2 font-medium">Qté</th>
              <th className="text-left px-3 py-2 font-medium">Origine</th>
              <th className="text-left px-3 py-2 font-medium">Lot</th>
            </tr>
          </thead>
          <tbody>
            {state.movements.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2">{formatDateTime(m.at)}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={TONE[m.type]}>{m.type}</StatusBadge>
                </td>
                <td className="px-3 py-2">{m.articleType === "produit" ? productName(m.articleId) : materialName(m.articleId)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(m.qty, 1)}</td>
                <td className="px-3 py-2">{m.origin}</td>
                <td className="px-3 py-2 num">{m.lot ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
