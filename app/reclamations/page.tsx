"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function ReclamationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Qualité"
        title="Réclamations"
        description="Le suivi des réclamations clients n’est pas encore ouvert dans EVAM."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Les lots non conformes se traitent dans Qualité. Les retours magasin se saisissent dans les stocks.
      </Panel>
    </div>
  );
}
