"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function PertesPage() {
  const { state, dispatch, can } = useStore();
  const [ofId, setOfId] = useState(state.ofList[0]?.id ?? "");
  const [causeId, setCauseId] = useState(state.lossCauses[0]?.id ?? "");
  const [qty, setQty] = useState(12);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "ADD_LOSS", ofId, causeId, qty });
  }

  return (
    <div>
      <PageHeader eyebrow="Production" title="Pertes et rebuts" description="Causes paramétrables. Alimente le rendement et le coût d'OF à la clôture." />
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <Panel className="p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="OF">
              <select className={inputClass} value={ofId} onChange={(e) => setOfId(e.target.value)}>
                {state.ofList.filter((o) => ["en_production", "fin_production"].includes(o.status)).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cause">
              <select className={inputClass} value={causeId} onChange={(e) => setCauseId(e.target.value)}>
                {state.lossCauses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantité">
              <input type="number" className={inputClass + " num"} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </Field>
            {can("ADD_LOSS") && <Button type="submit">Saisir la perte</Button>}
          </form>
        </Panel>
        <Panel>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
                <th className="text-left px-3 py-2 font-medium">OF</th>
                <th className="text-left px-3 py-2 font-medium">Cause</th>
                <th className="text-right px-3 py-2 font-medium">Qté</th>
              </tr>
            </thead>
            <tbody>
              {state.losses.map((l) => (
                <tr key={l.id} className="border-b border-line">
                  <td className="px-3 py-2 num">{l.ofId}</td>
                  <td className="px-3 py-2">{state.lossCauses.find((c) => c.id === l.causeId)?.label}</td>
                  <td className="px-3 py-2 text-right num">{l.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
