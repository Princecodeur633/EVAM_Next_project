"use client";

import { useState } from "react";
import { ArrowRightLeft, Factory, Trash2 } from "lucide-react";
import { Button, Field, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, api, detail, endpoints } from "@/lib/api";
import { MODE_APPRO_LABEL, UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Article, ModeApprovisionnement, UniteMesure } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

const UNITES = Object.keys(UNITE_LABEL) as UniteMesure[];

/**
 * Données industrielles d’un article (Guide du paramétrage §6 à §8) : activité, modes et unités,
 * contenance et conditionnement. Ce qui est déjà connu (activité de la famille, contenance du format,
 * unités par pack de l’unité de vente) est déduit par le backend si on laisse vide.
 */
export function DonneesIndustriellesPanel({ article, writable }: { article: Article; writable: boolean }) {
  const { state, dispatch } = useStore();
  const estPF = article.type_article === "PRODUIT_FINI";
  const verrouille = !!article.est_verrouille;
  const init = () => ({
    activite: article.activite ?? 0,
    activites_autorisees: article.activites_autorisees ?? [],
    mode_approvisionnement: (article.mode_approvisionnement ?? "") as ModeApprovisionnement | "",
    unite_achat: (article.unite_achat ?? "") as UniteMesure | "",
    unite_consommation: (article.unite_consommation ?? "") as UniteMesure | "",
    contenance: article.contenance ?? "",
    unite_contenance: (article.unite_contenance ?? "") as "L" | "KG" | "",
    unites_par_pack: article.unites_par_pack ?? "",
    unites_par_unite_stock: article.unites_par_unite_stock ?? "",
    packs_par_palette: article.packs_par_palette ?? "",
    type_emballage: article.type_emballage ?? "",
  });
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ReturnType<typeof init>>(k: K, v: ReturnType<typeof init>[K]) => setForm((f) => ({ ...f, [k]: v }));
  const entier = (v: string | number) => (v === "" ? null : Number(v));

  async function save() {
    setSaving(true);
    await dispatch({
      type: "EXEC",
      run: () =>
        api.patch(detail(endpoints.articles, article.id), {
          activite: form.activite || null,
          activites_autorisees: form.activites_autorisees,
          mode_approvisionnement: form.mode_approvisionnement,
          unite_achat: form.unite_achat,
          unite_consommation: form.unite_consommation,
          contenance: form.contenance === "" ? null : Number(form.contenance),
          unite_contenance: form.unite_contenance,
          unites_par_pack: entier(form.unites_par_pack),
          unites_par_unite_stock: entier(form.unites_par_unite_stock),
          packs_par_palette: entier(form.packs_par_palette),
          type_emballage: form.type_emballage,
        }),
      refresh: ["articles"],
    });
    setSaving(false);
  }

  const activiteNom = (id: number | null | undefined) => state.activites.find((a) => a.id === id)?.designation ?? "—";

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Factory size={15} className="text-primary" />
        <h2 className="text-[13px] font-semibold">Données industrielles</h2>
      </div>
      <p className="text-[12px] text-muted">
        Servent aux lignes, circuits, contrôles et coûts (bouteilles, packs, litres produits). Laissez vide ce qui se déduit : activité de la famille, contenance du format
        (70 cl → 0,7 L), unités par pack de l’unité de vente (Pack de 6 → 6).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Field label={estPF ? "Activité (déduite de la famille)" : "Activité"}>
          <select className={inputClass} disabled={!writable || verrouille} value={form.activite} onChange={(e) => set("activite", Number(e.target.value))}>
            <option value={0}>{estPF ? "Automatique" : "—"}</option>
            {state.activites.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mode d’approvisionnement">
          <select className={inputClass} disabled={!writable} value={form.mode_approvisionnement} onChange={(e) => set("mode_approvisionnement", e.target.value as ModeApprovisionnement | "")}>
            <option value="">Selon le type</option>
            {(Object.keys(MODE_APPRO_LABEL) as ModeApprovisionnement[]).map((k) => (
              <option key={k} value={k}>
                {MODE_APPRO_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unité d’achat">
          <select className={inputClass} disabled={!writable} value={form.unite_achat} onChange={(e) => set("unite_achat", e.target.value as UniteMesure | "")}>
            <option value="">Unité de base ({UNITE_LABEL[article.unite_mesure]})</option>
            {UNITES.map((u) => (
              <option key={u} value={u}>
                {UNITE_LABEL[u]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unité de consommation">
          <select className={inputClass} disabled={!writable} value={form.unite_consommation} onChange={(e) => set("unite_consommation", e.target.value as UniteMesure | "")}>
            <option value="">Unité de base ({UNITE_LABEL[article.unite_mesure]})</option>
            {UNITES.map((u) => (
              <option key={u} value={u}>
                {UNITE_LABEL[u]}
              </option>
            ))}
          </select>
        </Field>
        {estPF ? (
          <>
            <Field label="Contenance unitaire">
              <div className="flex gap-2">
                <input className={cn(inputClass, "num text-right")} type="number" min="0" step="any" disabled={!writable} placeholder="auto" value={form.contenance} onChange={(e) => set("contenance", e.target.value)} />
                <select className={cn(inputClass, "w-[90px]")} disabled={!writable} value={form.unite_contenance} onChange={(e) => set("unite_contenance", e.target.value as "L" | "KG" | "")}>
                  <option value="">—</option>
                  <option value="L">L</option>
                  <option value="KG">kg</option>
                </select>
              </div>
            </Field>
            <Field label="Unités par pack">
              <input className={cn(inputClass, "num text-right")} type="number" min="1" disabled={!writable} placeholder="auto" value={form.unites_par_pack} onChange={(e) => set("unites_par_pack", e.target.value)} />
            </Field>
            <Field label="Bouteilles / pots par unité de stock">
              <input className={cn(inputClass, "num text-right")} type="number" min="1" disabled={!writable} placeholder="auto" value={form.unites_par_unite_stock} onChange={(e) => set("unites_par_unite_stock", e.target.value)} />
            </Field>
            <Field label="Packs par palette">
              <input className={cn(inputClass, "num text-right")} type="number" min="1" disabled={!writable} value={form.packs_par_palette} onChange={(e) => set("packs_par_palette", e.target.value)} />
            </Field>
          </>
        ) : (
          <Field label="Type d’emballage">
            <input className={inputClass} disabled={!writable} placeholder="ex. préforme PET, film, carton" value={form.type_emballage} onChange={(e) => set("type_emballage", e.target.value)} />
          </Field>
        )}
      </div>
      {!estPF && (
        <Field label="Activités autorisées (vide = toutes)">
          <div className="flex flex-wrap gap-3 rounded-[7px] border border-line-strong bg-surface px-3 py-2">
            {state.activites.length === 0 && <span className="text-[12px] text-muted">Aucune activité paramétrée.</span>}
            {state.activites.map((a) => (
              <label key={a.id} className="flex items-center gap-1.5 text-[12.5px]">
                <input
                  type="checkbox"
                  disabled={!writable}
                  checked={form.activites_autorisees.includes(a.id)}
                  onChange={(e) => set("activites_autorisees", e.target.checked ? [...form.activites_autorisees, a.id] : form.activites_autorisees.filter((x) => x !== a.id))}
                />
                {a.designation}
              </label>
            ))}
          </div>
        </Field>
      )}
      {estPF && article.activite && (
        <p className="text-[12px] text-muted">
          Activité en vigueur : <StatusBadge tone="teal">{activiteNom(article.activite)}</StatusBadge>
          {article.contenance && ` · ${formatQty(num(article.contenance), 3)} ${article.unite_contenance === "KG" ? "kg" : "L"} par unité`}
          {article.unites_par_pack ? ` · ${article.unites_par_pack} par pack` : ""}
        </p>
      )}
      {writable && (
        <div className="flex justify-end">
          <Button variant="secondary" disabled={saving} onClick={() => void save()}>
            {saving ? "Enregistrement…" : "Enregistrer les données industrielles"}
          </Button>
        </div>
      )}
    </Panel>
  );
}

/** Conversions d’unités propres à l’article (1 sac = 25 kg, 1 carton = 6 bouteilles) et conversions générales. */
export function ConversionsPanel({ article }: { article: Article }) {
  const { state, dispatch, can } = useStore();
  const writable = can("GERER_CONVERSIONS");
  const propres = state.conversions.filter((c) => c.article === article.id);
  const generales = state.conversions.filter((c) => c.article == null);
  const [source, setSource] = useState<UniteMesure>(article.unite_achat || "SAC");
  const [facteur, setFacteur] = useState("");
  const [cible, setCible] = useState<UniteMesure>(article.unite_mesure);
  const [test, setTest] = useState({ quantite: "1", de: article.unite_achat || article.unite_mesure, vers: article.unite_mesure });
  const [resultat, setResultat] = useState<string | null>(null);

  async function ajouter() {
    const ok = await dispatch({
      type: "EXEC",
      run: () => api.post(endpoints.conversions, { article: article.id, unite_source: source, facteur: Number(facteur), unite_cible: cible }),
      refresh: ["conversions"],
    });
    if (ok) setFacteur("");
  }

  async function convertir() {
    try {
      const r = await actions.convertirUnites(test.quantite, test.de, test.vers, article.id);
      setResultat(`${formatQty(num(r.quantite), 3)} ${UNITE_LABEL[r.de as UniteMesure] ?? r.de} = ${formatQty(num(r.resultat), 4)} ${UNITE_LABEL[r.vers as UniteMesure] ?? r.vers}`);
    } catch (err) {
      setResultat(err instanceof Error ? err.message : "Conversion impossible.");
    }
  }

  const ligne = (c: (typeof propres)[number], general: boolean) => (
    <li key={c.id} className="px-3 py-2 flex items-center gap-2 text-[12.5px]">
      <span className="num flex-1">
        1 {UNITE_LABEL[c.unite_source]} = {formatQty(num(c.facteur), 4)} {UNITE_LABEL[c.unite_cible]}
      </span>
      {general && <StatusBadge tone="neutral">Générale</StatusBadge>}
      {!general && writable && (
        <button
          type="button"
          className="h-7 w-7 rounded-[6px] flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
          aria-label="Supprimer"
          onClick={() => void dispatch({ type: "EXEC", run: () => api.del(detail(endpoints.conversions, c.id)), refresh: ["conversions"] })}
        >
          <Trash2 size={13} />
        </button>
      )}
    </li>
  );

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ArrowRightLeft size={15} className="text-primary" />
        <h2 className="text-[13px] font-semibold">Conversions d’unités</h2>
      </div>
      <p className="text-[12px] text-muted">Une seule table de conversion pour tous les modules (achat en sacs, consommation en kg…). Les conversions kg ↔ g, L ↔ cL et m³ ↔ L sont connues.</p>
      <ul className="rounded-[9px] border border-line divide-y divide-line">
        {propres.length === 0 && generales.length === 0 && <li className="px-3 py-3 text-[12.5px] text-muted">Aucune conversion paramétrée.</li>}
        {propres.map((c) => ligne(c, false))}
        {generales.map((c) => ligne(c, true))}
      </ul>
      {writable && (
        <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-end">
          <span className="text-[12.5px] pb-2.5">1</span>
          <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as UniteMesure)}>
            {UNITES.map((u) => (
              <option key={u} value={u}>
                {UNITE_LABEL[u]}
              </option>
            ))}
          </select>
          <input className={cn(inputClass, "w-24 num text-right")} type="number" min="0" step="any" placeholder="=" value={facteur} onChange={(e) => setFacteur(e.target.value)} />
          <select className={inputClass} value={cible} onChange={(e) => setCible(e.target.value as UniteMesure)}>
            {UNITES.map((u) => (
              <option key={u} value={u}>
                {UNITE_LABEL[u]}
              </option>
            ))}
          </select>
          <Button disabled={!(Number(facteur) > 0) || source === cible} onClick={() => void ajouter()}>
            Ajouter
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
        <input className={cn(inputClass, "w-24 num text-right")} type="number" min="0" step="any" value={test.quantite} onChange={(e) => setTest((t) => ({ ...t, quantite: e.target.value }))} />
        <select className={cn(inputClass, "w-36")} value={test.de} onChange={(e) => setTest((t) => ({ ...t, de: e.target.value as UniteMesure }))}>
          {UNITES.map((u) => (
            <option key={u} value={u}>
              {UNITE_LABEL[u]}
            </option>
          ))}
        </select>
        <span className="text-[12.5px] pb-2.5">→</span>
        <select className={cn(inputClass, "w-36")} value={test.vers} onChange={(e) => setTest((t) => ({ ...t, vers: e.target.value as UniteMesure }))}>
          {UNITES.map((u) => (
            <option key={u} value={u}>
              {UNITE_LABEL[u]}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={() => void convertir()}>
          Convertir
        </Button>
        {resultat && <p className="text-[12.5px] num w-full">{resultat}</p>}
      </div>
    </Panel>
  );
}
