"use client";

import { useStore } from "@/lib/store";
import { formatQty, availableQty } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/ui";

export default function BesoinsPage() {
  const { state, productName, materialName } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Production" title="Besoins matières" description="Calculés depuis la fiche technique de chaque OF planifié. Jamais saisis à la main." />
      <div className="space-y-4">
        {state.materialRequests.map((r) => {
          const of = state.ofList.find((o) => o.id === r.ofId);
          return (
            <Panel key={r.id} className="p-4">
              <div className="flex justify-between mb-2">
                <p className="font-medium">{r.ofId} · {of ? productName(of.productId) : ""}</p>
                <span className="text-[12px] text-muted">{r.status}</span>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase text-muted">
                    <th className="text-left py-1">Matière</th>
                    <th className="text-right py-1">Besoin</th>
                    <th className="text-right py-1">Stock dispo</th>
                    <th className="text-right py-1">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {r.lines.map((l) => {
                    const st = state.stock.find((s) => s.articleId === l.materialId && s.depotId === "dep-mp");
                    const avail = st ? availableQty(st.qty, st.reserved) : 0;
                    const gap = avail - l.qty;
                    return (
                      <tr key={l.materialId} className="border-t border-line">
                        <td className="py-1.5">{materialName(l.materialId)}</td>
                        <td className="py-1.5 text-right num">{formatQty(l.qty, 1)}</td>
                        <td className="py-1.5 text-right num">{formatQty(avail, 1)}</td>
                        <td className={`py-1.5 text-right num ${gap < 0 ? "text-danger" : "text-success"}`}>{formatQty(gap, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
