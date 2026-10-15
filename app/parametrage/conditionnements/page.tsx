"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { FilterBar, FilterSelect, SearchInput, matchSearch } from "@/components/Filters";
import { api, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { FicheConditionnement } from "@/lib/types";
import { num } from "@/lib/utils";

export default function ConditionnementsPage() {
  const { state, dispatch, articleName, produitsFinis, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/conditionnements") || canEditParam("/parametrage/fiches-techniques");
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [n, setN] = useState(6);
  const [type, setType] = useState("carton");
  const [poids, setPoids] = useState("");
  const [parPalette, setParPalette] = useState("");
  const [q, setQ] = useState("");
  const [fEmballage, setFEmballage] = useState("");
  const [edition, setEdition] = useState<FicheConditionnement | null>(null);
  const emballages = [...new Set(state.fichesConditionnement.map((f) => f.type_emballage).filter(Boolean))].map((e) => ({ value: e, label: e }));
  const filtered = state.fichesConditionnement.filter(
    (f) => matchSearch(q, articleName(f.article), f.type_emballage) && (!fEmballage || f.type_emballage === fEmballage),
  );

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
      <Panel className="overflow-hidden">
        <FilterBar shown={filtered.length} total={state.fichesConditionnement.length} active={!!q || !!fEmballage} onReset={() => { setQ(""); setFEmballage(""); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Article ou emballage…" />
          <FilterSelect label="Emballage" allLabel="Tous les emballages" value={fEmballage} onChange={setFEmballage} options={emballages} />
        </FilterBar>
        <DataTable
          emptyText="Aucune fiche ne correspond à ces filtres."
          onRowClick={writable ? (row) => setEdition(state.fichesConditionnement.find((f) => String(f.id) === row.id) ?? null) : undefined}
          columns={[
            { key: "a", label: "Article" },
            { key: "n", label: "U / carton" },
            { key: "t", label: "Emballage" },
            { key: "p", label: "Poids carton" },
            { key: "pal", label: "Cartons / palette" },
          ]}
          rows={filtered.map((f) => ({
            id: String(f.id),
            a: articleName(f.article),
            n: f.nombre_unites_par_carton,
            t: f.type_emballage,
            p: f.poids_carton_kg ? `${num(f.poids_carton_kg)} kg` : "—",
            pal: f.nombre_cartons_par_palette ?? "—",
          }))}
        />
      </Panel>
      {edition && <EditionConditionnement key={edition.id} fiche={edition} onClose={() => setEdition(null)} />}
    </div>
  );
}

function EditionConditionnement({ fiche, onClose }: { fiche: FicheConditionnement; onClose: () => void }) {
  const { dispatch, articleName } = useStore();
  const [n, setN] = useState(String(fiche.nombre_unites_par_carton));
  const [type, setType] = useState(fiche.type_emballage);
  const [poids, setPoids] = useState(fiche.poids_carton_kg != null ? String(num(fiche.poids_carton_kg)) : "");
  const [parPalette, setParPalette] = useState(fiche.nombre_cartons_par_palette != null ? String(fiche.nombre_cartons_par_palette) : "");
  const [busy, setBusy] = useState(false);
  const url = `${endpoints.fichesConditionnement}${fiche.id}/`;
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: ["fichesConditionnement"] });
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <Panel className="p-4 space-y-3">
      <h2 className="text-[13px] font-semibold">Modifier · {articleName(fiche.article)}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
        <Field label="Unités / carton"><input type="number" className={inputClass} value={n} onChange={(e) => setN(e.target.value)} /></Field>
        <Field label="Emballage"><input className={inputClass} value={type} onChange={(e) => setType(e.target.value)} /></Field>
        <Field label="Poids du carton (kg)"><input type="number" className={inputClass} value={poids} onChange={(e) => setPoids(e.target.value)} /></Field>
        <Field label="Cartons / palette"><input type="number" className={inputClass} value={parPalette} onChange={(e) => setParPalette(e.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!(Number(n) >= 1) || !type.trim() || busy}
          onClick={() =>
            void run(() =>
              api.patch(url, {
                nombre_unites_par_carton: Number(n),
                type_emballage: type.trim(),
                poids_carton_kg: poids ? Number(poids) : null,
                nombre_cartons_par_palette: parPalette ? Number(parPalette) : null,
              }),
            )
          }
        >
          Enregistrer
        </Button>
        <Button
          variant="ghost"
          className="text-danger"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Supprimer cette fiche de conditionnement ?")) void run(() => api.del(url));
          }}
        >
          Supprimer
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Panel>
  );
}
