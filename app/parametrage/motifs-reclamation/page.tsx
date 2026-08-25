"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function MotifsReclamationPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Motifs de réclamation"
        description="Le suivi des réclamations clients n’est pas encore ouvert dans EVAM."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Les retours magasin et les lots non conformes se traitent dans les stocks et la qualité.
      </Panel>
    </div>
  );
}
