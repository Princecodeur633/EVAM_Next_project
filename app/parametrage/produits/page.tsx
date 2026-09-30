"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { TYPE_ARTICLE_LABEL, UNITE_LABEL } from "@/lib/labels";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { useStore, type ListeValeurs } from "@/lib/store";
import type { TypeArticle, UniteMesure } from "@/lib/types";

type ListeAffichee = {
  cle: ListeValeurs;
  titre: string;
  valeurs: { id: number; libelle: string; actif: boolean }[];
};

/** Reproduit apps/core/codification.py:sigle() : 3 premières lettres du
 * premier mot, sans accents — sert seulement à savoir si le parfum est
 * facultatif (famille "Eau"/"Eaux minérales"...) ; le backend tranche. */
function sigle3(texte: string) {
  const ascii = texte.normalize("NFKD").replace(/[̀-ͯ]/g, "").toUpperCase();
  const mot = ascii.match(/[A-Z]+/)?.[0] ?? "";
  return mot.slice(0, 3);
}

export default function ArticlesPage() {
  const { state, dispatch, canEditParam, familleName } = useStore();
  const router = useRouter();
  const writable = canEditParam("/parametrage/articles") || canEditParam("/parametrage/produits");
  const [designation, setDesignation] = useState("");
  const [type, setType] = useState<TypeArticle>("PRODUIT_FINI");
  const [unite, setUnite] = useState<UniteMesure>("UNITE");
  const [famille, setFamille] = useState(0);
  const [format, setFormat] = useState(0);
  const [parfum, setParfum] = useState(0);
  const [uniteVente, setUniteVente] = useState(0);
  const [codeFiscal, setCodeFiscal] = useState(0);
  const [nouvelleListe, setNouvelleListe] = useState<ListeValeurs>("famille_article");
  const [nouvelleValeur, setNouvelleValeur] = useState("");
  const rows = state.articles.filter((a) => a.type_article === "PRODUIT_FINI" || a.type_article === "PRODUIT_INTERMEDIAIRE");
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("");
  const [fFamille, setFFamille] = useState("");
  const [fFiche, setFFiche] = useState<"TOUS" | "VALIDEE" | "BROUILLON" | "SANS">("TOUS");
  const [fStatut, setFStatut] = useState("");
  const ficheDe = (a: (typeof rows)[number]) => (a.fiche_technique_validee ? "VALIDEE" : a.fiche_technique_brouillon ? "BROUILLON" : "SANS");
  const filtered = rows.filter(
    (a) =>
      matchSearch(q, a.code, a.designation, a.marque) &&
      (!fType || a.type_article === fType) &&
      (!fFamille || String(a.famille ?? "") === fFamille) &&
      (fFiche === "TOUS" || ficheDe(a) === fFiche) &&
      (!fStatut || (fStatut === "ACTIFS" ? a.actif : !a.actif)),
  );
  const famillesPresentes = [...new Set(rows.map((a) => a.famille).filter((f): f is number => f != null))].map((f) => ({ value: String(f), label: familleName(f) }));

  const listes: ListeAffichee[] = [
    { cle: "famille_article", titre: "Familles", valeurs: state.famillesArticle.map((v) => ({ id: v.id, libelle: v.nom, actif: v.actif })) },
    { cle: "format", titre: "Formats", valeurs: state.formatsArticle.map((v) => ({ id: v.id, libelle: v.valeur, actif: v.actif })) },
    { cle: "parfum", titre: "Parfums / variantes", valeurs: state.parfums.map((v) => ({ id: v.id, libelle: v.nom, actif: v.actif })) },
    { cle: "unite_vente", titre: "Unités de vente", valeurs: state.unitesVente.map((v) => ({ id: v.id, libelle: v.nom, actif: v.actif })) },
  ];

  const actifs = <T extends { actif: boolean }>(items: T[]) => items.filter((v) => v.actif);

  // Un produit fini est codifié à partir de famille + parfum + format +
  // unité de vente (voir apps/core/codification.py) : ces trois premiers
  // sont donc obligatoires, et le parfum aussi sauf pour la famille "Eau".
  const estPF = type === "PRODUIT_FINI";
  const familleNom = state.famillesArticle.find((f) => f.id === famille)?.nom ?? "";
  const parfumFacultatif = !estPF || sigle3(familleNom) === "EAU";
  const peutCreer = !estPF || (famille > 0 && format > 0 && uniteVente > 0 && (parfumFacultatif || parfum > 0));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title="Articles"
        description="Produits finis et intermédiaires : eau, jus et yaourts. Pour un produit fini, famille, format et unité de vente sont obligatoires (ils forment le code, ex. EAU70P8, JUSGRE70P8) ; le parfum aussi, sauf pour l'eau. La désignation est générée si elle est laissée vide."
      />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Désignation (auto si vide)">
            <input className={inputClass} value={designation} onChange={(e) => setDesignation(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeArticle)}>
              {(Object.keys(TYPE_ARTICLE_LABEL) as TypeArticle[]).map((k) => <option key={k} value={k}>{TYPE_ARTICLE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Unité de base">
            <select className={inputClass} value={unite} onChange={(e) => setUnite(e.target.value as UniteMesure)}>
              {(Object.keys(UNITE_LABEL) as UniteMesure[]).map((k) => <option key={k} value={k}>{UNITE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label={estPF ? "Famille *" : "Famille"}>
            <select className={inputClass} value={famille} onChange={(e) => setFamille(Number(e.target.value))}>
              <option value={0}>—</option>
              {actifs(state.famillesArticle).map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </Field>
          <Field label={estPF ? "Format *" : "Format"}>
            <select className={inputClass} value={format} onChange={(e) => setFormat(Number(e.target.value))}>
              <option value={0}>—</option>
              {actifs(state.formatsArticle).map((f) => <option key={f.id} value={f.id}>{f.valeur}</option>)}
            </select>
          </Field>
          <Field label={estPF && !parfumFacultatif ? "Parfum / variante *" : "Parfum / variante"}>
            <select className={inputClass} value={parfum} onChange={(e) => setParfum(Number(e.target.value))}>
              <option value={0}>{parfumFacultatif ? "—" : "— obligatoire pour cette famille —"}</option>
              {actifs(state.parfums).map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </Field>
          <Field label={estPF ? "Unité de vente *" : "Unité de vente"}>
            <select className={inputClass} value={uniteVente} onChange={(e) => setUniteVente(Number(e.target.value))}>
              <option value={0}>—</option>
              {actifs(state.unitesVente).map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
            </select>
          </Field>
          <Field label="Code fiscal (TVA)">
            <select className={inputClass} value={codeFiscal} onChange={(e) => setCodeFiscal(Number(e.target.value))}>
              <option value={0}>— à rattacher plus tard —</option>
              {state.codesFiscaux.filter((c) => c.actif).map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {state.famillesFiscales.find((f) => f.id === c.famille_fiscale)?.nom ?? ""}</option>
              ))}
            </select>
          </Field>
          <Button
            disabled={!peutCreer}
            onClick={() =>
              void dispatch({
                type: "CREATE_ARTICLE",
                designation: designation.trim() || undefined,
                type_article: type,
                unite_mesure: unite,
                famille: famille || null,
                format: format || null,
                parfum: parfum || null,
                unite_vente: uniteVente || null,
                code_fiscal: codeFiscal || null,
              })
            }
          >
            Créer
          </Button>
        </Panel>
      )}
      <Panel className="overflow-hidden">
        <FilterBar
          shown={filtered.length}
          total={rows.length}
          active={!!q || !!fType || !!fFamille || !!fStatut || fFiche !== "TOUS"}
          onReset={() => { setQ(""); setFType(""); setFFamille(""); setFStatut(""); setFFiche("TOUS"); }}
        >
          <SearchInput value={q} onChange={setQ} placeholder="Code, désignation, marque…" />
          <Segmented label="Fiche technique" value={fFiche} onChange={setFFiche} options={[
            { value: "TOUS", label: "Toutes fiches" },
            { value: "VALIDEE", label: "Validée", count: rows.filter((a) => ficheDe(a) === "VALIDEE").length },
            { value: "BROUILLON", label: "Brouillon", count: rows.filter((a) => ficheDe(a) === "BROUILLON").length },
            { value: "SANS", label: "Sans fiche", count: rows.filter((a) => ficheDe(a) === "SANS").length },
          ]} />
          <FilterSelect label="Type" allLabel="Tous les types" value={fType} onChange={setFType} options={[
            { value: "PRODUIT_FINI", label: TYPE_ARTICLE_LABEL.PRODUIT_FINI },
            { value: "PRODUIT_INTERMEDIAIRE", label: TYPE_ARTICLE_LABEL.PRODUIT_INTERMEDIAIRE },
          ]} />
          <FilterSelect label="Famille" allLabel="Toutes les familles" value={fFamille} onChange={setFFamille} options={famillesPresentes} />
          <FilterSelect label="Statut" allLabel="Actifs et inactifs" value={fStatut} onChange={setFStatut} options={[{ value: "ACTIFS", label: "Actifs" }, { value: "INACTIFS", label: "Inactifs" }]} />
        </FilterBar>
        <DataTable
          emptyText="Aucun article ne correspond à ces filtres."
          columns={[
            { key: "c", label: "Code" },
            { key: "d", label: "Désignation" },
            { key: "t", label: "Type" },
            { key: "u", label: "Unité" },
            { key: "f", label: "Famille" },
            { key: "fisc", label: "Code fiscal" },
            { key: "ft", label: "Fiche technique" },
          ]}
          rows={filtered.map((a) => ({
            c: a.code,
            d: a.designation,
            t: TYPE_ARTICLE_LABEL[a.type_article],
            u: a.unite_mesure,
            f: familleName(a.famille),
            fisc: a.code_fiscal ? (state.codesFiscaux.find((c) => c.id === a.code_fiscal)?.code ?? `#${a.code_fiscal}`) : "—",
            ft: a.fiche_technique_validee ? (
              <Link href={`/parametrage/fiches-techniques/${a.fiche_technique_validee}`} className="text-primary" onClick={(e) => e.stopPropagation()}>
                <StatusBadge tone="success">Validée</StatusBadge>
              </Link>
            ) : a.fiche_technique_brouillon ? (
              <Link href={`/parametrage/fiches-techniques/${a.fiche_technique_brouillon}`} className="text-primary" onClick={(e) => e.stopPropagation()}>
                <StatusBadge tone="warning">Brouillon</StatusBadge>
              </Link>
            ) : "—",
            href: `/parametrage/produits/${a.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>

      {writable && (
        <Panel className="p-4 space-y-4">
          <div>
            <h2 className="text-[13px] font-semibold">Listes de valeurs</h2>
            <p className="text-[12px] text-muted">
              Ajoutez une valeur manquante (nouvelle famille, nouveau format…) sans intervention technique. Une valeur désactivée n&apos;est plus proposée mais reste sur les articles existants.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <Field label="Liste">
              <select className={inputClass} value={nouvelleListe} onChange={(e) => setNouvelleListe(e.target.value as ListeValeurs)}>
                {listes.map((l) => <option key={l.cle} value={l.cle}>{l.titre}</option>)}
              </select>
            </Field>
            <Field label="Nouvelle valeur">
              <input className={inputClass} value={nouvelleValeur} onChange={(e) => setNouvelleValeur(e.target.value)} />
            </Field>
            <Button
              disabled={!nouvelleValeur.trim()}
              onClick={() => {
                void dispatch({ type: "CREATE_VALEUR_LISTE", liste: nouvelleListe, valeur: nouvelleValeur });
                setNouvelleValeur("");
              }}
            >
              Ajouter à la liste
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listes.map((l) => (
              <div key={l.cle}>
                <p className="text-[12px] font-medium mb-1">{l.titre}</p>
                {l.valeurs.length === 0 ? (
                  <p className="text-[12px] text-muted">Aucune valeur.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {l.valeurs.map((v) => (
                      <li key={v.id} className="flex items-center gap-1 rounded border border-line px-2 py-1 text-[12px]">
                        <span className={v.actif ? "" : "line-through text-muted"}>{v.libelle}</span>
                        <button
                          className="text-primary text-[11px]"
                          onClick={() => void dispatch({ type: "TOGGLE_VALEUR_LISTE", liste: l.cle, id: v.id, actif: !v.actif })}
                        >
                          {v.actif ? "désactiver" : "activer"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
