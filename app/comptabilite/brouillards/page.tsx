"use client";

import { useState } from "react";
import { Button, DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { STATUT_ANOMALIE_LABEL, TYPE_ANOMALIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function AnomaliesPage() {
  const { state, dispatch, can } = useStore();
  const [detectionEnCours, setDetectionEnCours] = useState(false);
  const [commentaire, setCommentaire] = useState<Record<number, string>>({});
  const [detection, setDetection] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Anomalies"
        description="Écarts de stock ou de caisse, dépassements matières, lots vendus trop tôt, impayés, péremptions... Détectées automatiquement par le système, jamais saisies."
        actions={
          can("DETECTER_ANOMALIES") ? (
            <Button
              disabled={detectionEnCours}
              onClick={() => {
                setDetectionEnCours(true);
                void actions.detecterAnomalies().then(async (res) => {
                  setDetection(`${res.detectees} nouvelle(s), ${res.resolues_automatiquement} résolue(s) automatiquement.`);
                  await dispatch({ type: "REFRESH" });
                  setDetectionEnCours(false);
                });
              }}
            >
              {detectionEnCours ? "Détection…" : "Lancer la détection"}
            </Button>
          ) : null
        }
      />
      {detection && <p className="text-[13px] text-muted">{detection}</p>}
      <Panel>
        <DataTable
          columns={[
            { key: "t", label: "Type" },
            { key: "m", label: "Module" },
            { key: "d", label: "Description" },
            { key: "s", label: "Statut" },
            { key: "dt", label: "Date" },
            { key: "act", label: "" },
          ]}
          rows={state.anomalies.map((a) => ({
            t: TYPE_ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie,
            m: a.module_source,
            d: (
              <span>
                {a.description}
                {a.statut === "TRAITEE" || a.statut === "IGNOREE" ? (
                  <span className="block text-muted text-[12px] mt-0.5">
                    {a.commentaire_traitement} {a.traite_par_nom ? `· ${a.traite_par_nom}` : ""}
                  </span>
                ) : null}
              </span>
            ),
            s: <StatusBadge tone={a.statut === "DETECTEE" ? "warning" : a.statut === "EN_TRAITEMENT" ? "info" : a.statut === "IGNOREE" ? "neutral" : "success"}>{STATUT_ANOMALIE_LABEL[a.statut] ?? a.statut}</StatusBadge>,
            dt: formatDateTime(a.date_detection),
            act: can("RESOUDRE_ANOMALIE") && a.statut !== "TRAITEE" && a.statut !== "IGNOREE" ? (
              <span className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                {a.statut === "DETECTEE" && (
                  <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "PRENDRE_EN_CHARGE_ANOMALIE", id: a.id })}>
                    Prendre en charge
                  </button>
                )}
                <input
                  className="h-8 w-40 border border-line rounded px-2 text-[12px]"
                  placeholder="Commentaire"
                  value={commentaire[a.id] ?? ""}
                  onChange={(e) => setCommentaire((m) => ({ ...m, [a.id]: e.target.value }))}
                />
                <button
                  className="text-success text-[12px] disabled:opacity-40"
                  disabled={!commentaire[a.id]?.trim()}
                  onClick={() => void dispatch({ type: "RESOUDRE_ANOMALIE", id: a.id, commentaire: commentaire[a.id] })}
                >
                  Résoudre
                </button>
                <button
                  className="text-muted text-[12px] disabled:opacity-40"
                  disabled={!commentaire[a.id]?.trim()}
                  onClick={() => void dispatch({ type: "IGNORER_ANOMALIE", id: a.id, commentaire: commentaire[a.id] })}
                >
                  Ignorer
                </button>
              </span>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
