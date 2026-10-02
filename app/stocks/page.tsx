"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { cn, formatQty, num } from "@/lib/utils";

export default function StocksPage() {
  const { state, articleName } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [fDepot, setFDepot] = useState("");
  const [vue, setVue] = useState<"TOUT" | "SEUIL">("TOUT");
  const depotName = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `#${id}`;
  const minimum = (article: number) => num(state.articles.find((a) => a.id === article)?.stock_minimum);
  const sousSeuil = (s: (typeof state.stock)[number]) => minimum(s.article) > 0 && stockDisponible(s) < minimum(s.article);

  const rows = state.stock
    .filter((s) => (!fDepot || String(s.depot) === fDepot) && (vue === "TOUT" || sousSeuil(s)))
    .filter((s) => matchSearch(q, articleName(s.article), depotName(s.depot)))
    .sort((a, b) => articleName(a.article).localeCompare(articleName(b.article), "fr"));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Stocks" title="Situation de stock" description="Disponible = quantité physique − bloquée − réservée, par dépôt." />
      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.stock.length} active={!!q || !!fDepot || vue !== "TOUT"} onReset={() => { setQ(""); setFDepot(""); setVue("TOUT"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Article, dépôt…" />
          <FilterSelect label="Dépôt" allLabel="Tous les dépôts" value={fDepot} onChange={setFDepot} options={state.depots.map((d) => ({ value: String(d.id), label: d.nom }))} />
          <Segmented
            label="Vue"
            value={vue}
            onChange={setVue}
            options={[
              { value: "TOUT", label: "Tout" },
              { value: "SEUIL", label: "Sous seuil", count: state.stock.filter(sousSeuil).length },
            ]}
          />
        </FilterBar>
        <DataTable
          emptyText="Aucune ligne de stock pour ces filtres."
          columns={[
            { key: "a", label: "Article" },
            { key: "d", label: "Dépôt" },
            { key: "p", label: "Physique", className: "text-right" },
            { key: "b", label: "Bloquée", className: "text-right" },
            { key: "r", label: "Réservée", className: "text-right" },
            { key: "v", label: "Disponible", className: "text-right" },
          ]}
          rows={rows.map((s) => {
            const dispo = stockDisponible(s);
            return {
              a: articleName(s.article),
              d: depotName(s.depot),
              p: <span className="num">{formatQty(num(s.quantite_physique), 2)}</span>,
              b: <span className="num text-muted">{formatQty(num(s.quantite_bloquee), 2)}</span>,
              r: <span className="num text-muted">{formatQty(num(s.quantite_reservee), 2)}</span>,
              v: <span className={cn("num font-semibold", dispo <= 0 ? "text-danger" : sousSeuil(s) ? "text-warning" : "")}>{formatQty(dispo, 2)}</span>,
              href: `/stocks/article/${s.article}`,
            };
          })}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
