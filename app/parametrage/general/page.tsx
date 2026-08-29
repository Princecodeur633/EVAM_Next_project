"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function GeneralPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Paramètres généraux"
        description="L’usine EVAM travaille sur le fuseau de Brazzaville."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Les réglages d’entreprise (fuseau, société) sont gérés par l’administrateur, pas depuis cet écran.
      </Panel>
    </div>
  );
}
