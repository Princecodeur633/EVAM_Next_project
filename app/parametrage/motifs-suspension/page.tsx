"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function MotifsSuspensionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Motifs de suspension"
        description="Cette liste n’est pas encore disponible dans EVAM."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Les suspensions de commande se gèrent aujourd’hui en bloquant le client depuis sa fiche.
      </Panel>
    </div>
  );
}
