"use client";

import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function DepotsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Dépôts / emplacements" description="PF, matières, quarantaine, retours — obligatoires pour tout mouvement." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-left px-3 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {state.depots.map((d) => (
              <tr key={d.id} className="border-b border-line">
                <td className="px-3 py-2 num">{d.code}</td>
                <td className="px-3 py-2">{d.name}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={d.kind === "quarantaine" ? "danger" : "neutral"}>{d.kind}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
