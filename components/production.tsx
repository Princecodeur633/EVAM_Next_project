"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, PackagePlus, Shuffle } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, Field, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { actions, api, endpoints } from "@/lib/api";
import { ETAPE_LABEL } from "@/lib/labels";
import type { AppState, OrdreFabrication } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Vrai si l’article a une fiche technique validée (indispensable pour lancer un OF). */
export function ftValidee(state: AppState, article: number) {
  const a = state.articles.find((x) => x.id === article);
  return a?.fiche_technique_validee != null || state.fichesTechniques.some((f) => f.article === article && f.statut === "VALIDEE");
}

/** Vrai si l’OF fabrique un article de l’activité Eau (suivi captage → embouteillage). */
export function estOfEau(state: AppState, of: OrdreFabrication) {
  if (of.activite_code) return of.activite_code === "EAU";
  const article = state.articles.find((a) => a.id === of.article);
  const activite = state.activites.find((x) => x.id === article?.activite);
  if (activite) return activite.code === "EAU";
  const famille = state.famillesArticle.find((f) => f.id === article?.famille);
  return famille?.nom.toLowerCase().includes("eau") ?? false;
}

export type EtapeChoix = { code: string; libelle: string; obligatoire: boolean; saisies?: number };

/**
 * Étapes saisissables pour un OF : celles de son circuit (dans l’ordre, avec l’avancement) ;
 * sans circuit, les étapes principales actives du paramétrage industriel, hors stockage
 * produit fini et distribution (hors coût de production).
 */
export function etapesPourOf(state: AppState, of: OrdreFabrication | undefined): EtapeChoix[] {
  if (of?.etapes_prevues?.length) {
    return of.etapes_prevues.map((e) => ({ code: e.code, libelle: e.libelle, obligatoire: e.obligatoire, saisies: e.saisies }));
  }
  const standard = state.etapesStandard
    .filter((e) => e.actif && e.phase !== "APRES_PRODUCTION" && e.sous_etape_de == null)
    .sort((a, b) => a.ordre_reference - b.ordre_reference);
  if (standard.length) return standard.map((e) => ({ code: e.code, libelle: e.libelle, obligatoire: false }));
  // Paramétrage pas encore chargé : libellés de repli.
  return ["CAPTAGE", "TRAITEMENT", "PREPARATION", "SOUFFLAGE", "REMPLISSAGE", "BOUCHAGE", "ETIQUETAGE", "CONDITIONNEMENT"].map((code) => ({
    code,
    libelle: ETAPE_LABEL[code],
    obligatoire: false,
  }));
}

/**
 * Changement de série (format ou produit) avant le démarrage d’un OF : temps d’arrêt, nettoyage,
 * réglage, essais et rebuts de démarrage. Déclenche les contrôles « après changement de série ».
 */
export function ChangementSerieDrawer({ of, onClose }: { of: OrdreFabrication; onClose: () => void }) {
  const { state, dispatch, articleName, role } = useStore();
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [debut, setDebut] = useState(local);
  const [fin, setFin] = useState("");
  const [precedent, setPrecedent] = useState(0);
  const [v, setV] = useState({ arret: "", nettoyage: "", reglage: "", essais: "", rebuts: "", cout: "" });
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const voitCouts = role !== "AGENT_PRODUCTION";
  const n = (k: keyof typeof v) => Number(v[k]) || 0;

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.post(endpoints.changementsSerie, {
          ordre_fabrication: of.id,
          article_precedent: precedent || null,
          date_debut: new Date(debut).toISOString(),
          date_fin: fin ? new Date(fin).toISOString() : null,
          duree_arret_min: n("arret"),
          duree_nettoyage_min: n("nettoyage"),
          duree_reglage_min: n("reglage"),
          quantite_essais: n("essais"),
          rebuts_demarrage: n("rebuts"),
          ...(voitCouts && v.cout ? { cout_nettoyage: n("cout") } : {}),
          observations: obs.trim(),
        }),
      refresh: ["changementsSerie", "controlesRealises", "ofList"],
    });
    setSaving(false);
    if (ok) onClose();
  }

  const champ = (k: keyof typeof v, label: string) => (
    <Field label={label}>
      <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} />
    </Field>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      title="Changement de série"
      subtitle={`${of.numero} · ${articleName(of.article)}${of.ligne_code ? ` · ligne ${of.ligne_code}` : ""}`}
      icon={<Shuffle size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!debut || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Série" hint="Les contrôles qualité « après changement de série » sont générés automatiquement.">
        <Field label="Produit / format précédent">
          <select className={inputClass} value={precedent} onChange={(e) => setPrecedent(Number(e.target.value))}>
            <option value={0}>Non renseigné</option>
            {state.articles
              .filter((a) => a.type_article === "PRODUIT_FINI" && a.id !== of.article)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.designation}
                </option>
              ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début">
            <input type="datetime-local" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} />
          </Field>
          <Field label="Fin">
            <input type="datetime-local" className={inputClass} value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
        </div>
      </DrawerSection>
      <DrawerSection title="Temps (minutes)">
        <div className="grid grid-cols-3 gap-3">
          {champ("arret", "Arrêt")}
          {champ("nettoyage", "Nettoyage")}
          {champ("reglage", "Réglage")}
        </div>
      </DrawerSection>
      <DrawerSection title="Quantités">
        <div className="grid grid-cols-2 gap-3">
          {champ("essais", "Consommée en essais")}
          {champ("rebuts", "Rebuts de démarrage")}
        </div>
        {voitCouts && champ("cout", "Coût réel du nettoyage (FCFA, si connu)")}
        <Field label="Observations">
          <input className={inputClass} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Facultatif" />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}

