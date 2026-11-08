"use client";

import { Button, DataTable, PageHeader, Panel } from "@/components/ui";
import { ofsDuBesoin } from "@/lib/engine";
import { ORIGINE_BESOIN_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function BesoinsAchatPage() {
  const { state, dispatch, articleName, can } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Achats" title="Besoins d'approvisionnement" description="Un seul besoin automatique par matière : il couvre les OF non terminés et le seuil d’alerte, déduction faite du disponible, des achats en cours et des besoins saisis à la main." />
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
            o: (
              <span className="inline-flex flex-col">
                <span>{ORIGINE_BESOIN_LABEL[b.origine] ?? b.origine}</span>
                {b.ordres_fabrication.length > 0 && <span className="text-[11.5px] text-muted">{ofsDuBesoin(state, b)}</span>}
              </span>
            ),
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
