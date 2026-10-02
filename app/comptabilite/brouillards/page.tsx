"use client";

import { useState } from "react";
import { Check, Hand, Radar, X } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, DataTable, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { STATUT_ANOMALIE_LABEL, TYPE_ANOMALIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { AnomalieDetectee, TypeAnomalie } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type Vue = "OUVERTES" | "TRAITEES" | "TOUTES";

export default function AnomaliesPage() {
  const { state, dispatch, can } = useStore();
  const [detectionEnCours, setDetectionEnCours] = useState(false);
  const [detection, setDetection] = useState<string | null>(null);
  const [vue, setVue] = useState<Vue>("OUVERTES");
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [traiter, setTraiter] = useState<AnomalieDetectee | null>(null);

  const ouverte = (a: AnomalieDetectee) => a.statut === "DETECTEE" || a.statut === "EN_TRAITEMENT";
  const rows = state.anomalies
    .filter((a) => (vue === "TOUTES" ? true : vue === "OUVERTES" ? ouverte(a) : !ouverte(a)))
    .filter((a) => (!fType || a.type_anomalie === fType) && matchSearch(q, a.description, a.module_source, TYPE_ANOMALIE_LABEL[a.type_anomalie]))
    .sort((a, b) => new Date(b.date_detection).getTime() - new Date(a.date_detection).getTime());
  const types = [...new Set(state.anomalies.map((a) => a.type_anomalie))];

  async function lancerDetection() {
    setDetectionEnCours(true);
    try {
      const res = await actions.detecterAnomalies();
      setDetection(`${res.detectees} nouvelle(s) anomalie(s), ${res.resolues_automatiquement} résolue(s) automatiquement.`);
      await dispatch({ type: "REFRESH" });
    } finally {
      setDetectionEnCours(false);
    }
  }

  async function prendre(id: number) {
    setBusy(id);
    await dispatch({ type: "PRENDRE_EN_CHARGE_ANOMALIE", id });
    setBusy(null);
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Contrôle"
        title="Anomalies"
        description="Écarts de stock ou de caisse, dépassements matières, lots vendus trop tôt, impayés, péremptions… détectés automatiquement, jamais saisis."
        actions={
          can("DETECTER_ANOMALIES") ? (
            <Button disabled={detectionEnCours} onClick={() => void lancerDetection()}>
              <Radar size={15} /> {detectionEnCours ? "Détection…" : "Lancer la détection"}
            </Button>
          ) : null
        }
      />
      {detection && <p className="text-[13px] rounded-[9px] bg-primary-soft text-primary px-3.5 py-2.5">{detection}</p>}

      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.anomalies.length} active={!!q || !!fType || vue !== "OUVERTES"} onReset={() => { setQ(""); setFType(""); setVue("OUVERTES"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Description, module…" />
          <Segmented
            label="Statut"
            value={vue}
            onChange={setVue}
            options={[
              { value: "OUVERTES", label: "Ouvertes", count: state.anomalies.filter(ouverte).length },
              { value: "TRAITEES", label: "Traitées" },
              { value: "TOUTES", label: "Toutes" },
            ]}
          />
          <FilterSelect label="Type" allLabel="Tous les types" value={fType} onChange={setFType} options={types.map((t) => ({ value: t, label: TYPE_ANOMALIE_LABEL[t as TypeAnomalie] ?? t }))} />
        </FilterBar>
        <DataTable
          emptyText={vue === "OUVERTES" ? "Aucune anomalie ouverte." : "Aucune anomalie."}
          columns={[
            { key: "t", label: "Type" },
            { key: "d", label: "Description" },
            { key: "s", label: "Statut" },
            { key: "dt", label: "Détectée le" },
            { key: "act", label: "", className: "text-right" },
          ]}
          rows={rows.map((a) => ({
            t: (
              <span>
                <span className="font-medium">{TYPE_ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie}</span>
                <span className="block text-[11.5px] text-muted">{a.module_source}</span>
              </span>
            ),
            d: (
              <span className="whitespace-normal block max-w-[520px]">
                {a.description}
                {!ouverte(a) && a.commentaire_traitement && (
                  <span className="block text-muted text-[12px] mt-0.5">
                    {a.commentaire_traitement}
                    {a.traite_par_nom ? ` · ${a.traite_par_nom}` : ""}
                  </span>
                )}
              </span>
            ),
            s: (
              <StatusBadge tone={a.statut === "DETECTEE" ? "warning" : a.statut === "EN_TRAITEMENT" ? "info" : a.statut === "IGNOREE" ? "neutral" : "success"}>
                {STATUT_ANOMALIE_LABEL[a.statut] ?? a.statut}
              </StatusBadge>
            ),
            dt: formatDateTime(a.date_detection),
            act: !can("RESOUDRE_ANOMALIE") ? (
              ""
            ) : a.statut === "DETECTEE" ? (
              <Button variant="secondary" className="h-8 px-3 text-[12.5px]" disabled={busy !== null} onClick={() => void prendre(a.id)}>
                <Hand size={13} /> {busy === a.id ? "…" : "Prendre en charge"}
              </Button>
            ) : a.statut === "EN_TRAITEMENT" ? (
              <Button className="h-8 px-3 text-[12.5px]" onClick={() => setTraiter(a)}>
                Traiter
              </Button>
            ) : (
              ""
            ),
          }))}
        />
      </Panel>
      {traiter && <TraiterDrawer anomalie={traiter} onClose={() => setTraiter(null)} />}
    </div>
  );
}

/** Commentaire obligatoire, puis Résoudre ou Ignorer. */
function TraiterDrawer({ anomalie, onClose }: { anomalie: AnomalieDetectee; onClose: () => void }) {
  const { dispatch } = useStore();
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState<"r" | "i" | null>(null);

  async function decider(type: "RESOUDRE_ANOMALIE" | "IGNORER_ANOMALIE") {
    setSaving(type === "RESOUDRE_ANOMALIE" ? "r" : "i");
    const ok = await dispatch({ type, id: anomalie.id, commentaire: commentaire.trim() });
    setSaving(null);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={TYPE_ANOMALIE_LABEL[anomalie.type_anomalie] ?? "Anomalie"}
      subtitle={`${anomalie.module_source} · ${formatDateTime(anomalie.date_detection)}`}
      icon={<Radar size={17} />}
      footer={
        <>
          <Button variant="secondary" disabled={!commentaire.trim() || saving !== null} onClick={() => void decider("IGNORER_ANOMALIE")}>
            <X size={14} /> {saving === "i" ? "…" : "Ignorer"}
          </Button>
          <Button variant="success" disabled={!commentaire.trim() || saving !== null} onClick={() => void decider("RESOUDRE_ANOMALIE")}>
            <Check size={14} /> {saving === "r" ? "…" : "Résoudre"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Anomalie">
        <p className="text-[13px] leading-relaxed rounded-[9px] bg-surface-2 border border-line px-3.5 py-3">{anomalie.description}</p>
      </DrawerSection>
      <DrawerSection title="Commentaire (obligatoire)" hint="Explique la correction apportée, ou pourquoi l’anomalie est ignorée.">
        <textarea className={cn(inputClass, "h-28 py-2 resize-none")} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} autoFocus />
      </DrawerSection>
    </Drawer>
  );
}
