"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function MargesPage() {
  const { state, articleName } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Coûts" title="Coûts standards" description="Comparez le coût de revient et le tarif de vente de chaque article." />
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "cs", label: "Coût standard" }, { key: "pv", label: "Tarif public" }]}
          rows={state.coutsStandards.map((c) => {
            const tarif = state.tarifs.find((t) => t.article === c.article && t.client == null);
            return {
              a: articleName(c.article),
              cs: formatDa(num(c.cout_standard_unitaire)),
              pv: tarif ? formatDa(num(tarif.prix_unitaire)) : "—",
            };
          })}
        />
      </Panel>
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "c", label: "Coût unitaire" }]}
          rows={state.coutsMatieres.map((c) => ({ a: articleName(c.article), c: formatDa(num(c.cout_unitaire)) }))}
        />
      </Panel>
    </div>
  );
}
