"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function CausesPertesPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Causes de pertes / rebuts" description="Liste fermée utilisée à l'atelier. Pas de saisie libre sans trace." />
      <Panel>
        <ul className="divide-y divide-line">
          {state.lossCauses.map((c) => (
            <li key={c.id} className="px-4 py-2 text-[13px]">
              {c.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
