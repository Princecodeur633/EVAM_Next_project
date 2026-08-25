"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { PRIORITE_LABEL, STATUT_PLAN_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDate, formatQty, num } from "@/lib/utils";

export default function PlanningPage() {
  const { state, dispatch, articleName, produitsFinis, can, userName } = useStore();
  const [article, setArticle] = useState<number>(produitsFinis[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState(1000);
  const [priorite, setPriorite] = useState("NORMALE");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Production"
        title="Plans de production"
        description="Planifiez les volumes par article et par jour. Les ordres de fabrication se créent ensuite à partir de ces plans."
      />
      {can("CREATE_PLAN") && (
        <Panel className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              <option value={0}>—</option>
              {produitsFinis.map((a) => (
                <option key={a.id} value={a.id}>{a.code} · {a.designation}</option>
              ))}
            </select>
          </Field>
          <Field label="Date prévue">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Priorité">
            <select className={inputClass} value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              {Object.entries(PRIORITE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Button
            disabled={!article}
            onClick={() => void dispatch({ type: "CREATE_PLAN", article, date_prevue: date, quantite_prevue: qty, priorite })}
          >
            Créer le plan
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "a", label: "Article" },
            { key: "d", label: "Date" },
            { key: "q", label: "Qté" },
            { key: "p", label: "Priorité" },
            { key: "s", label: "Statut" },
            { key: "c", label: "Créé par" },
          ]}
          rows={state.plans.map((p) => ({
            a: articleName(p.article),
            d: formatDate(p.date_prevue),
            q: formatQty(num(p.quantite_prevue), 2),
            p: PRIORITE_LABEL[p.priorite],
            s: STATUT_PLAN_LABEL[p.statut],
            c: userName(p.cree_par),
          }))}
        />
      </Panel>
    </div>
  );
}
