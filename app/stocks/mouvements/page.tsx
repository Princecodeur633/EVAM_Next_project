"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_MVT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty, num } from "@/lib/utils";
import type { TypeMouvement } from "@/lib/types";

export default function MouvementsPage() {
  const { state, dispatch, articleName, can, userName } = useStore();
  const [article, setArticle] = useState(state.articles[0]?.id ?? 0);
  const [depot, setDepot] = useState(state.depotId ?? state.depots[0]?.id ?? 0);
  const [type, setType] = useState<TypeMouvement>("ENTREE");
  const [qty, setQty] = useState(0);
  const depotName = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Stocks" title="Mouvements de stock" description="Chaque entrée, sortie, transfert ou ajustement met à jour le stock du dépôt." />
      {can("CREATE_MVT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {state.articles.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Dépôt">
            <select className={inputClass} value={depot} onChange={(e) => setDepot(Number(e.target.value))}>
              {state.depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeMouvement)}>
              {(Object.keys(TYPE_MVT_LABEL) as TypeMouvement[]).map((k) => <option key={k} value={k}>{TYPE_MVT_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Button disabled={!article || !depot} onClick={() => void dispatch({ type: "CREATE_MVT", article, depot, type_mouvement: type, quantite: qty })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "t", label: "Type" }, { key: "a", label: "Article" }, { key: "d", label: "Dépôt" }, { key: "q", label: "Qté" }, { key: "u", label: "Saisi par" }, { key: "at", label: "Date" }]}
          rows={state.mouvements.map((m) => ({
            n: m.numero,
            t: TYPE_MVT_LABEL[m.type_mouvement],
            a: articleName(m.article),
            d: depotName(m.depot),
            q: formatQty(num(m.quantite), 2),
            u: userName(m.utilisateur),
            at: formatDateTime(m.date_mouvement),
          }))}
        />
      </Panel>
    </div>
  );
}
