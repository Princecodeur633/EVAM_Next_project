"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_EXPORT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { TypeExport } from "@/lib/types";

export default function ExportsPage() {
  const { state, dispatch, can } = useStore();
  const [type, setType] = useState<TypeExport>("VENTES");
  const [debut, setDebut] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Comptabilité" title="Exports comptables" description="Générez les fichiers de période : ventes, encaissements, achats ou journal." />
      {can("CREATE_EXPORT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeExport)}>
              {(Object.keys(TYPE_EXPORT_LABEL) as TypeExport[]).map((k) => (
                <option key={k} value={k}>{TYPE_EXPORT_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Début"><input type="date" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} /></Field>
          <Field label="Fin"><input type="date" className={inputClass} value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
          <Button onClick={() => void dispatch({ type: "CREATE_EXPORT", type_export: type, periode_debut: debut, periode_fin: fin })}>Générer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "t", label: "Type" }, { key: "p", label: "Période" }, { key: "d", label: "Généré" }]}
          rows={state.exportsComptables.map((e) => ({
            t: TYPE_EXPORT_LABEL[e.type_export] ?? e.type_export,
            p: `${formatDate(e.periode_debut)} → ${formatDate(e.periode_fin)}`,
            d: formatDate(e.date_generation),
          }))}
        />
      </Panel>
    </div>
  );
}
