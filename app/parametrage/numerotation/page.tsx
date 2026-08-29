"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function NumerotationPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Numérotation"
        description="Les numéros OF, commandes, factures, lots et bons de livraison sont attribués automatiquement."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Aucun paramétrage n’est nécessaire ici : chaque document reçoit son numéro à la création.
      </Panel>
    </div>
  );
}
