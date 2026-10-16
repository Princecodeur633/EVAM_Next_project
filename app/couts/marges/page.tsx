"use client";

import { useState } from "react";
import { RefCrud } from "@/components/RefCrud";
import { Button, DataTable, PageHeader, Panel, inputClass } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import { tarifEnVigueur } from "@/lib/tarifs";
import { formatDa, num } from "@/lib/utils";

export default function MargesPage() {
  const { state, articleName, dispatch, can } = useStore();
  const [valorisation, setValorisation] = useState<Record<number, string>>({});
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Coûts" title="Coûts standards" description="Comparez le coût de revient et le tarif de vente de chaque article." />
      <RefCrud
        titre="Coûts standards"
        description="Coût de référence par article et date de validité, comparé au coût réel des OF et au tarif public (marge standard)."
        items={[...state.coutsStandards].sort((a, b) => articleName(a.article).localeCompare(articleName(b.article), "fr") || b.date_debut_validite.localeCompare(a.date_debut_validite))}
        endpoint={endpoints.coutsStandards}
        refresh={["coutsStandards"]}
        writable={can("GERER_COUTS_CASCADE")}
        supprimable={() => true}
        rechercheDans={(c) => [articleName(c.article)]}
        libelleItem={(c) => `${articleName(c.article)} · ${formatDa(num(c.cout_standard_unitaire))}`}
        valeursInitiales={{ article: 0, cout_standard_unitaire: "", date_debut_validite: new Date().toISOString().slice(0, 10) }}
        champs={[
          { cle: "article", label: "Article", type: "select", requis: true, options: state.articles.filter((a) => a.actif).map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` })) },
          { cle: "cout_standard_unitaire", label: "Coût standard unitaire (FCFA, par unité de stock)", type: "number", requis: true },
          { cle: "date_debut_validite", label: "Valide à partir du", type: "date", requis: true },
        ]}
        colonnes={[
          { cle: "a", label: "Article", rendu: (c) => articleName(c.article) },
          { cle: "cs", label: "Coût standard", className: "text-right", rendu: (c) => <span className="num">{formatDa(num(c.cout_standard_unitaire))}</span> },
          { cle: "d", label: "Depuis le", rendu: (c) => c.date_debut_validite },
          {
            cle: "pv",
            label: "Tarif public",
            className: "text-right",
            rendu: (c) => {
              const tarif = tarifEnVigueur(state.tarifs, c.article, null);
              return <span className="num">{tarif ? formatDa(num(tarif.prix_unitaire)) : "—"}</span>;
            },
          },
          {
            cle: "m",
            label: "Marge standard",
            className: "text-right",
            rendu: (c) => {
              const tarif = tarifEnVigueur(state.tarifs, c.article, null);
              if (!tarif) return "—";
              const marge = num(tarif.prix_unitaire) - num(c.cout_standard_unitaire);
              return <span className={marge < 0 ? "num text-danger" : "num"}>{formatDa(marge)}</span>;
            },
          },
        ]}
      />
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
              const numero = c.reclamation_numero ?? state.reclamations.find((r) => r.id === c.reclamation)?.numero ?? `Réclamation n°${c.reclamation}`;
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
