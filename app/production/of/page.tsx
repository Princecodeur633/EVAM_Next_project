"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OfBadge } from "@/components/badges";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_OF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty, num } from "@/lib/utils";
import type { StatutOF } from "@/lib/types";

export default function OfListPage() {
  const { state, articleName, dispatch, produitsFinis, can, userName } = useStore();
  const router = useRouter();
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [qty, setQty] = useState(100);
  const [plan, setPlan] = useState(0);
  const [agentIds, setAgentIds] = useState("");
  const agents = state.utilisateurs.filter((u) => u.profil === "AGENT_PRODUCTION" && u.actif);

  const counts = (s: StatutOF) => state.ofList.filter((o) => o.statut === s).length;
  const pipeline = (Object.keys(STATUT_OF_LABEL) as StatutOF[]).map((s) => ({
    label: STATUT_OF_LABEL[s],
    value: counts(s),
  }));
  const open = state.ofList.filter((o) => o.statut !== "CLOTURE").length;
  const waitQ = counts("CONTROLE_QUALITE") + counts("TERMINE");
  const plannedQty = state.ofList.reduce((a, o) => a + num(o.quantite_a_produire), 0);

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Production"
        title="Ordres de fabrication"
        description="Suivez chaque OF, de la planification à la clôture. Le lancement calcule les besoins matières."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="OF non clôturés" value={open} tone="warning" />
        <KpiCard label="Attente qualité" value={waitQ} tone={waitQ ? "warning" : "success"} />
        <KpiCard label="Volume à produire" value={formatQty(plannedQty)} tone="teal" />
      </div>
      <WidgetCard title="Pipeline OF" subtitle="Répartition par statut">
        <BarChart data={pipeline} height={160} />
      </WidgetCard>
      {can("CREATE_OF") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Plan (optionnel)">
            <select className={inputClass} value={plan} onChange={(e) => setPlan(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {articleName(p.article)} · {p.date_prevue}
                </option>
              ))}
            </select>
          </Field>
          {agents.length > 0 ? (
            <Field label="Agents affectés">
              <select
                multiple
                className={inputClass + " h-20"}
                value={agentIds.split(",").filter(Boolean)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setAgentIds(selected.join(","));
                }}
              >
                {agents.map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.first_name} {u.last_name} ({u.username})</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Agents affectés (IDs, optionnel)">
              <input className={inputClass} placeholder="12,15" value={agentIds} onChange={(e) => setAgentIds(e.target.value)} />
            </Field>
          )}
          <Button
            disabled={!article}
            onClick={() =>
              void dispatch({
                type: "CREATE_OF",
                article,
                quantite_a_produire: qty,
                plan_production: plan || undefined,
                agents_affectes: agentIds
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => Number.isFinite(n) && n > 0),
              })
            }
          >
            Créer OF
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "Numéro" },
            { key: "p", label: "Article" },
            { key: "q", label: "Quantité" },
            { key: "st", label: "Statut" },
            { key: "r", label: "Responsable" },
            { key: "at", label: "Créé" },
          ]}
          rows={state.ofList.map((o) => ({
            n: <span className="num font-medium">{o.numero}</span>,
            p: articleName(o.article),
            q: <span className="num">{formatQty(num(o.quantite_a_produire), 2)}</span>,
            st: <OfBadge status={o.statut} />,
            r: userName(o.responsable),
            at: formatDateTime(o.date_creation),
            href: `/production/of/${o.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
