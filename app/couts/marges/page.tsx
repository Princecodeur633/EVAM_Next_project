"use client";

import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function MargesPage() {
  const { state, productName } = useStore();
  return (
    <div>
      <PageHeader eyebrow="P2 — wireframe" title="Marges" description="Prix de vente vs coût de revient. Différable V1.1 si le planning serre." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Produit</th>
              <th className="text-right px-3 py-2">Prix HT</th>
              <th className="text-right px-3 py-2">CMUP PF</th>
              <th className="text-right px-3 py-2">Marge unitaire</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => {
              const cmup = state.stock.find((s) => s.articleId === p.id)?.cmup ?? 0;
              const marge = p.priceHt - cmup;
              return (
                <tr key={p.id} className="border-b border-line">
                  <td className="px-3 py-2">{productName(p.id)}</td>
                  <td className="px-3 py-2 text-right num">{formatDa(p.priceHt)}</td>
                  <td className="px-3 py-2 text-right num">{formatDa(cmup)}</td>
                  <td className="px-3 py-2 text-right">
                    <StatusBadge tone={marge > 0 ? "success" : "danger"}>{formatDa(marge)}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
