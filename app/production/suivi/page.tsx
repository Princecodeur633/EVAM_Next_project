"use client";

import { useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { OfBadge } from "@/components/badges";
import { useStore } from "@/lib/store";

export default function SuiviPage() {
  const { state, dispatch, productName, can } = useStore();
  const running = state.ofList.filter((o) => ["en_production", "planifie"].includes(o.status));
  const [qty, setQty] = useState<Record<string, number>>({});

  return (
    <div>
      <PageHeader eyebrow="Atelier" title="Suivi de production" description="Saisie du réel (consommations, incidents). Écran agent — densité atelier, pas de paramétrage." />
      <div className="space-y-3">
        {running.map((o) => (
          <Panel key={o.id} className="p-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="font-medium num">{o.id}</p>
                <p className="text-[13px] text-muted">{productName(o.productId)} · prévu {o.qtyPlanned}</p>
              </div>
              <OfBadge status={o.status} />
            </div>
            <div className="flex items-end gap-3">
              <Field label="Quantité réelle">
                <input
                  type="number"
                  className={inputClass + " num w-40"}
                  defaultValue={o.qtyReal}
                  onChange={(e) => setQty({ ...qty, [o.id]: Number(e.target.value) })}
                />
              </Field>
            {o.status === "planifie" && can("START_OF") && (
              <Button variant="secondary" onClick={() => dispatch({ type: "START_OF", ofId: o.id })}>
                Démarrer
              </Button>
            )}
            {o.status === "en_production" && can("SAVE_TRACKING") && (
              <Button
                onClick={() =>
                  dispatch({ type: "SAVE_TRACKING", ofId: o.id, qtyReal: qty[o.id] ?? (o.qtyReal || o.qtyPlanned) })
                }
              >
                Enregistrer
              </Button>
            )}
              <a className="text-[13px] text-primary" href={`/production/of/${o.id}`}>
                Fiche OF
              </a>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