/** Bandeau « Fiche technique non validée » avec lien vers la fiche. */
export function FtNonValidee({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[8px] border border-warning/30 bg-warning-soft px-3 py-2.5 flex items-start gap-2 text-[12.5px]", className)}>
      <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
      <p className="min-w-0">
        <span className="font-semibold text-warning">Fiche technique non validée.</span>{" "}
        <span className="text-ink/80">L’OF ne peut pas être lancé tant que l’Admin SI ne l’a pas validée.</span>{" "}
        <Link href="/parametrage/fiches-techniques" className="text-primary font-medium hover:underline whitespace-nowrap">
          Voir les fiches
        </Link>
      </p>
    </div>
  );
}

/** Agents Production actifs, chargés une fois depuis le backend. */
export function useAgentsDisponibles() {
  const [agents, setAgents] = useState<{ id: number; nom: string }[] | null>(null);
  useEffect(() => {
    let annule = false;
    void actions.agentsDisponibles().then((a) => {
      if (!annule) setAgents(a);
    });
    return () => {
      annule = true;
    };
  }, []);
  return agents;
}

/** Sélecteur d’agents à cases à cocher. */
export function AgentPicker({
  agents,
  value,
  onChange,
  disabled,
}: {
  agents: { id: number; nom: string }[] | null;
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}) {
  if (agents === null) return <p className="text-[12.5px] text-muted">Chargement des agents…</p>;
  if (agents.length === 0) return <p className="text-[12.5px] text-muted">Aucun agent Production actif.</p>;
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <ul className="rounded-[9px] border border-line divide-y divide-line max-h-[280px] overflow-y-auto">
      {agents.map((a) => {
        const on = value.includes(a.id);
        return (
          <li key={a.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggle(a.id)}
              aria-pressed={on}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left text-[13px] transition-colors disabled:opacity-50", on ? "bg-primary-soft/60" : "hover:bg-surface-2")}
            >
              <span className={cn("h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0", on ? "bg-primary border-primary text-white" : "border-line-strong bg-surface")}>
                {on && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="truncate">{a.nom}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Demande complémentaire pour un OF (matière, quantité, motif) ; `of` absent = choix de l’OF. */
export function ComplementDrawer({ of, onClose }: { of?: OrdreFabrication; onClose: () => void }) {
  const { state, dispatch, articleName, matieres } = useStore();
  const ofsOuverts = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const [ofId, setOfId] = useState(of?.id ?? 0);
  const duBesoin = state.besoinsMatieres.filter((b) => b.ordre_fabrication === ofId).map((b) => b.matiere);
  const options = [...duBesoin.map((id) => ({ id, label: articleName(id) })), ...matieres.filter((m) => !duBesoin.includes(m.id)).map((m) => ({ id: m.id, label: `${m.code} · ${m.designation}` }))];
  const [matiere, setMatiere] = useState(duBesoin[0] ?? 0);
  const [qty, setQty] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_COMPLEMENT", ordre_fabrication: ofId, matiere, quantite: Number(qty), motif: motif.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Demande complémentaire"
      subtitle={of ? `${of.numero} · validée par le magasinier` : "Validée par le magasinier"}
      icon={<PackagePlus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!ofId || !matiere || !(Number(qty) > 0) || !motif.trim() || saving} onClick={() => void submit()}>
            {saving ? "Envoi…" : "Demander"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Matière">
        {!of && (
          <Field label="OF">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))} autoFocus>
              <option value={0}>Choisir un OF…</option>
              {ofsOuverts.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.numero} · {articleName(o.article)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Matière">
          <select className={inputClass} value={matiere} onChange={(e) => setMatiere(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantité">
          <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Motif (obligatoire)">
          <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Casse, rendement plus faible…" />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
