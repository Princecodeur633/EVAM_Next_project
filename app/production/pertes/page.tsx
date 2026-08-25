"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { MOTIF_PERTE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";
import type { MotifPerte } from "@/lib/types";

export default function PertesPage() {
  const { state, dispatch, ofNumero, can } = useStore();
  const [ofId, setOfId] = useState(state.ofList[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  const [motif, setMotif] = useState<MotifPerte>("CASSE");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Production" title="Pertes de production" description="Déclarez les pertes : casse, non-conformité, panne, erreur de manipulation." />
      {can("CREATE_PERTE") && (
        <Panel className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="OF">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))}>
              {state.ofList.map((o) => <option key={o.id} value={o.id}>{o.numero}</option>)}
            </select>
          </Field>
          <Field label="Motif">
            <select className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value as MotifPerte)}>
              {(Object.keys(MOTIF_PERTE_LABEL) as MotifPerte[]).map((k) => <option key={k} value={k}>{MOTIF_PERTE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Button disabled={!ofId} onClick={() => void dispatch({ type: "CREATE_PERTE", ordre_fabrication: ofId, quantite_perte: qty, motif })}>Enregistrer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "m", label: "Motif" }, { key: "q", label: "Qté" }, { key: "o", label: "Observations" }]}
          rows={state.pertes.map((p) => ({ of: ofNumero(p.ordre_fabrication), m: MOTIF_PERTE_LABEL[p.motif], q: formatQty(num(p.quantite_perte), 2), o: p.observations || "—" }))}
        />
      </Panel>
    </div>
  );
}
