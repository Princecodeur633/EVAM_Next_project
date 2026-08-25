"use client";

import { useParams } from "next/navigation";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { TYPE_ARTICLE_LABEL } from "@/lib/labels";
import { stockDisponible } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function ArticleStockPage() {
  const { id } = useParams<{ id: string }>();
  const { state, articleName } = useStore();
  const articleId = Number(id);
  const article = state.articles.find((a) => a.id === articleId);
  const lines = state.stock.filter((s) => s.article === articleId);
  const depotName = (did: number) => state.depots.find((d) => d.id === did)?.nom ?? `#${did}`;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Article"
        title={article ? `${article.code} · ${article.designation}` : articleName(articleId)}
        description={article ? `${TYPE_ARTICLE_LABEL[article.type_article]} · ${article.unite_mesure}` : "Article introuvable."}
      />
      <Panel>
        <DataTable
          columns={[{ key: "d", label: "Dépôt" }, { key: "p", label: "Physique" }, { key: "v", label: "Disponible" }]}
          rows={lines.map((s) => ({ d: depotName(s.depot), p: formatQty(Number(s.quantite_physique), 2), v: formatQty(stockDisponible(s), 2) }))}
        />
      </Panel>
    </div>
  );
}
