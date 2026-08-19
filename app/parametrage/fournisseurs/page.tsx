"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FournisseursPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Fournisseurs" description="Identité, délais, articles liés." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-right px-3 py-2">Délai (j)</th>
            </tr>
          </thead>
          <tbody>
            {state.suppliers.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="px-3 py-2 num">{s.code}</td>
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 text-right num">{s.delayDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
