"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ClaimBadge } from "@/components/badges";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ReclamationsPage() {
  const { state, dispatch, can } = useStore();
  const delivered = state.orders.filter((o) => o.status === "livree" || o.status === "exportee");
  const [orderId, setOrderId] = useState(delivered[0]?.id ?? state.orders[0]?.id ?? "");
  const [motifId, setMotifId] = useState(state.claimReasons[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const order = state.orders.find((o) => o.id === orderId);
    dispatch({ type: "CREATE_CLAIM", orderId, motifId, notes, lot: undefined });
    setNotes("");
    void order;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Après-vente"
        title="Réclamations"
        description="Lien commande / lot / BL. Décision : quarantaine (qualité), acceptation, rejet. Un lot en quarantaine n'est plus vendable."
      />
      {can("CREATE_CLAIM") && (
        <Panel className="p-4">
          <h2 className="text-[13px] font-semibold mb-3">Ouvrir une réclamation</h2>
          <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-2 items-end">
            <Field label="Commande">
              <select className={inputClass} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                {state.orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.number}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Motif">
              <select className={inputClass} value={motifId} onChange={(e) => setMotifId(e.target.value)}>
                {state.claimReasons.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Button type="submit">Ouvrir</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">N°</th>
              <th className="text-left px-3 py-2">Commande</th>
              <th className="text-left px-3 py-2">Lot</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.claims.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/reclamations/${c.id}`}>
                    {c.number}
                  </Link>
                </td>
                <td className="px-3 py-2 num">{state.orders.find((o) => o.id === c.orderId)?.number}</td>
                <td className="px-3 py-2 num">{c.lot ?? "—"}</td>
                <td className="px-3 py-2">
                  <ClaimBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
