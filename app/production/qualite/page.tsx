"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LotBadge } from "@/components/badges";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDate, formatQty, num } from "@/lib/utils";

export default function QualitePage() {
  const { state, articleName, ofNumero, dispatch, can, produitsFinis } = useStore();
  const router = useRouter();
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ofId, setOfId] = useState(0);
  const [peremption, setPeremption] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Qualité"
        title="Lots"
        description="Enregistrez un lot produit, contrôlez-le, puis libérez-le. Seuls les lots libérés peuvent être vendus."
      />
      {can("CREATE_LOT") && (
        <Panel className="p-4 grid sm:grid-cols-5 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => (
                <option key={a.id} value={a.id}>{a.code} · {a.designation}</option>
              ))}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Date de production">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="OF (optionnel)">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.ofList.map((o) => (
                <option key={o.id} value={o.id}>{o.numero}</option>
              ))}
            </select>
          </Field>
          <Field label="Péremption (optionnel)">
            <input type="date" className={inputClass} value={peremption} onChange={(e) => setPeremption(e.target.value)} />
          </Field>
          <Button
            disabled={!article || qty <= 0}
            onClick={() =>
              void dispatch({
                type: "CREATE_LOT",
                article,
                quantite: qty,
                date_production: date,
                ordre_fabrication: ofId || undefined,
                date_peremption: peremption || undefined,
              })
            }
          >
            Créer le lot
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "Lot" },
            { key: "a", label: "Article" },
            { key: "of", label: "OF" },
            { key: "q", label: "Qté" },
            { key: "s", label: "Statut" },
            { key: "d", label: "Production" },
          ]}
          rows={state.lots.map((l) => ({
            n: <span className="num font-medium">{l.numero_lot}</span>,
            a: articleName(l.article),
            of: ofNumero(l.ordre_fabrication),
            q: formatQty(num(l.quantite), 2),
            s: <LotBadge status={l.statut} />,
            d: formatDate(l.date_production),
            href: `/production/qualite/${l.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
