"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, FilePlus2, Lock, Pencil, Plus, ScrollText, Search, Trash2, X } from "lucide-react";
import { Button, PageHeader, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { STATUT_FT_LABEL, UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ElementComposition, FicheTechnique } from "@/lib/types";
import { cn, formatDate, formatQty, num } from "@/lib/utils";

const BASE = "/parametrage/fiches-techniques";

function FtBadge({ ft }: { ft: FicheTechnique }) {
  const tone = ft.statut === "VALIDEE" ? "success" : ft.statut === "BROUILLON" ? "warning" : "neutral";
  return <StatusBadge tone={tone}>{STATUT_FT_LABEL[ft.statut]}</StatusBadge>;
}

/** Liste des fiches à gauche, éditeur de la fiche sélectionnée à droite. */
export function FicheTechniqueWorkspace({ selectedId }: { selectedId: number | null }) {
  const { state, articleName, produitsFinis, canEditParam, can, dispatch } = useStore();
  const router = useRouter();
  const writable = canEditParam(BASE);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newArticle, setNewArticle] = useState(0);

  const fiches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordre = { BROUILLON: 0, VALIDEE: 1, ARCHIVEE: 2 } as const;
    return [...state.fichesTechniques]
      .filter((f) => !q || articleName(f.article).toLowerCase().includes(q))
      .sort((a, b) => ordre[a.statut] - ordre[b.statut] || articleName(a.article).localeCompare(articleName(b.article), "fr") || b.version - a.version);
  }, [state.fichesTechniques, query, articleName]);

  const selected = state.fichesTechniques.find((f) => f.id === selectedId) ?? null;
  const brouillons = state.fichesTechniques.filter((f) => f.statut === "BROUILLON").length;
  // Un produit fini qui a déjà un brouillon ne se voit pas proposer une seconde fiche.
  const avecBrouillon = new Set(state.fichesTechniques.filter((f) => f.statut === "BROUILLON").map((f) => f.article));
  const creables = produitsFinis.filter((a) => !avecBrouillon.has(a.id));

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
    const ok = await dispatch({ type: "CREATE_FT", article: newArticle });
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
        description="La recette d’un produit fini : elle sert au calcul des besoins matières d’un OF dès qu’elle est validée."
        status={brouillons > 0 ? <StatusBadge tone="warning">{brouillons} en brouillon</StatusBadge> : undefined}
      />

      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        {/* Liste des fiches */}
        <aside className={cn("evam-card overflow-hidden lg:sticky lg:top-[72px]", selected && "hidden lg:block")}>
          <div className="p-3 border-b border-line space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className={cn(inputClass, "pl-8 h-8 text-[12.5px]")} placeholder="Rechercher un article…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {writable &&
              (creating ? (
                <div className="rounded-[8px] border border-line bg-surface-2 p-2.5 space-y-2">
                  <select className={cn(inputClass, "h-8 text-[12.5px]")} value={newArticle} onChange={(e) => setNewArticle(Number(e.target.value))} autoFocus>
                    <option value={0}>Choisir un produit fini…</option>
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
            {fiches.length === 0 && <li className="px-4 py-8 text-center text-[12.5px] text-muted">Aucune fiche.</li>}
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
                      <p className="text-[11.5px] text-muted">Version {f.version}</p>
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
            <FicheEditor key={selected.id} ft={selected} writable={writable} canValidate={can("VALIDER_FT")} />
          ) : (
            <div className="evam-card px-6 py-16 text-center">
              <ScrollText size={28} className="mx-auto text-muted/60" />
              <p className="text-[14px] font-medium mt-3">Sélectionnez une fiche</p>
              <p className="text-[12.5px] text-muted mt-1">Choisissez une fiche dans la liste pour voir ou modifier sa composition.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FicheEditor({ ft, writable, canValidate }: { ft: FicheTechnique; writable: boolean; canValidate: boolean }) {
  const { state, dispatch, articleName, userName } = useStore();
  const compo = state.compositions.filter((c) => c.fiche_technique === ft.id);
  const editable = writable && ft.statut === "BROUILLON";
  const [disponibles, setDisponibles] = useState<ElementComposition[]>([]);
  const [adding, setAdding] = useState(false);
  const [matiere, setMatiere] = useState(0);
  const [qty, setQty] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");
  const [validating, setValidating] = useState(false);

  // Liste de choix calculée par le backend (matières actives, pas encore dans la fiche, jamais de
  // produit fini) : on ne la reconstruit pas côté client pour éviter doublons et erreurs.
  useEffect(() => {
    if (!editable) return;
    let annule = false;
    void actions.elementsDisponibles(ft.id).then((elements) => {
      if (annule) return;
      setDisponibles(elements);
      setMatiere((m) => (elements.some((e) => e.id === m) ? m : 0));
    });
    return () => {
      annule = true;
    };
  }, [ft.id, editable, compo.length]);

  const uniteChoisie = disponibles.find((d) => d.id === matiere)?.unite_mesure;

  async function add() {
    const ok = await dispatch({ type: "CREATE_COMPOSITION", fiche_technique: ft.id, matiere, quantite_necessaire: Number(qty) });
    if (ok) {
      setMatiere(0);
      setQty("");
      setAdding(false);
    }
  }
  async function saveQty(id: number) {
    const ok = await dispatch({ type: "PATCH_COMPOSITION", id, quantite_necessaire: Number(editQty) });
    if (ok) setEditId(null);
  }
  async function validate() {
    setValidating(true);
    await dispatch({ type: "VALIDER_FT", id: ft.id });
    setValidating(false);
  }

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
      </header>

      <div className="px-4 sm:px-5 py-4 flex-1">
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

        {editable && adding && (
          <div className="mb-3 rounded-[9px] border border-primary/30 bg-primary-soft/40 p-3 grid sm:grid-cols-[minmax(0,1fr)_150px_auto] gap-2 items-end">
            <label className="block min-w-0">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Matière</span>
              <select className={inputClass} value={matiere} onChange={(e) => setMatiere(Number(e.target.value))} autoFocus>
                <option value={0}>Choisir…</option>
                {disponibles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.designation}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">
                Qté / unité{uniteChoisie ? ` (${UNITE_LABEL[uniteChoisie]})` : ""}
              </span>
              <input className={cn(inputClass, "text-right num")} type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <Button disabled={!matiere || !(Number(qty) > 0)} onClick={() => void add()}>
                <Check size={14} /> Ajouter
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)} aria-label="Annuler">
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        {compo.length === 0 ? (
          <div className="rounded-[9px] border border-dashed border-line-strong px-4 py-10 text-center">
            <p className="text-[13px] text-muted">Aucun composant pour le moment.</p>
            {editable && <p className="text-[12px] text-muted mt-1">Utilisez « Ajouter » pour renseigner les matières de la recette.</p>}
          </div>
        ) : (
          <div className="rounded-[9px] border border-line overflow-x-auto">
            <table className="w-full text-left min-w-[420px]">
              <thead>
                <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-3 py-2 font-medium">Matière</th>
                  <th className="px-3 py-2 font-medium text-right">Quantité / unité</th>
                  {editable && <th className="px-3 py-2 w-[88px]" />}
                </tr>
              </thead>
              <tbody>
                {compo.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="text-[13px] font-medium">{c.matiere_designation ?? articleName(c.matiere)}</p>
                      {c.matiere_code && <p className="text-[11.5px] text-muted">{c.matiere_code}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {editId === c.id ? (
                        <input
                          className="h-8 w-28 border border-primary rounded-[6px] px-2 text-[12.5px] text-right num bg-surface"
                          type="number"
                          min="0"
                          step="any"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveQty(c.id);
                            if (e.key === "Escape") setEditId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-[13px] num">
                          {formatQty(num(c.quantite_necessaire), 4)}
                          {c.unite_mesure && <span className="text-muted ml-1">{UNITE_LABEL[c.unite_mesure]}</span>}
                        </span>
                      )}
                    </td>
                    {editable && (
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          {editId === c.id ? (
                            <>
                              <IconBtn label="Enregistrer" onClick={() => void saveQty(c.id)} disabled={!(Number(editQty) > 0)}>
                                <Check size={14} />
                              </IconBtn>
                              <IconBtn label="Annuler" onClick={() => setEditId(null)}>
                                <X size={14} />
                              </IconBtn>
                            </>
                          ) : (
                            <>
                              <IconBtn
                                label="Modifier la quantité"
                                onClick={() => {
                                  setEditId(c.id);
                                  setEditQty(String(num(c.quantite_necessaire)));
                                }}
                              >
                                <Pencil size={13} />
                              </IconBtn>
                              <IconBtn label="Retirer" danger onClick={() => void dispatch({ type: "DELETE_COMPOSITION", id: c.id })}>
                                <Trash2 size={13} />
                              </IconBtn>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Barre de validation collée en bas de l’écran */}
      {ft.statut === "BROUILLON" && canValidate ? (
        <footer className="sticky bottom-0 z-10 px-4 sm:px-5 py-3 border-t border-line bg-surface/95 backdrop-blur-md rounded-b-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[12px] text-muted">
            {compo.length === 0 ? "Ajoutez au moins un composant avant de valider." : "Une fois validée, la fiche est figée et sert au calcul des OF."}
          </p>
          <Button variant="success" disabled={compo.length === 0 || validating} onClick={() => void validate()}>
            <Check size={15} /> {validating ? "Validation…" : "Valider la fiche"}
          </Button>
        </footer>
      ) : ft.statut !== "BROUILLON" ? (
        <footer className="px-4 sm:px-5 py-3 border-t border-line bg-surface-2/60 rounded-b-[10px] text-[12px] text-muted flex items-center gap-2">
          <Lock size={13} /> Fiche {STATUT_FT_LABEL[ft.statut].toLowerCase()} : la composition n’est plus modifiable.
        </footer>
      ) : null}
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
