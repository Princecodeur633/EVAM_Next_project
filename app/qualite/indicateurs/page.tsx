"use client";

import { useEffect, useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { DECISION_NC_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { DecisionNC, IndicateursQualite, RepartitionQualite } from "@/lib/types";
import { cn, formatQty } from "@/lib/utils";

function ilYA(jours: number) {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  return d.toISOString().slice(0, 10);
}

/** Taux de conformité, NC par produit / étape / ligne / machine, contrôles en retard, instruments à étalonner. */
export default function IndicateursQualitePage() {
  const { state } = useStore();
  const [du, setDu] = useState(ilYA(30));
  const [au, setAu] = useState(new Date().toISOString().slice(0, 10));
  const [activite, setActivite] = useState(0);
  const [data, setData] = useState<IndicateursQualite | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function charger() {
    setChargement(true);
    setErreur(null);
    try {
      setData(await actions.indicateursQualite({ du, au, activite: activite || undefined }));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Indicateurs indisponibles.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    void charger();
    // Premier chargement seulement : ensuite, l’utilisateur relance avec ses filtres.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taux = data?.taux_conformite;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Qualité" title="Indicateurs qualité" description="Calculés par le serveur à partir des contrôles réalisés et des non-conformités de la période." />
      <Panel className="p-3 flex flex-wrap items-end gap-3">
        <Field label="Du">
          <input type="date" className={cn(inputClass, "w-[160px]")} value={du} onChange={(e) => setDu(e.target.value)} />
        </Field>
        <Field label="Au">
          <input type="date" className={cn(inputClass, "w-[160px]")} value={au} onChange={(e) => setAu(e.target.value)} />
        </Field>
        <Field label="Activité">
          <select className={cn(inputClass, "w-[180px]")} value={activite} onChange={(e) => setActivite(Number(e.target.value))}>
            <option value={0}>Toutes</option>
            {state.activites.map((a) => (
              <option key={a.id} value={a.id}>
                {a.designation}
              </option>
            ))}
          </select>
        </Field>
        <Button disabled={chargement} onClick={() => void charger()}>
          {chargement ? "Calcul…" : "Actualiser"}
        </Button>
        <Button variant="secondary" onClick={() => void actions.exporterIndicateursQualite("xlsx", { du, au, activite: activite || undefined }).catch(() => {})}>
          <FileSpreadsheet size={15} /> Excel
        </Button>
        <Button variant="secondary" onClick={() => void actions.exporterIndicateursQualite("pdf", { du, au, activite: activite || undefined }).catch(() => {})}>
          <FileDown size={15} /> PDF
        </Button>
      </Panel>
      {erreur && <Panel className="p-4 text-[13px] text-danger">{erreur}</Panel>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Taux de conformité"
              value={taux != null ? `${formatQty(taux, 1)} %` : "—"}
              hint={`${data.conformes} / ${data.controles_realises} contrôles`}
              tone={taux == null ? "default" : taux >= 95 ? "success" : taux >= 85 ? "warning" : "danger"}
            />
            <KpiCard label="NC ouvertes" value={data.non_conformites.ouvertes} hint={`${data.non_conformites.bloquantes_ouvertes} bloquante(s) · ${data.non_conformites.total} sur la période`} tone={data.non_conformites.bloquantes_ouvertes ? "danger" : data.non_conformites.ouvertes ? "warning" : "success"} />
            <KpiCard label="Contrôles en retard" value={data.controles_en_retard} hint={`${data.controles_en_retard_bloquants} bloquant(s)`} tone={data.controles_en_retard ? "danger" : "success"} />
            <KpiCard label="Instruments à étalonner" value={data.instruments_a_etalonner.length} hint={data.instruments_a_etalonner.join(", ") || undefined} tone={data.instruments_a_etalonner.length ? "warning" : "success"} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Repartition titre="Par produit" lignes={data.par_produit} />
            <Repartition titre="Par étape" lignes={data.par_etape} />
            <Repartition titre="Par ligne" lignes={data.par_ligne} />
            <Repartition titre="Par machine" lignes={data.par_machine} />
            <Repartition titre="Par paramètre" lignes={data.par_parametre} />
            <WidgetCard title="Décisions sur les NC" subtitle="Non-conformités clôturées de la période">
              {Object.keys(data.non_conformites.par_decision).length === 0 ? (
                <p className="text-[12.5px] text-muted py-6 text-center">Aucune décision.</p>
              ) : (
                <BarChart
                  height={180}
                  data={Object.entries(data.non_conformites.par_decision).map(([k, v]) => ({ label: DECISION_NC_LABEL[k as DecisionNC] ?? k, value: v }))}
                />
              )}
            </WidgetCard>
          </div>
        </>
      )}
    </div>
  );
}

function Repartition({ titre, lignes }: { titre: string; lignes: RepartitionQualite[] }) {
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h2 className="text-[13px] font-semibold">{titre}</h2>
      </div>
      <DataTable
        emptyText="Aucun contrôle réalisé."
        columns={[
          { key: "k", label: "" },
          { key: "c", label: "Contrôles", className: "text-right" },
          { key: "n", label: "Non conformes", className: "text-right" },
          { key: "t", label: "Conformité", className: "text-right" },
        ]}
        rows={lignes.slice(0, 10).map((l) => ({
          k: l.cle,
          c: <span className="num">{l.controles}</span>,
          n: <span className={cn("num", l.non_conformes > 0 && "text-danger font-semibold")}>{l.non_conformes}</span>,
          t: <StatusBadge tone={l.taux_conformite >= 95 ? "success" : l.taux_conformite >= 85 ? "warning" : "danger"}>{formatQty(l.taux_conformite, 1)} %</StatusBadge>,
        }))}
      />
    </Panel>
  );
}
