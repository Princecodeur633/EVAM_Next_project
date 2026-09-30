"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { UNITE_LABEL } from "@/lib/labels";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { useStore } from "@/lib/store";
import type { UniteMesure } from "@/lib/types";
import { formatQty, num } from "@/lib/utils";

export default function MatieresPage() {
  const router = useRouter();
  const { state, dispatch, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/articles") || canEditParam("/parametrage/matieres");
  const [designation, setDesignation] = useState("");
  const [unite, setUnite] = useState<UniteMesure>("KG");
  const rows = state.articles.filter((a) => a.type_article === "MATIERE_PREMIERE");
  const [q, setQ] = useState("");
  const [fUnite, setFUnite] = useState("");
  const [fStatut, setFStatut] = useState<"TOUS" | "ACTIFS" | "INACTIFS">("TOUS");
  const filtered = rows.filter(
    (a) =>
      matchSearch(q, a.code, a.designation) &&
      (!fUnite || a.unite_mesure === fUnite) &&
      (fStatut === "TOUS" || (fStatut === "ACTIFS" ? a.actif : !a.actif)),
  );
  const unitesPresentes = [...new Set(rows.map((a) => a.unite_mesure))].map((u) => ({ value: u, label: UNITE_LABEL[u] ?? u }));

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Matières premières" description="Ingrédients et emballages utilisés en production. Cliquez sur une ligne pour voir la fiche complète." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Désignation"><input className={inputClass} value={designation} onChange={(e) => setDesignation(e.target.value)} /></Field>
          <Field label="Unité">
            <select className={inputClass} value={unite} onChange={(e) => setUnite(e.target.value as UniteMesure)}>
              {(Object.keys(UNITE_LABEL) as UniteMesure[]).map((k) => <option key={k} value={k}>{UNITE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Button disabled={!designation.trim()} onClick={() => void dispatch({ type: "CREATE_ARTICLE", designation, type_article: "MATIERE_PREMIERE", unite_mesure: unite })}>Créer</Button>
        </Panel>
      )}
      <Panel className="overflow-hidden">
        <FilterBar
          shown={filtered.length}
          total={rows.length}
          active={!!q || !!fUnite || fStatut !== "TOUS"}
          onReset={() => { setQ(""); setFUnite(""); setFStatut("TOUS"); }}
        >
          <SearchInput value={q} onChange={setQ} placeholder="Code ou désignation…" />
          <Segmented label="Statut" value={fStatut} onChange={setFStatut} options={[
            { value: "TOUS", label: "Toutes" },
            { value: "ACTIFS", label: "Actives", count: rows.filter((a) => a.actif).length },
            { value: "INACTIFS", label: "Inactives", count: rows.filter((a) => !a.actif).length },
          ]} />
          <FilterSelect label="Unité" allLabel="Toutes les unités" value={fUnite} onChange={setFUnite} options={unitesPresentes} />
        </FilterBar>
        <DataTable
          emptyText="Aucune matière ne correspond à ces filtres."
          columns={[
            { key: "c", label: "Code" },
            { key: "d", label: "Désignation" },
            { key: "u", label: "Unité" },
            { key: "min", label: "Stock minimum" },
            { key: "al", label: "Stock d'alerte" },
            { key: "s", label: "Statut" },
          ]}
          rows={filtered.map((a) => ({
            c: a.code,
            d: a.designation,
            u: UNITE_LABEL[a.unite_mesure] ?? a.unite_mesure,
            min: formatQty(num(a.stock_minimum), 2),
            al: formatQty(num(a.stock_alerte), 2),
            s: a.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="danger">Inactif</StatusBadge>,
            href: `/parametrage/matieres/${a.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
