"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function MotifsReclamationPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Motifs de réclamation" description="Qualité, casse, écart de quantité, délai." />
      <Panel>
        <ul className="divide-y divide-line">
          {state.claimReasons.map((c) => (
            <li key={c.id} className="px-4 py-2 text-[13px]">
              {c.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
