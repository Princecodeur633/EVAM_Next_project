"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_CLOTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { TypeCloture } from "@/lib/types";

export default function CloturesPage() {
  const { state, dispatch, can, userName } = useStore();
  const now = new Date();
  const [periode, setPeriode] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [type, setType] = useState<TypeCloture>("MENSUELLE");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Clôtures"
        description="Verrouillez une période mensuelle (AAAA-MM) ou annuelle (AAAA). Après clôture, les documents de la période ne se modifient plus."
      />
      {can("CREATE_CLOTURE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Période">
            <input className={inputClass} value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="2026-08" />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeCloture)}>
              {(Object.keys(TYPE_CLOTURE_LABEL) as TypeCloture[]).map((k) => (
                <option key={k} value={k}>{TYPE_CLOTURE_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Button disabled={!periode.trim()} onClick={() => void dispatch({ type: "CREATE_CLOTURE", periode: periode.trim(), type_cloture: type })}>
            Clôturer la période
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "p", label: "Période" }, { key: "t", label: "Type" }, { key: "v", label: "Validée par" }, { key: "d", label: "Date" }]}
          rows={state.clotures.map((c) => ({
            p: c.periode,
            t: TYPE_CLOTURE_LABEL[c.type_cloture] ?? c.type_cloture,
            v: userName(c.valide_par),
            d: formatDateTime(c.date_cloture),
          }))}
        />
      </Panel>
    </div>
  );
}
