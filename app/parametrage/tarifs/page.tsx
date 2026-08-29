"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function TarifsPage() {
  const { state, dispatch, articleName, clientName, canEditParam, produitsFinis } = useStore();
  const writable = canEditParam("/parametrage/tarifs");
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [client, setClient] = useState<number>(0);
  const [prix, setPrix] = useState(0);
  const [debut, setDebut] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Tarifs" description="Prix public ou prix spécifique à un client." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Client">
            <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))}>
              <option value={0}>Public</option>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Prix"><input type="number" className={inputClass} value={prix} onChange={(e) => setPrix(Number(e.target.value))} /></Field>
          <Field label="Début"><input type="date" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} /></Field>
          <Button disabled={!article} onClick={() => void dispatch({ type: "CREATE_TARIF", article, client: client || null, prix_unitaire: prix, date_debut_validite: debut })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "c", label: "Client" }, { key: "p", label: "Prix" }]}
          rows={state.tarifs.map((t) => ({ a: articleName(t.article), c: t.client ? clientName(t.client) : "Public", p: formatDa(num(t.prix_unitaire)) }))}
        />
      </Panel>
    </div>
  );
}
