"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calculator, Check, FilePlus2, FlaskConical, Lock, Pencil, Plus, RotateCcw, ScrollText, Search, Trash2, X } from "lucide-react";
import { Segmented, matchSearch } from "@/components/Filters";
import { Button, Field, PageHeader, StatusBadge, inputClass } from "@/components/ui";
import { actions, api, detail, endpoints, type SimulationBesoins } from "@/lib/api";
import { BASE_CALCUL_LABEL, STATUT_FT_LABEL, TYPES_FABRIQUES, UNITE_LABEL, UNITE_REFERENCE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { BaseCalcul, ElementComposition, FicheTechnique, StatutFicheTechnique, UniteReference } from "@/lib/types";
import { cn, formatDa, formatDate, formatQty, num } from "@/lib/utils";

const BASE = "/parametrage/fiches-techniques";

const TONE_FT: Record<StatutFicheTechnique, "success" | "warning" | "info" | "neutral"> = {
  BROUILLON: "warning",
  EN_TEST: "info",
  VALIDEE: "success",
  ARCHIVEE: "neutral",
};

function FtBadge({ ft }: { ft: FicheTechnique }) {
  return <StatusBadge tone={TONE_FT[ft.statut]}>{STATUT_FT_LABEL[ft.statut]}</StatusBadge>;
}

type FiltreFt = "TOUS" | "BROUILLON" | "EN_TEST" | "VALIDEE";

/** Liste des fiches à gauche, éditeur de la fiche sélectionnée à droite. */
export function FicheTechniqueWorkspace({ selectedId }: { selectedId: number | null }) {
  const { state, articleName, can, dispatch } = useStore();
  const router = useRouter();
  // L’écriture des fiches et de leur composition est réservée à l’Admin SI côté backend.
  const writable = can("CREATE_FT");
  const [query, setQuery] = useState("");
  const [fStatut, setFStatut] = useState<FiltreFt>("TOUS");
  const [creating, setCreating] = useState(false);
  const [newArticle, setNewArticle] = useState(0);

  const fiches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordre: Record<StatutFicheTechnique, number> = { BROUILLON: 0, EN_TEST: 1, VALIDEE: 2, ARCHIVEE: 3 };
    return [...state.fichesTechniques]
      .filter((f) => matchSearch(q, articleName(f.article), `v${f.version}`) && (fStatut === "TOUS" || f.statut === fStatut))
      .sort((a, b) => ordre[a.statut] - ordre[b.statut] || articleName(a.article).localeCompare(articleName(b.article), "fr") || b.version - a.version);
  }, [state.fichesTechniques, query, fStatut, articleName]);

  const selected = state.fichesTechniques.find((f) => f.id === selectedId) ?? null;
  const compte = (s: StatutFicheTechnique) => state.fichesTechniques.filter((f) => f.statut === s).length;
  const brouillons = compte("BROUILLON");
  const enTest = compte("EN_TEST");
  // Un article qui a déjà une fiche en cours (brouillon ou en test) ne se voit pas proposer une seconde fiche.
  const enCours = new Set(state.fichesTechniques.filter((f) => f.statut === "BROUILLON" || f.statut === "EN_TEST").map((f) => f.article));
  // Produits finis, intermédiaires et fluides de process : tout ce qu’un OF peut fabriquer.
  const creables = state.articles.filter((a) => a.actif && TYPES_FABRIQUES.includes(a.type_article) && !enCours.has(a.id));

  // Article dont on vient de créer le brouillon : on l’ouvre dès qu’il apparaît après rechargement.
  const pendingArticle = useRef<number | null>(null);
  useEffect(() => {
    const article = pendingArticle.current;
    if (article == null) return;
    const nouvelle = state.fichesTechniques.filter((f) => f.article === article && f.statut === "BROUILLON").sort((x, y) => y.id - x.id)[0];
    if (nouvelle) {
      pendingArticle.current = null;
      router.push(`${BASE}/${nouvelle.id}`);
    }
  }, [state.fichesTechniques, router]);

  async function createFiche() {
    if (!newArticle) return;
    pendingArticle.current = newArticle;
    // Nouvelle version = dernière version de l’article + 1 (unicité article/version côté backend).
    const version = Math.max(0, ...state.fichesTechniques.filter((f) => f.article === newArticle).map((f) => f.version)) + 1;
    const ok = await dispatch({ type: "CREATE_FT", article: newArticle, version });
    if (!ok) {
      pendingArticle.current = null;
      return;
    }
    setCreating(false);
    setNewArticle(0);
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      <PageHeader
        eyebrow="Référentiel"
        title="Fiches techniques"
        description="La recette d’un article fabriqué : quantité de référence, rendement, composants (ingrédients et emballages). Elle sert au calcul des besoins matières d’un OF dès qu’elle est validée ; un essai peut la figer avant validation."
        status={
          <span className="flex gap-1.5">
            {brouillons > 0 && <StatusBadge tone="warning">{brouillons} en brouillon</StatusBadge>}
            {enTest > 0 && <StatusBadge tone="info">{enTest} en test</StatusBadge>}
          </span>
        }
      />

      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        {/* Liste des fiches */}
        <aside className={cn("evam-card overflow-hidden lg:sticky lg:top-[72px]", selected && "hidden lg:block")}>
          <div className="p-3 border-b border-line space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className={cn(inputClass, "pl-8 h-8 text-[12.5px]")} placeholder="Rechercher un article…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Segmented
              label="Statut"
              value={fStatut}
              onChange={setFStatut}
              options={[
                { value: "TOUS", label: "Toutes", count: state.fichesTechniques.length },
                { value: "BROUILLON", label: "Brouillons", count: brouillons },
                { value: "EN_TEST", label: "En test", count: enTest },
                { value: "VALIDEE", label: "Validées", count: compte("VALIDEE") },
              ]}
            />
            {writable &&
              (creating ? (
                <div className="rounded-[8px] border border-line bg-surface-2 p-2.5 space-y-2">
                  <select className={cn(inputClass, "h-8 text-[12.5px]")} value={newArticle} onChange={(e) => setNewArticle(Number(e.target.value))} autoFocus>
                    <option value={0}>Choisir un article fabriqué…</option>
                    {creables.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} · {a.designation}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button className="h-8 flex-1" disabled={!newArticle} onClick={() => void createFiche()}>
                      Créer le brouillon
                    </Button>
                    <Button className="h-8" variant="ghost" onClick={() => setCreating(false)} aria-label="Annuler">
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" className="h-8 w-full" onClick={() => setCreating(true)}>
                  <FilePlus2 size={14} /> Nouvelle fiche
                </Button>
              ))}
          </div>
          <ul className="max-h-[calc(100dvh-260px)] overflow-y-auto overscroll-contain">
            {fiches.length === 0 && <li className="px-4 py-8 text-center text-[12.5px] text-muted">{state.fichesTechniques.length ? "Aucune fiche pour ces filtres." : "Aucune fiche."}</li>}
            {fiches.map((f) => {
              const active = f.id === selectedId;
              return (
                <li key={f.id} className="border-b border-line last:border-0">
                  <Link
                    href={`${BASE}/${f.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors border-l-2",
                      active ? "bg-primary-soft border-primary" : "border-transparent hover:bg-surface-2",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[13px] truncate", active ? "font-semibold text-ink" : "font-medium")}>{articleName(f.article)}</p>
                      <p className="text-[11.5px] text-muted">
                        Version {f.version}
                        {(f.formats_associes?.length ?? 0) > 0 && ` · +${f.formats_associes?.length} format(s)`}
                      </p>
                    </div>
                    <FtBadge ft={f} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Éditeur */}
        <section className={cn(!selected && "hidden lg:block")}>
          {selected ? (
            <FicheEditor key={selected.id} ft={selected} writable={writable} canValidate={can("VALIDER_FT")} canTest={can("TESTER_FT")} />
          ) : (
            <div className="evam-card px-6 py-16 text-center">
              <ScrollText size={28} className="mx-auto text-muted/60" />
              <p className="text-[14px] font-medium mt-3">Sélectionnez une fiche</p>
              <p className="text-[12.5px] text-muted mt-1">Choisissez une fiche dans la liste pour voir ou modifier sa recette.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FicheEditor({ ft, writable, canValidate, canTest }: { ft: FicheTechnique; writable: boolean; canValidate: boolean; canTest: boolean }) {
  const { state, dispatch, articleName, userName, role } = useStore();
  const router = useRouter();
  // La Qualité lit les recettes sans leur chiffrage (prix et coûts retirés par le backend).
  const voitPrix = role !== "RESPONSABLE_QUALITE";
  const [majPrix, setMajPrix] = useState(false);
  const compo = state.compositions
    .filter((c) => c.fiche_technique === ft.id)
    .sort((a, b) => (a.ordre_incorporation ?? 0) - (b.ordre_incorporation ?? 0) || a.id - b.id);
  const editable = writable && ft.statut === "BROUILLON";
  // Une recette en vigueur ne se modifie pas directement : ses prix changent par une nouvelle
  // version (« Mettre à jour les prix ») ; en brouillon, ils se saisissent dans le tableau.
  const prixEditable = editable;
  const [disponibles, setDisponibles] = useState<ElementComposition[]>([]);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Liste de choix calculée par le backend (composants actifs, pas encore dans la fiche, jamais de
  // produit fini) : on ne la reconstruit pas côté client pour éviter doublons et erreurs.
  useEffect(() => {
    if (!editable) return;
    let annule = false;
    void actions
      .elementsDisponibles(ft.id)
      .then((elements) => {
        if (!annule) setDisponibles(elements);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [ft.id, editable, compo.length]);

  async function savePatch(id: number, champs: Record<string, unknown>) {
    return dispatch({ type: "EXEC", run: () => api.patch(detail(endpoints.compositions, id), champs), refresh: ["compositions", "fichesTechniques"] });
  }
  async function transition(nom: string, run: () => Promise<unknown>) {
    setBusy(nom);
    await dispatch({ type: "EXEC", run, refresh: ["fichesTechniques", "compositions"] });
    setBusy(null);
  }

  const formats = ft.formats_associes ?? [];
  const etapeNom = (id: number | null | undefined) => {
    if (id == null) return "—";
    const e = state.etapesStandard.find((x) => x.id === id);
    return e ? e.libelle : `#${id}`;
  };

  return (
    <div className="evam-card flex flex-col min-h-[420px]">
      <header className="px-4 sm:px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-start gap-3">
        <Link href={BASE} className="lg:hidden inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
          <ArrowLeft size={13} /> Liste
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-semibold tracking-tight break-words">{articleName(ft.article)}</h2>
            <FtBadge ft={ft} />
          </div>
          <p className="text-[12px] text-muted mt-1">
            Version {ft.version} · créée le {formatDate(ft.date_creation)} par {userName(ft.cree_par)}
            {ft.date_validation && ` · validée le ${formatDate(ft.date_validation)}${ft.valide_par ? ` par ${userName(ft.valide_par)}` : ""}`}
          </p>
        </div>
        {voitPrix && (
          <div className="shrink-0 text-right">
            <p className="text-[10.5px] uppercase tracking-wide text-muted">Coût matières / unité de stock</p>
            {ft.cout_matieres_par_unite != null ? (
              <p className="text-[18px] font-semibold num">{formatDa(num(ft.cout_matieres_par_unite))}</p>
            ) : (
              <p className="text-[12px] text-warning max-w-[220px]">Recette en litres/kg : renseignez la contenance de l’article.</p>
            )}
          </div>
        )}
      </header>

      <div className="px-4 sm:px-5 py-4 flex-1 space-y-5">
        <RecetteSection ft={ft} editable={editable} />

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[13px] font-semibold">
              Composants <span className="text-muted font-normal">({compo.length})</span>
            </h3>
            {editable && !adding && (
              <Button className="h-8" onClick={() => setAdding(true)} disabled={disponibles.length === 0}>
                <Plus size={14} /> Ajouter
              </Button>
            )}
          </div>

          {editable && adding && <AjoutComposant ft={ft} disponibles={disponibles} onClose={() => setAdding(false)} />}

          {compo.length === 0 ? (
            <div className="rounded-[9px] border border-dashed border-line-strong px-4 py-10 text-center">
              <p className="text-[13px] text-muted">Aucun composant pour le moment.</p>
              {editable && <p className="text-[12px] text-muted mt-1">Utilisez « Ajouter » pour renseigner les ingrédients et les emballages de la recette.</p>}
            </div>
          ) : (
            <div className="rounded-[9px] border border-line overflow-x-auto">
              <table className="w-full text-left min-w-[760px]">
                <thead>
                  <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-3 py-2 font-medium">Composant</th>
                    <th className="px-3 py-2 font-medium">Base de calcul</th>
                    <th className="px-3 py-2 font-medium text-right">Quantité</th>
                    <th className="px-3 py-2 font-medium text-right">Perte</th>
                    <th className="px-3 py-2 font-medium">Étape</th>
                    {voitPrix && <th className="px-3 py-2 font-medium text-right">Prix unitaire</th>}
                    {editable && <th className="px-3 py-2 w-[52px]" />}
                  </tr>
                </thead>
                <tbody>
                  {compo.map((c) => (
                    <tr key={c.id} className="border-b border-line last:border-0 align-top">
                      <td className="px-3 py-2.5">
                        <p className="text-[13px] font-medium">{c.matiere_designation ?? articleName(c.matiere)}</p>
                        <p className="text-[11.5px] text-muted">
                          {c.matiere_code}
                          {c.role && ` · ${c.role}`}
                          {c.article_format && ` · uniquement ${articleName(c.article_format)}`}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        {editable ? (
                          <select
                            className={cn(inputClass, "h-8 text-[12.5px] w-[170px]")}
                            value={c.base_calcul ?? "REFERENCE"}
                            onChange={(e) => void savePatch(c.id, { base_calcul: e.target.value })}
                          >
                            {(Object.keys(BASE_CALCUL_LABEL) as BaseCalcul[]).map((k) => (
                              <option key={k} value={k}>
                                {BASE_CALCUL_LABEL[k]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[12.5px]">{BASE_CALCUL_LABEL[c.base_calcul ?? "REFERENCE"]}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <div className="inline-flex items-center gap-1.5">
                            <NumInput value={num(c.quantite_necessaire)} min={0} strict onSave={(q) => savePatch(c.id, { quantite_necessaire: q })} />
                            <select
                              aria-label="Unité de la quantité"
                              className={cn(inputClass, "h-8 w-[110px] text-[12px]")}
                              value={c.unite || c.unite_mesure || ""}
                              onChange={(e) => void savePatch(c.id, { unite: e.target.value })}
                            >
                              {(Object.keys(UNITE_LABEL) as (keyof typeof UNITE_LABEL)[]).map((u) => (
                                <option key={u} value={u}>
                                  {UNITE_LABEL[u]}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-[13px] num">
                            {formatQty(num(c.quantite_necessaire), 4)}
                            {(c.unite || c.unite_mesure) && <span className="text-muted ml-1">{UNITE_LABEL[(c.unite || c.unite_mesure) as keyof typeof UNITE_LABEL]}</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <NumInput
                            value={num(c.perte_theorique_pct)}
                            unite="%"
                            min={0}
                            onSave={(p) => savePatch(c.id, { perte_theorique_pct: p || null })}
                          />
                        ) : (
                          <span className="text-[13px] num">{c.perte_theorique_pct != null ? `${formatQty(num(c.perte_theorique_pct), 2)} %` : "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {editable ? (
                          <select
                            className={cn(inputClass, "h-8 text-[12.5px] w-[160px]")}
                            value={c.etape ?? 0}
                            onChange={(e) => void savePatch(c.id, { etape: Number(e.target.value) || null })}
                          >
                            <option value={0}>—</option>
                            {state.etapesStandard
                              .filter((e) => e.actif)
                              .map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.libelle}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span className="text-[12.5px]">{etapeNom(c.etape)}</span>
                        )}
                      </td>
                      {voitPrix && (
                        <td className="px-3 py-2 text-right">
                          {prixEditable ? (
                            <NumInput value={num(c.prix_unitaire)} min={0} onSave={(p) => savePatch(c.id, { prix_unitaire: p })} />
                          ) : (
                            <span className="text-[13px] num">{formatDa(num(c.prix_unitaire))}</span>
                          )}
                        </td>
                      )}
                      {editable && (
                        <td className="px-3 py-2 text-right">
                          <IconBtn label="Retirer" danger onClick={() => void dispatch({ type: "DELETE_COMPOSITION", id: c.id })}>
                            <Trash2 size={13} />
                          </IconBtn>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11.5px] text-muted mt-2">
            Ingrédients : quantité pour la quantité de référence de la recette. Emballages : par bouteille / pot (préforme, bouchon, étiquette) ou par pack
            (film, carton). La perte théorique s’ajoute au besoin. Une quantité saisie dans une autre unité (20 g pour un article géré en kg) est convertie
            par la table des conversions.
          </p>
        </section>

        {majPrix && (
          <MiseAJourPrix
            ft={ft}
            onClose={() => setMajPrix(false)}
            onCree={(id) => {
              setMajPrix(false);
              router.push(`${BASE}/${id}`);
            }}
          />
        )}

        {/* Simulation chiffrée : refusée à la Qualité par le backend. */}
        {compo.length > 0 && voitPrix && <SimulationSection ft={ft} formats={formats} />}
      </div>

      {/* Barre d’actions collée en bas de l’écran */}
      {(ft.statut === "BROUILLON" || ft.statut === "EN_TEST") && (canValidate || canTest) ? (
        <footer className="sticky bottom-0 z-10 px-4 sm:px-5 py-3 border-t border-line bg-surface/95 backdrop-blur-md rounded-b-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[12px] text-muted">
            {compo.length === 0
              ? "Ajoutez au moins un composant avant l’essai ou la validation."
              : ft.statut === "EN_TEST"
                ? "Fiche en essai : la composition est figée. Repassez-la en brouillon pour l’ajuster, ou validez-la."
                : "Mettez la fiche en test pour un essai, ou validez-la : elle servira alors au calcul des OF."}
          </p>
          <div className="flex flex-wrap gap-2">
            {canTest && ft.statut === "BROUILLON" && (
              <Button variant="secondary" disabled={compo.length === 0 || busy != null} onClick={() => void transition("test", () => actions.mettreFicheEnTest(ft.id))}>
                <FlaskConical size={15} /> {busy === "test" ? "…" : "Mettre en test"}
              </Button>
            )}
            {canTest && ft.statut === "EN_TEST" && (
              <Button variant="secondary" disabled={busy != null} onClick={() => void transition("brouillon", () => actions.repasserFicheEnBrouillon(ft.id))}>
                <RotateCcw size={15} /> {busy === "brouillon" ? "…" : "Repasser en brouillon"}
              </Button>
            )}
            {canValidate && (
              <Button variant="success" disabled={compo.length === 0 || busy != null} onClick={() => void transition("valider", () => actions.validerFiche(ft.id))}>
                <Check size={15} /> {busy === "valider" ? "Validation…" : "Valider la fiche"}
              </Button>
            )}
          </div>
        </footer>
      ) : ft.statut !== "BROUILLON" ? (
        <footer className="px-4 sm:px-5 py-3 border-t border-line bg-surface-2/60 rounded-b-[10px] text-[12px] text-muted flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="flex items-center gap-2 flex-1">
            <Lock size={13} className="shrink-0" />
            Fiche {STATUT_FT_LABEL[ft.statut].toLowerCase()} : composants, recette et prix ne changent plus.
            {ft.statut === "VALIDEE" && writable && " Pour changer un prix, créez une nouvelle version (les OF existants gardent leur prix)."}
          </span>
          {ft.statut === "VALIDEE" && writable && voitPrix && !majPrix && (
            <Button variant="secondary" className="h-8" onClick={() => setMajPrix(true)}>
              <Pencil size={14} /> Mettre à jour les prix
            </Button>
          )}
        </footer>
      ) : null}
    </div>
  );
}

/** En-tête de recette : quantité de référence, rendement, process, validité, formats qui la partagent. */
function RecetteSection({ ft, editable }: { ft: FicheTechnique; editable: boolean }) {
  const { state, dispatch, articleName } = useStore();
  const [edit, setEdit] = useState(false);
  const article = state.articles.find((a) => a.id === ft.article);
  const [form, setForm] = useState(() => ({
    quantite_reference: ft.quantite_reference ?? "1",
    unite_reference: (ft.unite_reference ?? "UNITE_STOCK") as UniteReference,
    rendement_theorique_pct: ft.rendement_theorique_pct ?? "",
    parametres_process: ft.parametres_process ?? "",
    date_debut_validite: ft.date_debut_validite ?? "",
    date_fin_validite: ft.date_fin_validite ?? "",
    document_reference: ft.document_reference ?? "",
    formats_associes: ft.formats_associes ?? [],
  }));
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  // Formats pouvant partager la recette : produits finis actifs de la même activité.
  const formatsPossibles = state.articles.filter(
    (a) => a.type_article === "PRODUIT_FINI" && a.actif && a.id !== ft.article && (!article?.activite || !a.activite || a.activite === article.activite),
  );

  async function save() {
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.patch(detail(endpoints.fichesTechniques, ft.id), {
          quantite_reference: Number(form.quantite_reference),
          unite_reference: form.unite_reference,
          rendement_theorique_pct: form.rendement_theorique_pct === "" ? null : Number(form.rendement_theorique_pct),
          parametres_process: form.parametres_process,
          date_debut_validite: form.date_debut_validite || null,
          date_fin_validite: form.date_fin_validite || null,
          document_reference: form.document_reference,
          formats_associes: form.formats_associes,
        }),
      refresh: ["fichesTechniques"],
    });
    if (ok) setEdit(false);
  }

  const lignes: { label: string; value: string }[] = [
    {
      label: "Composition donnée pour",
      value: `${formatQty(num(ft.quantite_reference ?? 1), 3)} ${UNITE_REFERENCE_LABEL[ft.unite_reference ?? "UNITE_STOCK"].toLowerCase()}`,
    },
    { label: "Rendement théorique", value: ft.rendement_theorique_pct ? `${formatQty(num(ft.rendement_theorique_pct), 2)} %` : "—" },
    {
      label: "Validité",
      value: ft.date_debut_validite || ft.date_fin_validite ? `${ft.date_debut_validite ? formatDate(ft.date_debut_validite) : "…"} → ${ft.date_fin_validite ? formatDate(ft.date_fin_validite) : "…"}` : "Sans limite",
    },
    { label: "Fiche de référence", value: ft.document_reference || "—" },
  ];

  if (!edit) {
    return (
      <section className="rounded-[9px] border border-line bg-surface-2/40 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold">Recette</h3>
          {editable && (
            <Button variant="ghost" className="h-7 px-2 text-[12px]" onClick={() => setEdit(true)}>
              <Pencil size={13} /> Modifier
            </Button>
          )}
        </div>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {lignes.map((l) => (
            <div key={l.label} className="flex justify-between gap-3 text-[12.5px]">
              <dt className="text-muted">{l.label}</dt>
              <dd className="font-medium text-right">{l.value}</dd>
            </div>
          ))}
        </dl>
        {ft.parametres_process && <p className="text-[12.5px] whitespace-pre-line border-t border-line pt-2">{ft.parametres_process}</p>}
        <div className="border-t border-line pt-2">
          <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1">Autres formats utilisant cette recette</p>
          {(ft.formats_associes ?? []).length === 0 ? (
            <p className="text-[12.5px] text-muted">Aucun : recette propre à {articleName(ft.article)}.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(ft.formats_associes ?? []).map((id) => (
                <StatusBadge key={id} tone="teal">
                  {articleName(id)}
                </StatusBadge>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[9px] border border-primary/30 bg-primary-soft/30 p-3.5 space-y-3">
      <h3 className="text-[13px] font-semibold">Recette</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Quantité de référence">
          <input className={cn(inputClass, "num text-right")} type="number" min="0" step="any" value={form.quantite_reference} onChange={(e) => set("quantite_reference", e.target.value)} />
        </Field>
        <Field label="Unité de référence">
          <select className={inputClass} value={form.unite_reference} onChange={(e) => set("unite_reference", e.target.value as UniteReference)}>
            {(Object.keys(UNITE_REFERENCE_LABEL) as UniteReference[]).map((k) => (
              <option key={k} value={k}>
                {UNITE_REFERENCE_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rendement théorique (%)">
          <input className={cn(inputClass, "num text-right")} type="number" min="0" max="100" step="any" placeholder="ex. 98" value={form.rendement_theorique_pct} onChange={(e) => set("rendement_theorique_pct", e.target.value)} />
        </Field>
        <Field label="Valide à partir du">
          <input className={inputClass} type="date" value={form.date_debut_validite} onChange={(e) => set("date_debut_validite", e.target.value)} />
        </Field>
        <Field label="Valide jusqu’au">
          <input className={inputClass} type="date" value={form.date_fin_validite} onChange={(e) => set("date_fin_validite", e.target.value)} />
        </Field>
        <Field label="Fiche / formulation de référence">
          <input className={inputClass} value={form.document_reference} onChange={(e) => set("document_reference", e.target.value)} />
        </Field>
      </div>
      <Field label="Paramètres de process (températures, temps, agitation…)">
        <textarea className={cn(inputClass, "h-20 py-2")} value={form.parametres_process} onChange={(e) => set("parametres_process", e.target.value)} />
      </Field>
      <Field label="Autres formats utilisant cette recette">
        <div className="max-h-36 overflow-y-auto rounded-[7px] border border-line-strong bg-surface p-2 grid sm:grid-cols-2 gap-1">
          {formatsPossibles.length === 0 && <p className="text-[12px] text-muted">Aucun autre produit fini de la même activité.</p>}
          {formatsPossibles.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={form.formats_associes.includes(a.id)}
                onChange={(e) => set("formats_associes", e.target.checked ? [...form.formats_associes, a.id] : form.formats_associes.filter((x) => x !== a.id))}
              />
              <span className="truncate">
                {a.code} · {a.designation}
              </span>
            </label>
          ))}
        </div>
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setEdit(false)}>
          Annuler
        </Button>
        <Button disabled={!(Number(form.quantite_reference) > 0)} onClick={() => void save()}>
          <Check size={14} /> Enregistrer la recette
        </Button>
      </div>
    </section>
  );
}

function AjoutComposant({ ft, disponibles, onClose }: { ft: FicheTechnique; disponibles: ElementComposition[]; onClose: () => void }) {
  const { state, dispatch, articleName } = useStore();
  const [matiere, setMatiere] = useState(0);
  const [base, setBase] = useState<BaseCalcul>("REFERENCE");
  const [qty, setQty] = useState("");
  const [prix, setPrix] = useState("");
  const [perte, setPerte] = useState("");
  const [etape, setEtape] = useState(0);
  const [format, setFormat] = useState(0);
  const [role, setRole] = useState("");
  const choisie = disponibles.find((d) => d.id === matiere);
  const [uniteChoisie, setUniteChoisie] = useState("");
  // Par défaut : unité de consommation de l’article, sinon son unité de stock.
  const unite = (uniteChoisie || choisie?.unite_consommation || choisie?.unite_mesure) as keyof typeof UNITE_LABEL | undefined;
  const formats = [ft.article, ...(ft.formats_associes ?? [])];
  const ordre = Math.max(0, ...state.compositions.filter((c) => c.fiche_technique === ft.id).map((c) => c.ordre_incorporation ?? 0)) + 1;

  async function add() {
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.post(endpoints.compositions, {
          fiche_technique: ft.id,
          matiere,
          quantite_necessaire: Number(qty),
          prix_unitaire: Number(prix),
          base_calcul: base,
          perte_theorique_pct: perte === "" ? null : Number(perte),
          etape: etape || null,
          article_format: format || null,
          role,
          ordre_incorporation: ordre,
          ...(unite ? { unite } : {}),
        }),
      refresh: ["compositions", "fichesTechniques"],
    });
    if (ok) onClose();
  }

  return (
    <div className="mb-3 rounded-[9px] border border-primary/30 bg-primary-soft/40 p-3 space-y-2">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_180px] gap-2">
        <Field label="Composant">
          <select className={inputClass} value={matiere} onChange={(e) => setMatiere(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir…</option>
            {disponibles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Base de calcul">
          <select className={inputClass} value={base} onChange={(e) => setBase(e.target.value as BaseCalcul)}>
            {(Object.keys(BASE_CALCUL_LABEL) as BaseCalcul[]).map((k) => (
              <option key={k} value={k}>
                {BASE_CALCUL_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="Quantité">
          <div className="flex gap-1.5">
            <input className={cn(inputClass, "text-right num")} type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
            <select aria-label="Unité" className={cn(inputClass, "w-[96px]")} value={unite ?? ""} onChange={(e) => setUniteChoisie(e.target.value)} disabled={!matiere}>
              {(Object.keys(UNITE_LABEL) as (keyof typeof UNITE_LABEL)[]).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Prix unitaire (FCFA)">
          <input className={cn(inputClass, "text-right num")} type="number" min="0" step="any" value={prix} onChange={(e) => setPrix(e.target.value)} />
        </Field>
        <Field label="Perte théorique (%)">
          <input className={cn(inputClass, "text-right num")} type="number" min="0" max="100" step="any" value={perte} onChange={(e) => setPerte(e.target.value)} />
        </Field>
        <Field label="Étape de consommation">
          <select className={inputClass} value={etape} onChange={(e) => setEtape(Number(e.target.value))}>
            <option value={0}>—</option>
            {state.etapesStandard
              .filter((e) => e.actif)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.libelle}
                </option>
              ))}
          </select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Rôle (facultatif)">
          <input className={inputClass} placeholder="ex. ingrédient, emballage primaire" value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        {formats.length > 1 && (
          <Field label="Uniquement pour le format">
            <select className={inputClass} value={format} onChange={(e) => setFormat(Number(e.target.value))}>
              <option value={0}>Tous les formats</option>
              {formats.map((id) => (
                <option key={id} value={id}>
                  {articleName(id)}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button disabled={!matiere || !(Number(qty) > 0) || prix.trim() === "" || Number(prix) < 0} onClick={() => void add()}>
          <Check size={14} /> Ajouter
        </Button>
      </div>
    </div>
  );
}

/** Contrôle de la recette avant validation : besoins qu’un OF générerait. */
function SimulationSection({ ft, formats }: { ft: FicheTechnique; formats: number[] }) {
  const { articleName } = useStore();
  const [quantite, setQuantite] = useState("100");
  const [article, setArticle] = useState(ft.article);
  const [resultat, setResultat] = useState<SimulationBesoins | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [calcul, setCalcul] = useState(false);

  async function simuler() {
    setCalcul(true);
    setErreur(null);
    try {
      setResultat(await actions.simulerBesoins(ft.id, quantite, article));
    } catch (err) {
      setResultat(null);
      setErreur(err instanceof Error ? err.message : "Simulation impossible.");
    } finally {
      setCalcul(false);
    }
  }

  const total = resultat?.besoins.reduce((a, b) => a + num(b.montant), 0) ?? 0;

  return (
    <section className="rounded-[9px] border border-line p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <Calculator size={15} className="text-primary" />
        <h3 className="text-[13px] font-semibold">Simuler les besoins d’un OF</h3>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {formats.length > 0 && (
          <Field label="Format">
            <select className={cn(inputClass, "w-[240px]")} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {[ft.article, ...formats].map((id) => (
                <option key={id} value={id}>
                  {articleName(id)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Quantité à produire (unité de stock)">
          <input className={cn(inputClass, "w-[180px] num text-right")} type="number" min="0" step="any" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </Field>
        <Button variant="secondary" disabled={!(Number(quantite) > 0) || calcul} onClick={() => void simuler()}>
          {calcul ? "Calcul…" : "Simuler"}
        </Button>
      </div>
      {erreur && <p className="text-[12.5px] text-danger">{erreur}</p>}
      {resultat && (
        <div className="rounded-[8px] border border-line overflow-x-auto">
          <table className="w-full text-left min-w-[520px]">
            <thead>
              <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
                <th className="px-3 py-2 font-medium">Composant</th>
                <th className="px-3 py-2 font-medium">Base</th>
                <th className="px-3 py-2 font-medium text-right">Besoin</th>
                <th className="px-3 py-2 font-medium text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {resultat.besoins.map((b) => (
                <tr key={b.matiere} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-[12.5px]">
                    <span className="font-medium">{b.designation}</span> <span className="text-muted">{b.matiere}</span>
                  </td>
                  <td className="px-3 py-2 text-[12.5px]">{BASE_CALCUL_LABEL[b.base_calcul as BaseCalcul] ?? b.base_calcul}</td>
                  <td className="px-3 py-2 text-[12.5px] text-right num">
                    {formatQty(num(b.quantite), 3)} <span className="text-muted">{UNITE_LABEL[b.unite as keyof typeof UNITE_LABEL] ?? b.unite}</span>
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-right num">{formatDa(num(b.montant))}</td>
                </tr>
              ))}
              <tr className="bg-surface-2/60">
                <td colSpan={3} className="px-3 py-2 text-[12.5px] font-semibold">
                  Total pour {formatQty(num(resultat.quantite), 0)} {resultat.article}
                </td>
                <td className="px-3 py-2 text-[12.5px] text-right num font-semibold">{formatDa(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {!resultat && !erreur && (
        <p className="text-[12px] text-muted">Le calcul applique la quantité de référence, le rendement, la base de calcul et la perte théorique de chaque ligne.</p>
      )}
    </section>
  );
}

/** Valeur numérique modifiable directement dans le tableau : enregistrée à la sortie du champ ou sur Entrée. */
function NumInput({
  value,
  unite,
  min,
  strict,
  onSave,
}: {
  value: number;
  unite?: string;
  min?: number;
  /** Strictement supérieure au minimum (quantité) plutôt que supérieure ou égale (prix, perte). */
  strict?: boolean;
  onSave: (v: number) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(String(value));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => setDraft(String(value)), [value]);

  async function commit() {
    const v = Number(draft);
    const ok = draft.trim() !== "" && Number.isFinite(v) && (min == null || (strict ? v > min : v >= min));
    if (!ok) {
      setDraft(String(value));
      setState("error");
      return;
    }
    if (v === value) return;
    setState("saving");
    const saved = await onSave(v);
    setState(saved ? "saved" : "error");
    if (!saved) setDraft(String(value));
  }

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      {state === "saved" && <Check size={13} className="text-success" aria-label="Enregistré" />}
      <input
        className={cn(
          "h-8 w-24 rounded-[6px] px-2 text-[12.5px] text-right num bg-surface border transition-colors outline-none",
          state === "error" ? "border-danger" : "border-line-strong hover:border-primary/50 focus:border-primary",
          state === "saving" && "opacity-60",
        )}
        type="number"
        min={min}
        step="any"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setState("idle");
        }}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(String(value));
            setState("idle");
          }
        }}
      />
      {unite && <span className="text-[12px] text-muted w-8 text-left">{unite}</span>}
    </div>
  );
}

function IconBtn({ children, label, onClick, danger, disabled }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 w-7 rounded-[6px] flex items-center justify-center transition-colors disabled:opacity-40",
        danger ? "text-muted hover:text-danger hover:bg-danger-soft" : "text-muted hover:text-ink hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Recette validée : les prix changent par une nouvelle version, validée d’office ; l’ancienne est
 * archivée et les OF déjà créés gardent le prix de leur création (historique conservé).
 */
function MiseAJourPrix({ ft, onClose, onCree }: { ft: FicheTechnique; onClose: () => void; onCree: (id: number) => void }) {
  const { state, dispatch } = useStore();
  const compo = state.compositions.filter((c) => c.fiche_technique === ft.id);
  const [prix, setPrix] = useState<Record<number, string>>(() => Object.fromEntries(compo.map((c) => [c.matiere, String(num(c.prix_unitaire))])));
  const [busy, setBusy] = useState(false);
  const modifies = compo.filter((c) => prix[c.matiere] !== undefined && Number(prix[c.matiere]) !== num(c.prix_unitaire));
  const valide = modifies.length > 0 && modifies.every((c) => Number(prix[c.matiere]) >= 0 && prix[c.matiere] !== "");

  async function enregistrer() {
    setBusy(true);
    let nouvelle: number | null = null;
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        const copie = await actions.mettreAJourPrixFiche(ft.id, Object.fromEntries(modifies.map((c) => [String(c.matiere), Number(prix[c.matiere])])));
        nouvelle = copie.id;
      },
      refresh: ["fichesTechniques", "compositions"],
    });
    setBusy(false);
    if (ok && nouvelle != null) onCree(nouvelle);
  }

  return (
    <section className="rounded-[9px] border border-primary/30 bg-primary-soft/30 p-3.5 space-y-3">
      <div>
        <h3 className="text-[13px] font-semibold">Nouvelle version avec de nouveaux prix</h3>
        <p className="text-[12px] text-muted">
          La version {ft.version} sera archivée ; la nouvelle (même composition) est validée et sert aux prochains OF.
        </p>
      </div>
      <ul className="rounded-[8px] border border-line divide-y divide-line bg-surface">
        {compo.map((c) => (
          <li key={c.id} className="px-3 py-2 flex items-center gap-3">
            <span className="min-w-0 flex-1 text-[12.5px] truncate">{c.matiere_designation ?? c.matiere_code}</span>
            <span className="text-[11.5px] text-muted num">actuel {formatDa(num(c.prix_unitaire))}</span>
            <input
              type="number"
              min="0"
              step="any"
              aria-label={`Nouveau prix ${c.matiere_designation ?? ""}`}
              className={cn(inputClass, "h-8 w-[120px] num text-right")}
              value={prix[c.matiere] ?? ""}
              onChange={(e) => setPrix((p) => ({ ...p, [c.matiere]: e.target.value }))}
            />
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button disabled={!valide || busy} onClick={() => void enregistrer()}>
          <Check size={14} /> {busy ? "Création…" : `Créer la version ${ft.version + 1}`}
        </Button>
      </div>
    </section>
  );
}
