"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { TYPE_ARTICLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function ProduitDetailRedirect() {
  const { state } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title="Articles"
        description="Liste des articles de l’usine : matières, produits intermédiaires et produits finis."
      />
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Code" }, { key: "d", label: "Désignation" }, { key: "t", label: "Type" }]}
          rows={state.articles.map((a) => ({ c: a.code, d: a.designation, t: TYPE_ARTICLE_LABEL[a.type_article] }))}
        />
      </Panel>
    </div>
  );
}
