"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

const GRIDS = [
  { id: "t-std", name: "Standard comptoir", factor: 1 },
  { id: "t-gros", name: "Grossiste", factor: 0.92 },
  { id: "t-horeca", name: "Hôtellerie", factor: 0.94 },
];

export default function TarifsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Tarifs / grilles" description="Produit × famille client. Le commercial lit le prix, il ne l'invente pas." />
      {GRIDS.map((g) => (
        <Panel key={g.id} className="mb-4">
          <div className="px-4 py-3 border-b border-line font-medium text-[13px]">
            {g.name} <span className="num text-muted">{g.id}</span>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {state.products.map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-right num">{formatDa(Math.round(p.priceHt * g.factor))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
}
