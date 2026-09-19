"use client";

import { useState } from "react";
import { Button, DataTable, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function MargesPage() {
  const { state, articleName, dispatch, can } = useStore();
  const [valorisation, setValorisation] = useState<Record<number, string>>({});
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
      {state.coutsRetours.length > 0 && (
        <Panel className="p-4 space-y-2">
          <h2 className="text-[13px] font-semibold">Coûts des retours / pertes clients</h2>
          <DataTable
            columns={[
              { key: "r", label: "Réclamation" },
              { key: "q", label: "Qté détruite" },
              { key: "cd", label: "Coût produit détruit" },
              { key: "cr", label: "Coût reconditionnement" },
              { key: "x", label: "" },
            ]}
            rows={state.coutsRetours.map((c) => {
              const numero = state.reclamations.find((r) => r.id === c.reclamation)?.numero ?? `#${c.reclamation}`;
              return {
                r: numero,
                q: c.quantite_detruite != null ? num(c.quantite_detruite) : "—",
                cd: c.cout_produit_detruit != null ? formatDa(num(c.cout_produit_detruit)) : "—",
                cr: c.cout_reconditionnement != null ? formatDa(num(c.cout_reconditionnement)) : "—",
                x: can("VALORISER_COUT_RETOUR") ? (
                  <span className="flex gap-2 items-center">
                    <input
                      className={inputClass + " h-8 w-24"}
                      placeholder="Valoriser"
                      value={valorisation[c.id] ?? ""}
                      onChange={(e) => setValorisation((v) => ({ ...v, [c.id]: e.target.value }))}
                    />
                    <Button
                      className="h-8 px-2.5 text-[12px]"
                      disabled={!valorisation[c.id]}
                      onClick={() =>
                        void dispatch({ type: "VALORISER_COUT_RETOUR", id: c.id, cout_produit_detruit: Number(valorisation[c.id]) })
                      }
                    >
                      Enregistrer
                    </Button>
                  </span>
                ) : (
                  "—"
                ),
              };
            })}
          />
        </Panel>
      )}
    </div>
  );
}
