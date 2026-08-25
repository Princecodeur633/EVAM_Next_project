"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ConditionnementsPage() {
  const { state, dispatch, articleName, produitsFinis, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/conditionnements") || canEditParam("/parametrage/fiches-techniques");
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [n, setN] = useState(6);
  const [type, setType] = useState("carton");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Fiches de conditionnement" description="Unités par carton, type d’emballage, poids et palettisation." />
      {writable && (
        <Panel className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Unités / carton"><input type="number" className={inputClass} value={n} onChange={(e) => setN(Number(e.target.value))} /></Field>
          <Field label="Emballage"><input className={inputClass} value={type} onChange={(e) => setType(e.target.value)} /></Field>
          <Button disabled={!article} onClick={() => void dispatch({ type: "CREATE_CONDITIONNEMENT", article, nombre_unites_par_carton: n, type_emballage: type })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "n", label: "U / carton" }, { key: "t", label: "Emballage" }]}
          rows={state.fichesConditionnement.map((f) => ({ a: articleName(f.article), n: f.nombre_unites_par_carton, t: f.type_emballage }))}
        />
      </Panel>
    </div>
  );
}
