"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { UniteMesure } from "@/lib/types";
import { formatQty, num } from "@/lib/utils";

export default function MatieresPage() {
  const router = useRouter();
  const { state, dispatch, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/articles") || canEditParam("/parametrage/matieres");
  const [code, setCode] = useState("");
  const [designation, setDesignation] = useState("");
  const [unite, setUnite] = useState<UniteMesure>("KG");
  const rows = state.articles.filter((a) => a.type_article === "MATIERE_PREMIERE");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Matières premières" description="Ingrédients et emballages utilisés en production. Cliquez sur une ligne pour voir la fiche complète." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Code"><input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Désignation"><input className={inputClass} value={designation} onChange={(e) => setDesignation(e.target.value)} /></Field>
          <Field label="Unité">
            <select className={inputClass} value={unite} onChange={(e) => setUnite(e.target.value as UniteMesure)}>
              {(Object.keys(UNITE_LABEL) as UniteMesure[]).map((k) => <option key={k} value={k}>{UNITE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Button disabled={!code} onClick={() => void dispatch({ type: "CREATE_ARTICLE", code, designation, type_article: "MATIERE_PREMIERE", unite_mesure: unite })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "c", label: "Code" },
            { key: "d", label: "Désignation" },
            { key: "u", label: "Unité" },
            { key: "min", label: "Stock minimum" },
            { key: "al", label: "Stock d'alerte" },
            { key: "s", label: "Statut" },
          ]}
          rows={rows.map((a) => ({
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
