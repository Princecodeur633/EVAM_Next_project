"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Guard, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatQty } from "@/lib/utils";

export default function NouvelleCommandePage() {
  const { state, dispatch, canCreateOrder, availableFor, productName } = useStore();
  const router = useRouter();
  const [customerId, setCustomerId] = useState(state.customers[0]?.id ?? "");
  const [lines, setLines] = useState([{ productId: "p-eau", qty: 60 }]);
  const check = useMemo(() => canCreateOrder(lines), [lines, canCreateOrder]);

  function addLine() {
    setLines([...lines, { productId: state.products[0].id, qty: 12 }]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!check.ok) return;
    dispatch({ type: "CREATE_ORDER", customerId, lines });
    router.push("/commercial/commandes");
  }

  const amount = lines.reduce((s, l) => s + (state.products.find((p) => p.id === l.productId)?.priceHt ?? 0) * l.qty, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Commercial"
        title="Nouvelle commande"
        description="Le commercial ne peut pas forcer le stock. Le refus explique pourquoi et où aller."
      />

      {check.ok ? (
        <Guard variant="ok" title="Stock disponible — commande validable">
          Les quantités demandées sont couvertes par le disponible (hors réservations).
        </Guard>
      ) : (
        <Guard
          variant="block"
          title="Stock insuffisant — commande bloquée"
          action={
            <a href="/production/planning" className="text-[13px] text-primary underline">
              Voir le planning
            </a>
          }
        >
          {check.missing.map((m) => (
            <p key={m.productId}>
              {productName(m.productId)} : demandé {formatQty(m.need)} · disponible {formatQty(m.available)}. Écart {formatQty(m.need - m.available)}.
            </p>
          ))}
        </Guard>
      )}

      <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Panel className="p-4 space-y-3">
          <Field label="Client">
            <select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === "comptant" ? "comptant" : "à terme"})
                </option>
              ))}
            </select>
          </Field>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_120px] gap-2 items-end">
              <Field label="Produit">
                <select
                  className={inputClass}
                  value={l.productId}
                  onChange={(e) => {
                    const n = [...lines];
                    n[i] = { ...n[i], productId: e.target.value };
                    setLines(n);
                  }}
                >
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Qté">
                <input
                  type="number"
                  className={inputClass + " num"}
                  value={l.qty}
                  onChange={(e) => {
                    const n = [...lines];
                    n[i] = { ...n[i], qty: Number(e.target.value) };
                    setLines(n);
                  }}
                />
              </Field>
              <p className="text-[12px] text-muted pb-2">Dispo {formatQty(availableFor(l.productId))}</p>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addLine}>
            Ajouter une ligne
          </Button>
        </Panel>
        <Panel className="p-4 h-fit space-y-3">
          <p className="text-[11px] uppercase text-muted">Facture à générer</p>
          <p className="text-[22px] font-semibold num">{formatDa(amount)}</p>
          <p className="text-[12px] text-muted">La facture « à payer » est créée à la validation. Paiement et préparation partent ensuite en parallèle.</p>
          <Button type="submit" className="w-full justify-center" disabled={!check.ok}>
            Valider la commande
          </Button>
        </Panel>
      </form>
    </div>
  );
}
