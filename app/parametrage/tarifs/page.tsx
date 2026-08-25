"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function TarifsPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/tarifs");
  const [name, setName] = useState("");
  const [factor, setFactor] = useState(1);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPSERT_TARIFF", tariff: { id: `t-${Date.now()}`, name, factor } });
    setName("");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Paramétrage"
        title="Tarifs / grilles"
        description="Produit × famille client. Le commercial lit le prix, il ne l'invente pas."
      />
      {edit && (
        <Panel className="p-4 mb-4">
          <form onSubmit={onCreate} className="grid md:grid-cols-3 gap-2 items-end">
            <Field label="Nom de grille">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Coefficient">
              <input
                type="number"
                step="0.01"
                className={inputClass + " num"}
                value={factor}
                onChange={(e) => setFactor(Number(e.target.value))}
              />
            </Field>
            <Button type="submit">Ajouter une grille</Button>
          </form>
        </Panel>
      )}
      {state.tariffs.map((g) => (
        <Panel key={g.id} className="mb-4">
          <div className="px-4 py-3 border-b border-line font-medium text-[13px] flex items-center justify-between">
            <span>
              {g.name} <span className="num text-muted">×{g.factor}</span>
            </span>
            {edit && (
              <input
                type="number"
                step="0.01"
                className="h-8 w-24 border border-line-strong rounded-[6px] px-2 text-right num"
                defaultValue={g.factor}
                onBlur={(e) =>
                  dispatch({ type: "UPSERT_TARIFF", tariff: { ...g, factor: Number(e.target.value) } })
                }
              />
            )}
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {state.products.map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-right num">{formatDa(Math.round(p.priceHt * g.factor))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
}
