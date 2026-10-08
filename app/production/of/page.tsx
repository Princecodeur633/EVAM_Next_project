"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardPlus, Plus, Route } from "lucide-react";
import { OfBadge } from "@/components/badges";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { AgentPicker, FtNonValidee, ftValidee, useAgentsDisponibles } from "@/components/production";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { STATUT_OF_LABEL, TYPES_FABRIQUES } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Circuit, LigneProduction, StatutOF } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

const STATUTS = Object.keys(STATUT_OF_LABEL) as StatutOF[];

export default function OfListPage() {
  const { role } = useStore();
  return role === "AGENT_PRODUCTION" ? <MesOf /> : <OfListe />;
}

/** « Mes OF » de l’agent de production : cartes, consultation seule. */
function MesOf() {
  const { state, articleName } = useStore();
  const [vue, setVue] = useState<"EN_COURS" | "TERMINES">("EN_COURS");
  const enCours = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const termines = state.ofList.filter((o) => o.statut === "CLOTURE" || o.statut === "ANNULE");
  const liste = (vue === "EN_COURS" ? enCours : termines).sort((a, b) => Number(b.statut === "EN_PRODUCTION") - Number(a.statut === "EN_PRODUCTION"));

  return (
    <div className="max-w-[640px] mx-auto space-y-4 anim-in">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-medium">Atelier</p>
        <h1 className="text-[22px] font-semibold tracking-tight">Mes OF</h1>
      </div>
      <Segmented
        label="Vue"
        value={vue}
        onChange={setVue}
        options={[
          { value: "EN_COURS", label: "En cours", count: enCours.length },
          { value: "TERMINES", label: "Terminés", count: termines.length },
        ]}
      />
      {liste.length === 0 ? (
        <Panel className="px-5 py-12 text-center">
          <p className="text-[14px] font-medium">{vue === "EN_COURS" ? "Aucun OF en cours ne vous est affecté." : "Aucun OF terminé."}</p>
        </Panel>
      ) : (
        <ul className="evam-card divide-y divide-line overflow-hidden">
          {liste.map((o) => (
            <li key={o.id}>
              <Link href={`/production/of/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 active:bg-primary-soft">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-semibold num">{o.numero}</p>
                    <OfBadge status={o.statut} />
                  </div>
                  <p className="text-[13px] text-muted mt-0.5 truncate">
                    {articleName(o.article)} · {formatQty(num(o.quantite_a_produire), 0)}
                    {o.ligne_code && ` · ${o.ligne_code}`}
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OfListe() {
  const { state, articleName, can, userName } = useStore();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<StatutOF | "OUVERTS" | "TOUS">("OUVERTS");

  const counts = (s: StatutOF) => state.ofList.filter((o) => o.statut === s).length;
  const ouverts = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const pipeline = STATUTS.filter((s) => s !== "ANNULE").map((s) => ({ label: STATUT_OF_LABEL[s], value: counts(s) }));
  const enProd = counts("EN_PRODUCTION");
  const attenteQualite = counts("EN_CONTROLE") + counts("PRODUCTION_TERMINEE");
  const volume = ouverts.reduce((a, o) => a + num(o.quantite_a_produire), 0);

  const rows = useMemo(
    () =>
      state.ofList
        .filter((o) => (statut === "TOUS" ? true : statut === "OUVERTS" ? o.statut !== "CLOTURE" && o.statut !== "ANNULE" : o.statut === statut))
        .filter((o) => matchSearch(q, o.numero, articleName(o.article), userName(o.responsable), o.ligne_code, o.usine_code))
        .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()),
    [state.ofList, statut, q, articleName, userName],
  );

  const chips: { value: StatutOF | "OUVERTS" | "TOUS"; label: string; count: number }[] = [
    { value: "OUVERTS", label: "Ouverts", count: ouverts.length },
    ...STATUTS.map((s) => ({ value: s, label: STATUT_OF_LABEL[s], count: counts(s) })).filter((c) => c.count > 0),
    { value: "TOUS", label: "Tous", count: state.ofList.length },
  ];

  return (
    <div className="space-y-4 anim-in max-w-[1440px]">
      <PageHeader
        eyebrow="Production"
        title="Ordres de fabrication"
        description="Chaque OF, du brouillon à la clôture. Les besoins matières sont calculés dès sa création."
        actions={
          can("CREATE_OF") ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Créer OF
            </Button>
          ) : null
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-stretch">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 lg:grid-cols-1 gap-3">
          <KpiCard label="OF en production" value={enProd} hint={`${ouverts.length} OF ouverts`} tone="teal" />
          <KpiCard label="Attente qualité" value={attenteQualite} tone={attenteQualite ? "warning" : "success"} />
          <KpiCard label="Volume à produire" value={formatQty(volume, 0)} hint="OF ouverts" />
        </div>
        <WidgetCard title="Pipeline" subtitle="OF par statut">
          <BarChart data={pipeline} height={180} />
        </WidgetCard>
      </div>

      <Panel className="overflow-hidden">
        <div className="px-3 sm:px-4 pt-3 flex flex-wrap gap-1.5" role="group" aria-label="Statut">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setStatut(c.value)}
              aria-pressed={statut === c.value}
              className={cn(
                "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium border transition-colors",
                statut === c.value ? "bg-primary text-white border-primary" : "bg-surface text-muted border-line hover:text-ink hover:border-line-strong",
              )}
            >
              {c.label}
              <span className={cn("num text-[11px]", statut === c.value ? "text-white/80" : "text-muted")}>{c.count}</span>
            </button>
          ))}
        </div>
        <FilterBar shown={rows.length} total={state.ofList.length} active={!!q || statut !== "OUVERTS"} onReset={() => { setQ(""); setStatut("OUVERTS"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Numéro, article, responsable…" />
        </FilterBar>
        <DataTable
          emptyText={state.ofList.length ? "Aucun OF pour ces filtres." : "Aucun OF pour l’instant."}
          columns={[
            { key: "n", label: "Numéro" },
            { key: "p", label: "Article" },
            { key: "q", label: "Quantité", className: "text-right" },
            { key: "li", label: "Ligne" },
            { key: "st", label: "Statut" },
            { key: "ag", label: "Agents" },
            { key: "at", label: "Créé" },
          ]}
          rows={rows.map((o) => ({
            n: <span className="num font-medium">{o.numero}</span>,
            p: articleName(o.article),
            q: <span className="num">{formatQty(num(o.quantite_a_produire), 0)}</span>,
            li: o.ligne_code ? <span title={o.usine_code ?? undefined}>{o.ligne_code}</span> : <span className="text-muted">—</span>,
            st: <OfBadge status={o.statut} />,
            ag: o.agents_affectes.length ? `${o.agents_affectes.length} agent${o.agents_affectes.length > 1 ? "s" : ""}` : <span className="text-warning">Aucun</span>,
            at: formatDateTime(o.date_creation),
            href: `/production/of/${o.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>

      {creating && <CreerOfDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreerOfDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, articleName } = useStore();
  const agents = useAgentsDisponibles();
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [plan, setPlan] = useState(0);
  const [ligne, setLigne] = useState(0);
  const [datePrevue, setDatePrevue] = useState("");
  const [debutPrevu, setDebutPrevu] = useState("");
  const [lignes, setLignes] = useState<LigneProduction[] | null>(null);
  const [circuit, setCircuit] = useState<Circuit | null | undefined>(undefined);
  const [choisis, setChoisis] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const plans = state.plans.filter((p) => p.statut === "PREVISION" || p.statut === "A_CONVERTIR_EN_OF");
  // Tout ce qu’un OF peut fabriquer : produit fini, intermédiaire, fluide de process.
  const fabricables = state.articles.filter((a) => a.actif && TYPES_FABRIQUES.includes(a.type_article));
  const ft = article > 0 && ftValidee(state, article);

  // Lignes actives compatibles avec le format (activité + formats acceptés), calculées par le backend.
  useEffect(() => {
    if (!article) return;
    let annule = false;
    void actions
      .lignesCompatibles(article)
      .then((l) => {
        if (annule) return;
        setLignes(l);
        setLigne((x) => (l.some((y) => y.id === x) ? x : l.length === 1 ? l[0].id : 0));
      })
      .catch(() => !annule && setLignes([]));
    return () => {
      annule = true;
    };
  }, [article]);

  // Circuit validé que recevra l’OF (le plus précis l’emporte : format + ligne > format > activité).
  useEffect(() => {
    if (!article) return;
    let annule = false;
    void actions
      .circuitApplicable(article, ligne || null)
      .then((c) => !annule && setCircuit(c))
      .catch(() => !annule && setCircuit(null));
    return () => {
      annule = true;
    };
  }, [article, ligne]);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "CREATE_OF",
      article,
      quantite_a_produire: Number(qty),
      plan_production: plan || undefined,
      agents_affectes: choisis,
      ligne: ligne || null,
      date_prevue: datePrevue || null,
      date_debut_prevue: debutPrevu ? new Date(debutPrevu).toISOString() : null,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Créer un OF"
      subtitle="Pour une production hors plan ; sinon convertissez le plan depuis l’écran Plans."
      icon={<ClipboardPlus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!ft || !(Number(qty) > 0) || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer l’OF"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Production">
        <Field label="Article">
          <select
            className={inputClass}
            value={article}
            onChange={(e) => {
              setArticle(Number(e.target.value));
              setLignes(null);
              setCircuit(undefined);
            }}
            autoFocus
          >
            <option value={0}>Choisir un article à fabriquer…</option>
            {fabricables.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
        </Field>
        {article > 0 && !ft && <FtNonValidee />}
        <Field label="Quantité à produire">
          <input type="number" min="0" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Date prévue">
          <input type="date" className={inputClass} value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} />
        </Field>
        <Field label="Plan d’origine (facultatif)">
          <select className={inputClass} value={plan} onChange={(e) => setPlan(Number(e.target.value))}>
            <option value={0}>—</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {articleName(p.article)} · {formatDate(p.date_prevue)}
              </option>
            ))}
          </select>
        </Field>
      </DrawerSection>
      {article > 0 && (
        <DrawerSection title="Ligne et circuit" hint="La ligne détermine l’usine : magasin matières des sorties et stock produits finis des lots.">
          <Field label="Ligne de production">
            <select className={inputClass} value={ligne} onChange={(e) => setLigne(Number(e.target.value))} disabled={lignes === null}>
              <option value={0}>{lignes === null ? "Chargement…" : lignes.length ? "Choisie au lancement (retenue d’office si une seule convient)" : "Aucune ligne compatible"}</option>
              {(lignes ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} · {l.designation}
                  {l.usine_code ? ` (${l.usine_code})` : ""}
                </option>
              ))}
            </select>
          </Field>
          {ligne > 0 && (
            <Field label="Début planifié sur la ligne (facultatif)">
              <input type="datetime-local" className={inputClass} value={debutPrevu} onChange={(e) => setDebutPrevu(e.target.value)} />
            </Field>
          )}
          <div className="rounded-[8px] border border-line bg-surface-2/60 px-3 py-2.5 flex items-start gap-2 text-[12.5px]">
            <Route size={14} className="text-primary shrink-0 mt-0.5" />
            {circuit === undefined ? (
              <p className="text-muted">Recherche du circuit…</p>
            ) : circuit ? (
              <p>
                Circuit <span className="font-semibold">{circuit.code}</span> v{circuit.version} · {circuit.etapes.length} étape(s) :{" "}
                <span className="text-muted">{[...circuit.etapes].sort((a, b) => a.ordre - b.ordre).map((e) => e.etape_libelle ?? e.etape_code).join(" → ")}</span>
              </p>
            ) : (
              <p className="text-muted">Aucun circuit validé pour cette activité : les étapes seront libres.</p>
            )}
          </div>
        </DrawerSection>
      )}
      <DrawerSection title="Agents affectés">
        <AgentPicker agents={agents} value={choisis} onChange={setChoisis} />
      </DrawerSection>
    </Drawer>
  );
}
