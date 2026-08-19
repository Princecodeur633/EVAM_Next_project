"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function MotifsSuspensionPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Motifs de suspension" description="Liste fermée + « autre » commenté. Une facture suspendue n'est jamais exportable." />
      <Panel>
        <ul className="divide-y divide-line">
          {state.suspendReasons.map((c) => (
            <li key={c.id} className="px-4 py-2 text-[13px]">
              {c.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
