"use client";

import { useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SuiviEauPage() {
  const { state, dispatch, can } = useStore();
  const eau = state.ofList.filter((o) => o.productId === "p-eau" && !["cloture", "bloque"].includes(o.status));
  const [vol, setVol] = useState<Record<string, number>>({});

  return (
    <div>
      <PageHeader
        eyebrow="Atelier"
        title="Suivi spécifique eau"
        description="Compteurs et volumes — écran dédié, pas un champ caché dans le suivi générique."
      />
      {eau.map((o) => (
        <Panel key={o.id} className="p-4 mb-3">
          <p className="font-medium num mb-3">{o.id} · lot {o.lot ?? "en cours"}</p>
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <Field label="Volume capté (m³)">
              <input
                type="number"
                step="0.1"
                className={inputClass + " num"}
                defaultValue={o.waterVolumeM3 ?? 0}
                onChange={(e) => setVol({ ...vol, [o.id]: Number(e.target.value) })}
              />
            </Field>
            <Field label="Cadence ligne A">
              <input className={inputClass} readOnly defaultValue="6 000 bph" />
            </Field>
            {can("SAVE_TRACKING") && (
            <Button
              onClick={() =>
                dispatch({
                  type: "SAVE_TRACKING",
                  ofId: o.id,
                  qtyReal: o.qtyReal || o.qtyPlanned,
                  waterVolumeM3: vol[o.id] ?? o.waterVolumeM3,
                })
              }
            >
              Enregistrer compteur
            </Button>
            )}
          </div>
        </Panel>
      ))}
    </div>
  );
}
