"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { ORIGINE_BESOIN_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function BesoinsAchatPage() {
  const { state, articleName } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Achats" title="Besoins d'approvisionnement" description="Besoins issus de la production ou saisis manuellement. Le statut indique s’ils sont déjà couverts." />
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "q", label: "Qté" }, { key: "o", label: "Origine" }, { key: "s", label: "Satisfait" }]}
          rows={state.besoinsAchat.map((b) => ({
            a: articleName(b.article),
            q: formatQty(num(b.quantite_besoin), 2),
            o: ORIGINE_BESOIN_LABEL[b.origine] ?? b.origine,
            s: b.satisfait ? "Oui" : "Non",
          }))}
        />
      </Panel>
    </div>
  );
}
