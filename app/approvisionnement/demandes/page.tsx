"use client";

import { useState } from "react";
import { DaBadge } from "@/components/badges";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function DemandesAchatPage() {
  const { state, dispatch, articleName, matieres, can } = useStore();
  const [article, setArticle] = useState(matieres[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  const [motif, setMotif] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Achats" title="Demandes d'achat" description="Créez une demande, puis faites-la approuver par le responsable achats." />
      {can("CREATE_DA") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {state.articles.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.designation}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Motif">
            <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Field>
          <Button disabled={!article} onClick={() => void dispatch({ type: "CREATE_DA", article, quantite_demandee: qty, motif })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "id", label: "#" }, { key: "a", label: "Article" }, { key: "q", label: "Qté" }, { key: "s", label: "Statut" }, { key: "act", label: "" }]}
          rows={state.demandesAchat.map((d) => ({
            id: d.id,
            a: articleName(d.article),
            q: formatQty(num(d.quantite_demandee), 2),
            s: <DaBadge status={d.statut} />,
            act: d.statut === "EN_ATTENTE" && can("APPROUVER_DA") ? (
              <span className="flex gap-1">
                {can("APPROUVER_DA") && (
                  <button className="text-success text-[12px]" onClick={() => void dispatch({ type: "APPROUVER_DA", id: d.id })}>Approuver</button>
                )}
                {can("REJETER_DA") && (
                  <button className="text-danger text-[12px]" onClick={() => void dispatch({ type: "REJETER_DA", id: d.id })}>Rejeter</button>
                )}
              </span>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
