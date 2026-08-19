"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function ConditionnementsPage() {
  const { state } = useStore();
  const items = state.materials.filter((m) => m.kind === "emballage");
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Conditionnements" description="Bouteilles, pots, bouchons, étiquettes — traités comme des matières spécifiques." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-right px-3 py-2">CMUP</th>
              <th className="text-right px-3 py-2">Seuil</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2 num">{m.code}</td>
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2 text-right num">{formatDa(m.cmup)}</td>
                <td className="px-3 py-2 text-right num">{m.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
