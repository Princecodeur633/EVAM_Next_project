"use client";

import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { STATUT_ANOMALIE_LABEL, TYPE_ANOMALIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function AnomaliesPage() {
  const { state, dispatch, can } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Comptabilité" title="Anomalies" description="Écarts de stock ou de caisse, dépassements matières, lots vendus trop tôt. Marquez-les comme traitées une fois contrôlées." />
      <Panel>
        <DataTable
          columns={[{ key: "t", label: "Type" }, { key: "m", label: "Module" }, { key: "d", label: "Description" }, { key: "s", label: "Statut" }, { key: "dt", label: "Date" }, { key: "act", label: "" }]}
          rows={state.anomalies.map((a) => ({
            t: TYPE_ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie,
            m: a.module_source,
            d: a.description,
            s: <StatusBadge tone={a.statut === "DETECTEE" || a.statut === "EN_TRAITEMENT" ? "warning" : "success"}>{STATUT_ANOMALIE_LABEL[a.statut] ?? a.statut}</StatusBadge>,
            dt: formatDateTime(a.date_detection),
            act: can("TRAITER_ANOMALIE") && (a.statut === "DETECTEE" || a.statut === "EN_TRAITEMENT") ? (
              <span className="flex gap-2">
                <button className="text-success text-[12px]" onClick={() => void dispatch({ type: "TRAITER_ANOMALIE", id: a.id, statut: "TRAITEE" })}>Traiter</button>
                <button className="text-muted text-[12px]" onClick={() => void dispatch({ type: "TRAITER_ANOMALIE", id: a.id, statut: "IGNOREE" })}>Ignorer</button>
              </span>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
