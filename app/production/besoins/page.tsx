"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatQty, num } from "@/lib/utils";

export default function BesoinsPage() {
  const { state, articleName, ofNumero, role } = useStore();
  // L'Agent Production voit maintenant ses propres besoins (filtrés côté serveur à ses OF affectés),
  // mais jamais les montants : le backend ne les lui transmet pas (aucune donnée financière).
  const voitMontants = role !== "AGENT_PRODUCTION";
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Production"
        title="Besoins matières"
        description="Quantités théoriques calculées à la création de l’OF, avec stock disponible et manquant (§5.5)."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "of", label: "OF" },
            { key: "m", label: "Matière" },
            { key: "q", label: "Théorique" },
            { key: "d", label: "Dispo" },
            { key: "manq", label: "Manquant" },
            { key: "sit", label: "Situation" },
            ...(voitMontants ? [{ key: "mt", label: "Montant" }] : []),
          ]}
          rows={state.besoinsMatieres.map((b) => ({
            of: ofNumero(b.ordre_fabrication),
            m: articleName(b.matiere),
            q: formatQty(num(b.quantite_theorique), 3),
            d: b.stock_disponible != null ? formatQty(num(b.stock_disponible), 3) : "—",
            manq: b.manquant != null ? formatQty(num(b.manquant), 3) : "—",
            sit: b.situation ?? "—",
            ...(voitMontants ? { mt: b.montant != null ? formatDa(num(b.montant)) : "—" } : {}),
          }))}
        />
      </Panel>
    </div>
  );
}
