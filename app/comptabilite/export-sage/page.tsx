"use client";

import { useState } from "react";
import { periodeACloturer } from "@/components/comptabilite";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { FORMAT_EXPORT_LABEL, TYPE_EXPORT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { FormatExport, TypeExport } from "@/lib/types";

const EXTENSION: Record<FormatExport, string> = { SAGE_CSV: "csv", CSV_GENERIQUE: "csv", XLSX: "xlsx", JSON: "json" };

export default function ExportsPage() {
  const { state, dispatch, can } = useStore();
  // Par défaut : le journal de la période à clôturer (étape ③ de la frise).
  const periode = periodeACloturer(state);
  const [y, m] = periode.split("-").map(Number);
  const [type, setType] = useState<TypeExport>("JOURNAL");
  const [format, setFormat] = useState<FormatExport>("SAGE_CSV");
  const [debut, setDebut] = useState(`${periode}-01`);
  const [fin, setFin] = useState(new Date(y, m, 0).toISOString().slice(0, 10));

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Comptabilité" title="Exports comptables" description="Générez les fichiers de période : ventes, encaissements, achats ou journal, au format Sage ou dans un format indépendant du logiciel comptable (CSV générique, Excel, JSON)." />
      {can("CREATE_EXPORT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeExport)}>
              {(Object.keys(TYPE_EXPORT_LABEL) as TypeExport[]).map((k) => (
                <option key={k} value={k}>{TYPE_EXPORT_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Format">
            <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value as FormatExport)}>
              {(Object.keys(FORMAT_EXPORT_LABEL) as FormatExport[]).map((k) => (
                <option key={k} value={k}>{FORMAT_EXPORT_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Début"><input type="date" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} /></Field>
          <Field label="Fin"><input type="date" className={inputClass} value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
          <Button onClick={() => void dispatch({ type: "CREATE_EXPORT", type_export: type, periode_debut: debut, periode_fin: fin, format_fichier: format })}>Générer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "t", label: "Type" }, { key: "f", label: "Format" }, { key: "p", label: "Période" }, { key: "d", label: "Généré" }, { key: "act", label: "" }]}
          emptyText="Aucun export généré."
          rows={[...state.exportsComptables].sort((a, b) => b.date_generation.localeCompare(a.date_generation)).map((e) => ({
            t: TYPE_EXPORT_LABEL[e.type_export] ?? e.type_export,
            f: FORMAT_EXPORT_LABEL[e.format_fichier ?? "SAGE_CSV"],
            p: `${formatDate(e.periode_debut)} → ${formatDate(e.periode_fin)}`,
            d: formatDate(e.date_generation),
            act: (
              <button
                className="text-primary text-[12px]"
                onClick={() =>
                  void actions.telechargerExport(e.id, `export_${e.type_export.toLowerCase()}_${e.periode_debut}_${e.periode_fin}.${EXTENSION[e.format_fichier ?? "SAGE_CSV"]}`)
                }
              >
                Télécharger
              </button>
            ),
          }))}
        />
      </Panel>
    </div>
  );
}
