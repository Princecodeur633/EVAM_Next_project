"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_ARTICLE_LABEL, UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeArticle, UniteMesure } from "@/lib/types";

export default function ArticlesPage() {
  const { state, dispatch, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/articles") || canEditParam("/parametrage/produits");
  const [code, setCode] = useState("");
  const [designation, setDesignation] = useState("");
  const [type, setType] = useState<TypeArticle>("PRODUIT_FINI");
  const [unite, setUnite] = useState<UniteMesure>("UNITE");
  const [famille, setFamille] = useState("");
  const rows = state.articles.filter((a) => a.type_article === "PRODUIT_FINI" || a.type_article === "PRODUIT_INTERMEDIAIRE");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Articles" description="Produits finis et intermédiaires : eau, jus et yaourts." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <Field label="Code"><input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Désignation"><input className={inputClass} value={designation} onChange={(e) => setDesignation(e.target.value)} /></Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeArticle)}>
              {(Object.keys(TYPE_ARTICLE_LABEL) as TypeArticle[]).map((k) => <option key={k} value={k}>{TYPE_ARTICLE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Unité">
            <select className={inputClass} value={unite} onChange={(e) => setUnite(e.target.value as UniteMesure)}>
              {(Object.keys(UNITE_LABEL) as UniteMesure[]).map((k) => <option key={k} value={k}>{UNITE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Button disabled={!code} onClick={() => void dispatch({ type: "CREATE_ARTICLE", code, designation, type_article: type, unite_mesure: unite, famille })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Code" }, { key: "d", label: "Désignation" }, { key: "t", label: "Type" }, { key: "u", label: "Unité" }, { key: "f", label: "Famille" }]}
          rows={rows.map((a) => ({ c: a.code, d: a.designation, t: TYPE_ARTICLE_LABEL[a.type_article], u: a.unite_mesure, f: a.famille || "—" }))}
        />
      </Panel>
    </div>
  );
}
