"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ClipboardPlus, Plus } from "lucide-react";
import { OfBadge } from "@/components/badges";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { AgentPicker, FtNonValidee, ftValidee, useAgentsDisponibles } from "@/components/production";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_OF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { StatutOF } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

const STATUTS = Object.keys(STATUT_OF_LABEL) as StatutOF[];

export default function OfListPage() {
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
        .filter((o) => matchSearch(q, o.numero, articleName(o.article), userName(o.responsable)))
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
            { key: "st", label: "Statut" },
            { key: "ag", label: "Agents" },
            { key: "at", label: "Créé" },
          ]}
          rows={rows.map((o) => ({
            n: <span className="num font-medium">{o.numero}</span>,
            p: articleName(o.article),
            q: <span className="num">{formatQty(num(o.quantite_a_produire), 0)}</span>,
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
  const { state, dispatch, produitsFinis, articleName } = useStore();
  const agents = useAgentsDisponibles();
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [plan, setPlan] = useState(0);
  const [choisis, setChoisis] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const plans = state.plans.filter((p) => p.statut === "PREVISION" || p.statut === "A_CONVERTIR_EN_OF");
  const ft = article > 0 && ftValidee(state, article);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_OF", article, quantite_a_produire: Number(qty), plan_production: plan || undefined, agents_affectes: choisis });
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
          <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir un produit fini…</option>
            {produitsFinis.map((a) => (
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
      <DrawerSection title="Agents affectés">
        <AgentPicker agents={agents} value={choisis} onChange={setChoisis} />
      </DrawerSection>
    </Drawer>
  );
}
