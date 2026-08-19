"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function SeuilsPage() {
  const { state, productName, materialName } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Seuils d'alerte" description="Min / critique par article × dépôt. Déclenche le besoin d'achat." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Article</th>
              <th className="text-right px-3 py-2">Seuil min</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-3 py-2">{productName(p.id)} (PF)</td>
                <td className="px-3 py-2 text-right num">{formatQty(p.minStock)}</td>
              </tr>
            ))}
            {state.materials.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2">{materialName(m.id)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(m.minStock, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
