"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function BesoinsPage() {
  const { state, articleName, ofNumero } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Production"
        title="Besoins matières"
        description="Quantités théoriques calculées au lancement de l’OF, à partir de la fiche technique validée."
      />
      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "m", label: "Matière" }, { key: "q", label: "Qté théorique" }]}
          rows={state.besoinsMatieres.map((b) => ({
            of: ofNumero(b.ordre_fabrication),
            m: articleName(b.matiere),
            q: formatQty(num(b.quantite_theorique), 3),
          }))}
        />
      </Panel>
    </div>
  );
}
