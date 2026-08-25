"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty } from "@/lib/utils";

const TONE = {
  entree: "success" as const,
  sortie: "warning" as const,
  retour: "info" as const,
  transfert: "teal" as const,
  ajustement: "neutral" as const,
};

export default function MouvementsPage() {
  const { state, dispatch, productName, materialName, can } = useStore();
  const [articleId, setArticleId] = useState(state.stock[0]?.articleId ?? "");
  const [fromDepotId, setFromDepotId] = useState(state.depotId);
  const [toDepotId, setToDepotId] = useState("dep-ret");
  const [qty, setQty] = useState(10);

  const line = state.stock.find((s) => s.articleId === articleId && s.depotId === fromDepotId);

  function onTransfer(e: FormEvent) {
    e.preventDefault();
    if (!line) return;
    dispatch({
      type: "TRANSFER_STOCK",
      articleId,
      articleType: line.articleType,
      fromDepotId,
      toDepotId,
      qty,
      lot: line.lot,
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Stocks"
        title="Mouvements"
        description="Entrées uniquement depuis clôture OF (PF) ou réception fournisseur (matières). Ici : lecture + transferts magasin. Le CMUP ne se saisit pas."
      />
      {can("TRANSFER_STOCK") && (
        <Panel className="p-4">
          <h2 className="text-[13px] font-semibold mb-3">Transfert de dépôt</h2>
          <form onSubmit={onTransfer} className="grid md:grid-cols-4 gap-2 items-end">
            <Field label="Article">
              <select className={inputClass} value={articleId} onChange={(e) => setArticleId(e.target.value)}>
                {state.stock.map((s) => (
                  <option key={s.id} value={s.articleId}>
                    {(s.articleType === "produit" ? productName(s.articleId) : materialName(s.articleId)) + ` · ${s.depotId}`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="De">
              <select className={inputClass} value={fromDepotId} onChange={(e) => setFromDepotId(e.target.value)}>
                {state.depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vers">
              <select className={inputClass} value={toDepotId} onChange={(e) => setToDepotId(e.target.value)}>
                {state.depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex gap-2 items-end">
              <Field label="Qté">
                <input type="number" className={inputClass + " num"} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </Field>
              <Button type="submit">Transférer</Button>
            </div>
          </form>
          <p className="text-[12px] text-muted mt-2">
            Pas d'entrée libre PF ou matières : un transfert déplace un lot existant (quarantaine, retours).
          </p>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2 font-medium">Date</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Article</th>
              <th className="text-right px-3 py-2 font-medium">Qté</th>
              <th className="text-right px-3 py-2 font-medium">CMUP</th>
              <th className="text-left px-3 py-2 font-medium">Origine</th>
              <th className="text-left px-3 py-2 font-medium">Lot</th>
            </tr>
          </thead>
          <tbody>
            {state.movements.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2">{formatDateTime(m.at)}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={TONE[m.type]}>{m.type}</StatusBadge>
                </td>
                <td className="px-3 py-2">{m.articleType === "produit" ? productName(m.articleId) : materialName(m.articleId)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(m.qty, 1)}</td>
                <td className="px-3 py-2 text-right num">{m.cmup.toFixed(2)}</td>
                <td className="px-3 py-2">{m.origin}</td>
                <td className="px-3 py-2 num">{m.lot ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
