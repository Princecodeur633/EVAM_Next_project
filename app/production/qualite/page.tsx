"use client";

import { useRouter } from "next/navigation";
import { OfBadge } from "@/components/badges";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function QualiteListPage() {
  const { state, productName } = useStore();
  const router = useRouter();
  const queue = state.ofList.filter((o) => ["fin_production", "controle_qualite", "bloque"].includes(o.status));
  return (
    <div>
      <PageHeader
        eyebrow="Qualité"
        title="File des lots"
        description="Le contrôleur clôture définitivement l'OF. Sans cette action, le lot n'existe pas en stock vendable."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "id", label: "OF" },
            { key: "p", label: "Produit" },
            { key: "lot", label: "Lot" },
            { key: "st", label: "Statut" },
            { key: "q", label: "Résultat" },
          ]}
          rows={queue.map((o) => ({
            href: `/production/qualite/${o.id}`,
            id: <span className="num">{o.id}</span>,
            p: productName(o.productId),
            lot: <span className="num">{o.lot ?? "—"}</span>,
            st: <OfBadge status={o.status} />,
            q: o.qualityResult ?? "en attente",
          }))}
          onRowClick={(r) => router.push(String(r.href))}
        />
      </Panel>
    </div>
  );
}
