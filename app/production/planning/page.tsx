"use client";

import { useEffect, useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { PRIORITE_LABEL, STATUT_PLAN_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/api";
import { formatDate, formatQty, num } from "@/lib/utils";

export default function PlanningPage() {
  const { state, dispatch, articleName, produitsFinis, can, userName } = useStore();
  const [article, setArticle] = useState<number>(produitsFinis[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState(1000);
  const [priorite, setPriorite] = useState("NORMALE");
  const [commentaire, setCommentaire] = useState("");

  // Agents Production actifs, pour affecter l'OF dès sa création (sinon
  // aucun écran ne permet plus de le faire une fois l'OF créé sans passer
  // par « Affecter les agents » sur sa fiche).
  const [agentsDispo, setAgentsDispo] = useState<{ id: number; nom: string }[]>([]);
  useEffect(() => {
    void actions.agentsDisponibles().then(setAgentsDispo);
  }, []);
  const [agentsChoisis, setAgentsChoisis] = useState<Record<number, number[]>>({});

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Production"
        title="Plans de production"
        description="Prévisions de volumes. Convertissez une prévision en OF pour déclencher le calcul des besoins matières."
      />
      {can("CREATE_PLAN") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
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
          <Field label="Commentaire">
            <input className={inputClass} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
          </Field>
          <Button
            disabled={!article}
            onClick={() => void dispatch({ type: "CREATE_PLAN", article, date_prevue: date, quantite_prevue: qty, priorite, commentaire })}
          >
            Créer la prévision
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
            { key: "com", label: "Commentaire" },
            { key: "x", label: "" },
          ]}
          rows={state.plans.map((p) => ({
            a: articleName(p.article),
            d: formatDate(p.date_prevue),
            q: formatQty(num(p.quantite_prevue), 2),
            p: PRIORITE_LABEL[p.priorite],
            s: STATUT_PLAN_LABEL[p.statut] ?? p.statut,
            c: userName(p.cree_par),
            com: p.commentaire || "—",
            x:
              can("CONVERTIR_PLAN") && p.statut !== "CONVERTIE" && p.statut !== "ANNULEE" ? (
                <span className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  {agentsDispo.length > 0 && (
                    <select
                      multiple
                      className="h-16 sm:w-40 border border-line rounded px-1 text-[12px]"
                      value={(agentsChoisis[p.id] ?? []).map(String)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                        setAgentsChoisis((m) => ({ ...m, [p.id]: selected }));
                      }}
                    >
                      {agentsDispo.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                    </select>
                  )}
                  <Button
                    className="h-8 px-2.5 text-[12px]"
                    onClick={() => void dispatch({ type: "CONVERTIR_PLAN", id: p.id, agents_affectes: agentsChoisis[p.id] })}
                  >
                    Convertir en OF
                  </Button>
                </span>
              ) : (
                "—"
              ),
          }))}
        />
      </Panel>
    </div>
  );
}
