"use client";

import { useEffect, useState } from "react";
import { DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_ARTICLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/api";
import { formatDa, formatQty, num } from "@/lib/utils";
import type { TypeArticle, ValorisationStock } from "@/lib/types";

export default function ValorisationStockPage() {
  const { state } = useStore();
  const [depot, setDepot] = useState(0);
  const [type, setType] = useState<TypeArticle | 0>(0);
  const [data, setData] = useState<ValorisationStock | null>(null);

  useEffect(() => {
    void actions
      .valorisationStock({ depot: depot || undefined, type_article: type || undefined })
      .then(setData);
  }, [depot, type]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coûts"
        title="Valorisation du stock"
        description="Valeur du stock au coût moyen unitaire pondéré (CMUP), recalculé automatiquement à chaque entrée en stock."
      />
      <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <Field label="Dépôt">
          <select className={inputClass} value={depot} onChange={(e) => setDepot(Number(e.target.value))}>
            <option value={0}>Tous les dépôts</option>
            {state.depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </select>
        </Field>
        <Field label="Type d'article">
          <select className={inputClass} value={type} onChange={(e) => setType((e.target.value || 0) as TypeArticle | 0)}>
            <option value={0}>Tous</option>
            {(Object.keys(TYPE_ARTICLE_LABEL) as TypeArticle[]).map((k) => <option key={k} value={k}>{TYPE_ARTICLE_LABEL[k]}</option>)}
          </select>
        </Field>
      </Panel>
      {data && (
        <Panel className="p-4">
          <p className="text-[13px] text-muted">Valeur totale du stock filtré</p>
          <p className="text-[22px] font-semibold num">{formatDa(num(data.valeur_totale))}</p>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "a", label: "Article" },
            { key: "d", label: "Désignation" },
            { key: "t", label: "Type" },
            { key: "dep", label: "Dépôt" },
            { key: "q", label: "Quantité" },
            { key: "cmup", label: "CMUP" },
            { key: "v", label: "Valeur" },
          ]}
          rows={(data?.lignes ?? []).map((l) => ({
            a: l.article,
            d: l.designation,
            t: TYPE_ARTICLE_LABEL[l.type_article] ?? l.type_article,
            dep: l.depot,
            q: formatQty(num(l.quantite), 2),
            cmup: formatDa(num(l.cout_unitaire_moyen)),
            v: formatDa(num(l.valeur)),
          }))}
        />
      </Panel>
    </div>
  );
}
