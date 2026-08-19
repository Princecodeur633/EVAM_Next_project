"use client";

import { useParams } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime, formatQty } from "@/lib/utils";

export default function StockArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { state, productName, materialName } = useStore();
  const name = productName(id) !== id ? productName(id) : materialName(id);
  const lines = state.stock.filter((s) => s.articleId === id);
  const mvs = state.movements.filter((m) => m.articleId === id);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Fiche stock" title={name} description="CMUP jamais saisi à la main — recalculé à chaque mouvement." />
      <Panel className="p-4">
        {lines.map((s) => (
          <p key={s.id} className="text-[13px]">
            {state.depots.find((d) => d.id === s.depotId)?.name} · lot {s.lot ?? "—"} · {formatQty(s.qty)} · CMUP {formatDa(s.cmup)}
          </p>
        ))}
      </Panel>
      <Panel>
        <div className="px-4 py-3 border-b border-line font-medium text-[13px]">Mouvements</div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted">
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-right px-3 py-2">Qté</th>
              <th className="text-left px-3 py-2">Origine</th>
            </tr>
          </thead>
          <tbody>
            {mvs.map((m) => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-3 py-2">{formatDateTime(m.at)}</td>
                <td className="px-3 py-2">{m.type}</td>
                <td className="px-3 py-2 text-right num">{m.qty}</td>
                <td className="px-3 py-2">{m.origin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
