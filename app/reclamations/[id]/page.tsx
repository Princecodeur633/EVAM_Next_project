"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function ReclamationDetailPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Qualité"
        title="Réclamation"
        description="Cette fiche n’est pas encore disponible."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Revenez à l’accueil pour traiter production, qualité, stocks ou ventes.
      </Panel>
    </div>
  );
}
