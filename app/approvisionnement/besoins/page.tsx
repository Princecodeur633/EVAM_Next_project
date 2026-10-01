"use client";

import { Button, DataTable, PageHeader, Panel } from "@/components/ui";
import { ORIGINE_BESOIN_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function BesoinsAchatPage() {
  const { state, dispatch, articleName, can } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Achats" title="Besoins d'approvisionnement" description="Besoins issus de la production, d'un stock passé sous son seuil d'alerte, ou saisis manuellement. Le statut indique s’ils sont déjà couverts." />
      <Panel>
        <DataTable
          columns={[
            { key: "a", label: "Article" },
            { key: "q", label: "Qté" },
            { key: "o", label: "Origine" },
            { key: "s", label: "Satisfait" },
            { key: "act", label: "" },
          ]}
          rows={state.besoinsAchat.map((b) => ({
            a: articleName(b.article),
            q: formatQty(num(b.quantite_besoin), 2),
            o: ORIGINE_BESOIN_LABEL[b.origine] ?? b.origine,
            s: b.satisfait ? "Oui" : "Non",
            act: !b.satisfait && can("CREER_DA_DEPUIS_BESOIN") ? (
              <Button
                className="h-8 px-2.5 text-[12px]"
                onClick={() => void dispatch({ type: "CREER_DA_DEPUIS_BESOIN", id: b.id })}
              >
                Créer la DA
              </Button>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
