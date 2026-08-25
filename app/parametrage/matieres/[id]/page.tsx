"use client";

import { useStore } from "@/lib/store";
import { PageHeader, Panel } from "@/components/ui";

export default function MatiereDetailPage() {
  const { matieres } = useStore();
  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Matières premières"
        description="Ingrédients et emballages utilisés en production."
      />
      <Panel className="p-4 text-[13px] space-y-1">
        {matieres.length === 0 ? (
          <p className="text-muted">Aucune matière enregistrée pour le moment.</p>
        ) : (
          matieres.map((a) => (
            <p key={a.id}>
              {a.code} · {a.designation}
            </p>
          ))
        )}
      </Panel>
    </div>
  );
}
