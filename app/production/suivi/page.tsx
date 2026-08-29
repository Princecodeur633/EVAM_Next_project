"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { ETAPE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";
import type { Etape } from "@/lib/types";

export default function SuiviPage() {
  const { state, dispatch, ofNumero, can, currentUser } = useStore();
  const [ofId, setOfId] = useState(state.ofList[0]?.id ?? 0);
  const [etape, setEtape] = useState<Etape>("CAPTAGE");
  const [qty, setQty] = useState(0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Atelier" title="Étapes de production" description="Saisissez captage, traitement, soufflage, embouteillage, étiquetage et conditionnement." />
      {can("CREATE_ETAPE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="OF">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))}>
              {state.ofList.map((o) => <option key={o.id} value={o.id}>{o.numero}</option>)}
            </select>
          </Field>
          <Field label="Étape">
            <select className={inputClass} value={etape} onChange={(e) => setEtape(e.target.value as Etape)}>
              {(Object.keys(ETAPE_LABEL) as Etape[]).map((k) => <option key={k} value={k}>{ETAPE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Quantité produite">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Button disabled={!ofId || !currentUser} onClick={() => void dispatch({ type: "CREATE_ETAPE", ordre_fabrication: ofId, etape, quantite_produite: qty })}>
            Enregistrer
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "e", label: "Étape" }, { key: "q", label: "Qté" }, { key: "o", label: "Observations" }]}
          rows={state.etapes.map((e) => ({ of: ofNumero(e.ordre_fabrication), e: ETAPE_LABEL[e.etape], q: formatQty(num(e.quantite_produite), 2), o: e.observations || "—" }))}
        />
      </Panel>
    </div>
  );
}
