"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { FAMILY_LABEL } from "@/lib/seed";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";

export default function PlanningPage() {
  const { state, dispatch, productName } = useStore();
  const router = useRouter();
  const [productId, setProductId] = useState(state.products[0]?.id ?? "");
  const [date, setDate] = useState("2026-08-20");
  const [qty, setQty] = useState(4000);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "CREATE_PLAN", productId, date, qty });
    router.push("/production/of");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Production"
        title="Planning"
        description="1 plan = 1 produit, une date, une quantité. L'OF est généré automatiquement. Aucune commande client ne déclenche la production."
      />
      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        <Panel className="p-4">
          <h2 className="text-[13px] font-semibold mb-3">Nouveau plan</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Produit fini">
              <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
                {state.products.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Quantité planifiée">
              <input type="number" className={inputClass + " num"} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </Field>
            <Button type="submit" className="w-full justify-center">
              Générer l'OF
            </Button>
          </form>
        </Panel>
        <Panel>
          <div className="px-4 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">Plans existants</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-[#f8fafb] text-[11px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Produit</th>
                <th className="px-3 py-2 font-medium">Famille</th>
                <th className="px-3 py-2 font-medium">Qté</th>
                <th className="px-3 py-2 font-medium">OF généré</th>
              </tr>
            </thead>
            <tbody>
              {state.plans.map((pl) => {
                const p = state.products.find((x) => x.id === pl.productId);
                return (
                  <tr key={pl.id} className="border-b border-line">
                    <td className="px-3 py-2 num">{pl.date}</td>
                    <td className="px-3 py-2">{productName(pl.productId)}</td>
                    <td className="px-3 py-2">{p ? FAMILY_LABEL[p.family] : "—"}</td>
                    <td className="px-3 py-2 num">{pl.qty}</td>
                    <td className="px-3 py-2">
                      <a className="text-primary num" href={`/production/of/${pl.ofId}`}>
                        {pl.ofId}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
