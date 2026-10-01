"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightLeft, CalendarPlus, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { AgentPicker, FtNonValidee, ftValidee, useAgentsDisponibles } from "@/components/production";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { PRIORITE_LABEL, STATUT_PLAN_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { PlanProduction, Priorite, StatutPlan } from "@/lib/types";
import { cn, formatDate, formatQty, num } from "@/lib/utils";

const PRIORITE_TONE: Record<Priorite, "neutral" | "info" | "warning" | "danger"> = { BASSE: "neutral", NORMALE: "info", HAUTE: "warning", URGENTE: "danger" };
const STATUT_TONE: Record<StatutPlan, "neutral" | "warning" | "success" | "danger"> = { PREVISION: "neutral", A_CONVERTIR_EN_OF: "warning", CONVERTIE: "success", ANNULEE: "danger" };
const PRIORITE_ORDRE: Record<Priorite, number> = { URGENTE: 0, HAUTE: 1, NORMALE: 2, BASSE: 3 };

type Filtre = "A_CONVERTIR" | "CONVERTIE" | "TOUS";

export default function PlanningPage() {
  const { state, articleName, can, userName } = useStore();
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState<PlanProduction | null>(null);
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("A_CONVERTIR");

  const ouvert = (p: PlanProduction) => p.statut === "PREVISION" || p.statut === "A_CONVERTIR_EN_OF";
  const rows = useMemo(
    () =>
      state.plans
        .filter((p) => (filtre === "TOUS" ? true : filtre === "CONVERTIE" ? p.statut === "CONVERTIE" : ouvert(p)))
        .filter((p) => matchSearch(q, articleName(p.article), p.commentaire))
        .sort(
          (a, b) =>
            Number(ouvert(b)) - Number(ouvert(a)) ||
            PRIORITE_ORDRE[a.priorite] - PRIORITE_ORDRE[b.priorite] ||
            new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime(),
        ),
    [state.plans, filtre, q, articleName],
  );

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Production"
        title="Plans de production"
        description="Prévoyez les volumes, puis convertissez chaque plan en OF avec ses agents : les besoins matières sont calculés à la conversion."
        actions={
          can("CREATE_PLAN") ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Nouveau plan
            </Button>
          ) : null
        }
      />

      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.plans.length} active={!!q || filtre !== "A_CONVERTIR"} onReset={() => { setQ(""); setFiltre("A_CONVERTIR"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Article, commentaire…" />
          <Segmented
            label="Statut"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "A_CONVERTIR", label: "À convertir", count: state.plans.filter(ouvert).length },
              { value: "CONVERTIE", label: "Convertis", count: state.plans.filter((p) => p.statut === "CONVERTIE").length },
              { value: "TOUS", label: "Tous" },
            ]}
          />
        </FilterBar>

        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">{state.plans.length ? "Aucun plan pour ces filtres." : "Aucun plan pour l’instant."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-2.5 font-medium">Article</th>
                  <th className="px-4 py-2.5 font-medium">Date prévue</th>
                  <th className="px-4 py-2.5 font-medium text-right">Quantité</th>
                  <th className="px-4 py-2.5 font-medium">Priorité</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium text-right" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const ft = ftValidee(state, p.article);
                  return (
                    <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium">{articleName(p.article)}</p>
                        <p className="text-[11.5px] text-muted truncate max-w-[280px]">{p.commentaire || `Créé par ${userName(p.cree_par)}`}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] num whitespace-nowrap">{formatDate(p.date_prevue)}</td>
                      <td className="px-4 py-3 text-[13px] num text-right">{formatQty(num(p.quantite_prevue), 0)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={PRIORITE_TONE[p.priorite]}>{PRIORITE_LABEL[p.priorite]}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={STATUT_TONE[p.statut]}>{STATUT_PLAN_LABEL[p.statut]}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {can("CONVERTIR_PLAN") && ouvert(p) ? (
                          <Button
                            variant={ft ? "primary" : "secondary"}
                            className="h-8 px-3 text-[12.5px]"
                            disabled={!ft}
                            title={ft ? undefined : "Fiche technique non validée"}
                            onClick={() => setConverting(p)}
                          >
                            <ArrowRightLeft size={13} /> Convertir en OF
                          </Button>
                        ) : (
                          <span className="text-muted text-[12px]">—</span>
                        )}
                        {can("CONVERTIR_PLAN") && ouvert(p) && !ft && (
                          <Link href="/parametrage/fiches-techniques" className="block text-[11px] text-warning font-medium mt-1 hover:underline">
                            Fiche technique non validée →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {creating && <NouveauPlanDrawer onClose={() => setCreating(false)} />}
      {converting && <ConvertirDrawer plan={converting} onClose={() => setConverting(null)} />}
    </div>
  );
}

function NouveauPlanDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, produitsFinis } = useStore();
  const [article, setArticle] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState("");
  const [priorite, setPriorite] = useState<Priorite>("NORMALE");
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_PLAN", article, date_prevue: date, quantite_prevue: Number(qty), priorite, commentaire: commentaire.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau plan"
      subtitle="Une prévision de volume, à convertir ensuite en OF."
      icon={<CalendarPlus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!article || !(Number(qty) > 0) || !date || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le plan"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Production prévue">
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
        {article > 0 && !ftValidee(state, article) && <FtNonValidee />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date prévue">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Quantité">
            <input type="number" min="0" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </Field>
        </div>
      </DrawerSection>
      <DrawerSection title="Priorité">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(PRIORITE_LABEL) as Priorite[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setPriorite(k)}
              aria-pressed={priorite === k}
              className={cn(
                "h-9 rounded-[7px] border text-[12.5px] font-medium transition-colors",
                priorite === k ? (k === "URGENTE" ? "bg-danger text-white border-danger" : "bg-primary text-white border-primary") : "border-line-strong bg-surface hover:bg-surface-2",
              )}
            >
              {PRIORITE_LABEL[k]}
            </button>
          ))}
        </div>
      </DrawerSection>
      <DrawerSection title="Commentaire">
        <textarea className={cn(inputClass, "h-20 py-2 resize-none")} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Facultatif" />
      </DrawerSection>
    </Drawer>
  );
}

function ConvertirDrawer({ plan, onClose }: { plan: PlanProduction; onClose: () => void }) {
  const { dispatch, articleName } = useStore();
  const agents = useAgentsDisponibles();
  const [choisis, setChoisis] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CONVERTIR_PLAN", id: plan.id, agents_affectes: choisis });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Convertir en OF"
      subtitle={`${articleName(plan.article)} · ${formatQty(num(plan.quantite_prevue), 0)} le ${formatDate(plan.date_prevue)}`}
      icon={<ArrowRightLeft size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? "Conversion…" : choisis.length ? `Créer l’OF · ${choisis.length} agent${choisis.length > 1 ? "s" : ""}` : "Créer l’OF"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Agents affectés" hint="Ils verront cet OF dans leur atelier. Modifiable ensuite depuis la fiche de l’OF.">
        <AgentPicker agents={agents} value={choisis} onChange={setChoisis} />
      </DrawerSection>
    </Drawer>
  );
}
