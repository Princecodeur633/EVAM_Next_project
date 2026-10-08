"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Layers, Lock, Plus, Trash2 } from "lucide-react";
import { Button, DataTable, Guard, Panel, inputClass } from "@/components/ui";
import { actions, api, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { LigneProduction, OrdreFabrication } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

/** « 2026-10-08T08:00:00Z » -> valeur d'un champ datetime-local (heure locale). */
function versChampLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const versIso = (local: string) => (local ? new Date(local).toISOString() : null);

/**
 * Ligne et créneau planifié de l'OF. La ligne se choisit au plus tard au lancement : si une seule ligne
 * active est compatible avec tous les formats, le backend la retient d'office (« ligne proposée ») ;
 * sinon le lancement est refusé tant qu'elle n'est pas choisie. Deux OF ne se chevauchent pas sur une ligne ;
 * la fin se calcule depuis la cadence de la ligne si elle n'est pas saisie.
 */
export function PlanificationOf({ of }: { of: OrdreFabrication }) {
  const { dispatch, can } = useStore();
  const brouillon = of.statut === "BROUILLON";
  const modifiable = of.statut !== "CLOTURE" && of.statut !== "ANNULE";
  const editable = can("CREATE_OF") && modifiable;
  const [lignes, setLignes] = useState<LigneProduction[] | null>(null);
  const [proposee, setProposee] = useState<string | null | undefined>(undefined);
  const [ligne, setLigne] = useState(of.ligne ?? 0);
  const [debut, setDebut] = useState(versChampLocal(of.date_debut_prevue));
  const [fin, setFin] = useState(versChampLocal(of.date_fin_prevue));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLigne(of.ligne ?? 0);
    setDebut(versChampLocal(of.date_debut_prevue));
    setFin(versChampLocal(of.date_fin_prevue));
  }, [of.ligne, of.date_debut_prevue, of.date_fin_prevue]);

  useEffect(() => {
    if (!editable || !brouillon) return;
    let annule = false;
    void actions
      .lignesCompatibles(of.article)
      .then((l) => !annule && setLignes(l))
      .catch(() => !annule && setLignes([]));
    return () => {
      annule = true;
    };
  }, [of.article, editable, brouillon]);

  // La ligne proposée n'est calculée que sur la fiche détaillée d'un OF brouillon sans ligne.
  useEffect(() => {
    if (!brouillon || of.ligne) return;
    let annule = false;
    void api
      .get<OrdreFabrication>(`${endpoints.ofList}${of.id}/`)
      .then((d) => !annule && setProposee(d.ligne_proposee ?? null))
      .catch(() => !annule && setProposee(null));
    return () => {
      annule = true;
    };
  }, [of.id, of.ligne, brouillon, of.formats_supplementaires?.length]);

  const dirty =
    ligne !== (of.ligne ?? 0) || debut !== versChampLocal(of.date_debut_prevue) || fin !== versChampLocal(of.date_fin_prevue);
  const finAvantDebut = !!debut && !!fin && fin <= debut;

  async function enregistrer() {
    setBusy(true);
    await dispatch({
      type: "EXEC",
      run: () =>
        api.patch(`${endpoints.ofList}${of.id}/`, {
          ...(brouillon ? { ligne: ligne || null } : {}),
          date_debut_prevue: versIso(debut),
          // Fin vide : recalculée par le backend depuis la cadence de la ligne.
          date_fin_prevue: versIso(fin),
        }),
      refresh: ["ofList"],
    });
    setBusy(false);
  }

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <CalendarClock size={15} className="text-muted" /> Ligne et planning
        </h2>
        {editable && dirty && (
          <Button className="h-8 px-3 text-[12.5px]" disabled={busy || finAvantDebut} onClick={() => void enregistrer()}>
            {busy ? "…" : "Enregistrer"}
          </Button>
        )}
      </div>
      <div className="p-4 space-y-3 text-[13px]">
        {brouillon && !of.ligne && proposee !== undefined && (
          proposee ? (
            <Guard variant="ok" title={`Ligne ${proposee} retenue au lancement`}>
              Seule ligne active compatible avec les formats de l’OF.
            </Guard>
          ) : (
            <Guard variant="warn" title="Ligne à choisir avant le lancement">
              Plusieurs lignes (ou aucune) conviennent : le lancement sera refusé tant que la ligne n’est pas choisie.
            </Guard>
          )
        )}
        {editable && brouillon ? (
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Ligne de production</span>
            <select className={inputClass} value={ligne} onChange={(e) => setLigne(Number(e.target.value))} disabled={lignes === null}>
              <option value={0}>{lignes === null ? "Chargement…" : "Choisie au lancement"}</option>
              {(lignes ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} · {l.designation}
                  {l.usine_code ? ` (${l.usine_code})` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="flex justify-between gap-3">
            <span className="text-muted">Ligne</span>
            <span className="font-medium">{of.ligne_code ?? "—"}</span>
          </p>
        )}
        {editable ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Début planifié</span>
              <input type="datetime-local" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Fin planifiée</span>
              <input type="datetime-local" className={cn(inputClass, finAvantDebut && "border-danger")} value={fin} onChange={(e) => setFin(e.target.value)} />
              <span className="block text-[11.5px] text-muted mt-1">Vide : calculée depuis la cadence de la ligne.</span>
            </label>
          </div>
        ) : (
          <>
            <p className="flex justify-between gap-3">
              <span className="text-muted">Début planifié</span>
              <span className="font-medium">{of.date_debut_prevue ? formatDateTime(of.date_debut_prevue) : "Non planifié"}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">Fin planifiée</span>
              <span className="font-medium">{of.date_fin_prevue ? formatDateTime(of.date_fin_prevue) : "—"}</span>
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}

/** OF multi-format (Eau 1 L + Eau 1,5 L) : formats ajoutés au format principal tant que l'OF est en brouillon. */
export function FormatsOf({ of }: { of: OrdreFabrication }) {
  const { state, dispatch, articleName, can } = useStore();
  const editable = of.statut === "BROUILLON" && can("CREATE_OF");
  const formats = of.formats_supplementaires ?? [];
  const principal = state.articles.find((a) => a.id === of.article);
  // Même activité, produit fini, pas déjà dans l'OF (le backend vérifie aussi la recette et la ligne).
  const candidats = state.articles.filter(
    (a) =>
      a.actif &&
      a.type_article === "PRODUIT_FINI" &&
      a.id !== of.article &&
      (!principal?.activite || a.activite === principal.activite) &&
      !formats.some((f) => f.article === a.id),
  );
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: ["ofList", "besoinsMatieres"] });
    setBusy(false);
    return ok;
  }

  if (!editable && formats.length === 0) return null;
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <Layers size={15} className="text-muted" /> Formats de l’OF ({formats.length + 1})
        </h2>
        {!editable && formats.length > 0 && (
          <span className="text-[11.5px] text-muted inline-flex items-center gap-1">
            <Lock size={12} /> Figés après le brouillon
          </span>
        )}
      </div>
      <ul className="divide-y divide-line text-[13px]">
        <li className="px-4 py-2 flex items-center gap-3">
          <span className="flex-1 min-w-0">
            {articleName(of.article)} <span className="text-muted text-[11.5px]">· principal</span>
          </span>
          <span className="num">{formatQty(num(of.quantite_a_produire), 0)}</span>
          {editable && <span className="w-8" />}
        </li>
        {formats.map((f) => (
          <li key={f.id} className="px-4 py-2 flex items-center gap-3">
            <span className="flex-1 min-w-0">{f.article_code ? articleName(f.article) : `Article n°${f.article}`}</span>
            <span className="num">{formatQty(num(f.quantite_a_produire), 0)}</span>
            {editable && (
              <Button variant="ghost" className="h-7 w-8 px-0" aria-label="Retirer ce format" disabled={busy} onClick={() => void run(() => actions.retirerFormatOf(f.id))}>
                <Trash2 size={14} />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <div className="px-4 py-3 border-t border-line bg-surface-2/40 grid sm:grid-cols-[minmax(0,1fr)_110px_auto] gap-2 items-end">
          <select aria-label="Format à ajouter" className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
            <option value={0}>Ajouter un format…</option>
            {candidats.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
          <input type="number" min="0" step="any" aria-label="Quantité à produire" placeholder="Quantité" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
          <Button
            disabled={!article || !(Number(qty) > 0) || busy}
            onClick={async () => {
              if (await run(() => actions.ajouterFormatOf({ ordre_fabrication: of.id, article, quantite_a_produire: Number(qty) }))) {
                setArticle(0);
                setQty("");
              }
            }}
          >
            <Plus size={14} /> Ajouter
          </Button>
        </div>
      )}
    </Panel>
  );
}

/** Matières réservées par l'OF au lancement (consommées par les sorties, libérées à la clôture). */
export function ReservationsOf({ of }: { of: OrdreFabrication }) {
  const { state, articleName } = useStore();
  const reservations = state.reservations.filter((r) => r.ordre_fabrication === of.id);
  if (reservations.length === 0) return null;
  return (
    <Panel className="overflow-hidden">
      <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Matières réservées ({reservations.length})</h2>
      <DataTable
        columns={[
          { key: "m", label: "Matière" },
          { key: "d", label: "Magasin" },
          { key: "r", label: "Réservé", className: "text-right" },
          { key: "s", label: "Reste réservé", className: "text-right" },
        ]}
        rows={reservations.map((r) => ({
          m: articleName(r.matiere),
          d: r.depot_nom ?? "—",
          r: <span className="num">{formatQty(num(r.quantite_reservee), 3)}</span>,
          s: <span className="num">{formatQty(num(r.quantite_restante), 3)}</span>,
        }))}
      />
    </Panel>
  );
}
