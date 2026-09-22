"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { num } from "@/lib/utils";

export default function ConditionnementsPage() {
  const { state, dispatch, articleName, produitsFinis, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/conditionnements") || canEditParam("/parametrage/fiches-techniques");
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [n, setN] = useState(6);
  const [type, setType] = useState("carton");
  const [poids, setPoids] = useState("");
  const [parPalette, setParPalette] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Fiches de conditionnement" description="Unités par carton, type d’emballage, poids et palettisation." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Unités / carton"><input type="number" className={inputClass} value={n} onChange={(e) => setN(Number(e.target.value))} /></Field>
          <Field label="Emballage"><input className={inputClass} value={type} onChange={(e) => setType(e.target.value)} /></Field>
          <Field label="Poids du carton (kg)"><input type="number" className={inputClass} value={poids} onChange={(e) => setPoids(e.target.value)} /></Field>
          <Field label="Cartons / palette"><input type="number" className={inputClass} value={parPalette} onChange={(e) => setParPalette(e.target.value)} /></Field>
          <Button
            disabled={!article || n < 1}
            onClick={() =>
              void dispatch({
                type: "CREATE_CONDITIONNEMENT",
                article,
                nombre_unites_par_carton: n,
                type_emballage: type,
                poids_carton_kg: poids ? Number(poids) : undefined,
                nombre_cartons_par_palette: parPalette ? Number(parPalette) : undefined,
              })
            }
          >
            Créer
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "a", label: "Article" },
            { key: "n", label: "U / carton" },
            { key: "t", label: "Emballage" },
            { key: "p", label: "Poids carton" },
            { key: "pal", label: "Cartons / palette" },
          ]}
          rows={state.fichesConditionnement.map((f) => ({
            a: articleName(f.article),
            n: f.nombre_unites_par_carton,
            t: f.type_emballage,
            p: f.poids_carton_kg ? `${num(f.poids_carton_kg)} kg` : "—",
            pal: f.nombre_cartons_par_palette ?? "—",
          }))}
        />
      </Panel>
    </div>
  );
}
