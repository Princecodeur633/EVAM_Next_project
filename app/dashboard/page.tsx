"use client";

import { useEffect, useState } from "react";
import { BarChart, KpiCard, WidgetCard } from "@/components/charts";
import { Button, DataTable, PageHeader, Panel } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { fetchTableauDeBordDirection, type TableauDeBordDirection } from "@/lib/api";
import { STATUT_OF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime, formatQty, num } from "@/lib/utils";

function ReportingDashboard() {
  const { state, can, dispatch } = useStore();
  const [data, setData] = useState<TableauDeBordDirection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTableauDeBordDirection()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger le tableau de bord.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-[13px] text-danger">{error}</p>;
  if (!data) return <p className="text-[13px] text-muted">Chargement du tableau de bord…</p>;

  const { production, stock, commercial, caisse, distribution, rentabilite, alertes } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="CA du jour" value={formatDa(num(commercial.chiffre_affaires_jour))} tone="success" />
        <KpiCard label="CA du mois" value={formatDa(num(commercial.chiffre_affaires_mois))} tone="teal" />
        <KpiCard
          label="Rendement production (jour)"
          value={production.aujourd_hui.rendement_pourcentage != null ? `${production.aujourd_hui.rendement_pourcentage} %` : "—"}
        />
        <KpiCard
          label="Valeur stock (matières + PF)"
          value={formatDa(stock.valeur_stock_matieres + stock.valeur_stock_produits_finis)}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetCard title="Production" subtitle="Conformité et pertes, jour vs mois">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-muted text-[11px] uppercase tracking-wide">Aujourd&apos;hui</p>
              <p>Conforme : {formatQty(num(production.aujourd_hui.production_conforme), 0)}</p>
              <p>Rendement : {production.aujourd_hui.rendement_pourcentage ?? "—"} %</p>
              <p>Pertes : {production.aujourd_hui.pertes_pourcentage ?? "—"} %</p>
            </div>
            <div>
              <p className="text-muted text-[11px] uppercase tracking-wide">Ce mois</p>
              <p>Conforme : {formatQty(num(production.mois.production_conforme), 0)}</p>
              <p>Rendement : {production.mois.rendement_pourcentage ?? "—"} %</p>
              <p>Pertes : {production.mois.pertes_pourcentage ?? "—"} %</p>
            </div>
          </div>
        </WidgetCard>

        <WidgetCard title="Stock" subtitle="Valeur et alertes">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <p>Valeur matières : {formatDa(stock.valeur_stock_matieres)}</p>
            <p>Valeur produits finis : {formatDa(stock.valeur_stock_produits_finis)}</p>
            <p>Articles en rupture : {stock.articles_en_rupture}</p>
            <p>Articles sous minimum : {stock.articles_sous_minimum}</p>
          </div>
        </WidgetCard>

        <WidgetCard title="Commercial" subtitle="Ventes du mois">
          <p className="text-[13px]">Produit le plus vendu : {commercial.produit_le_plus_vendu ?? "—"}</p>
          <p className="text-[13px]">Client principal : {commercial.client_principal ?? "—"}</p>
        </WidgetCard>

        <WidgetCard title="Caisse" subtitle="Aujourd'hui">
          <p className="text-[13px]">Encaissements : {formatDa(num(caisse.encaissements_jour))}</p>
          <p className="text-[13px]">Solde théorique : {formatDa(caisse.solde_theorique)}</p>
          <p className="text-[13px]">Écarts : {formatDa(num(caisse.ecart_caisse))}</p>
        </WidgetCard>

        <WidgetCard title="Distribution" subtitle="Livraisons du jour">
          <BarChart
            data={[
              { label: "Prévues", value: distribution.livraisons_prevues },
              { label: "Terminées", value: distribution.livraisons_terminees },
              { label: "En cours", value: distribution.livraisons_en_cours },
              { label: "En retard", value: distribution.livraisons_en_retard },
            ]}
            height={140}
          />
        </WidgetCard>

        <WidgetCard title="Rentabilité" subtitle={`Marge moyenne : ${rentabilite.marge_moyenne_pourcentage ?? "—"} %`}>
          {rentabilite.produits_les_plus_rentables.length === 0 ? (
            <p className="text-[13px] text-muted">Pas encore de coût réel calculé.</p>
          ) : (
            <ul className="text-[13px] space-y-1">
              {rentabilite.produits_les_plus_rentables.slice(0, 5).map((p) => (
                <li key={p.produit} className="flex justify-between gap-2">
                  <span>{p.produit}</span>
                  <span className="num">{formatDa(p.marge)} ({p.taux_marge_pourcentage ?? "—"} %)</span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>
      </div>

      <WidgetCard title="Alertes" subtitle="Signaux consolidés des autres modules">
        <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
          <div>
            <p className="font-medium mb-1">Matières manquantes ({alertes.matieres_manquantes.length})</p>
            {alertes.matieres_manquantes.slice(0, 5).map((m, i) => (
              <p key={i} className="text-muted">{m.of} · {m.matiere} · manque {formatQty(num(m.manquant), 2)}</p>
            ))}
          </div>
          <div>
            <p className="font-medium mb-1">Ruptures de stock ({alertes.ruptures_stock.length})</p>
            {alertes.ruptures_stock.slice(0, 5).map((r, i) => (
              <p key={i} className="text-muted">{r.article} · {r.depot}</p>
            ))}
          </div>
          <div>
            <p className="font-medium mb-1">Écarts de caisse non justifiés ({alertes.ecarts_caisse_non_justifies.length})</p>
            {alertes.ecarts_caisse_non_justifies.slice(0, 5).map((e, i) => (
              <p key={i} className="text-muted">{e.caisse} · {formatDa(num(e.ecart))}</p>
            ))}
          </div>
          <div>
            <p className="font-medium mb-1">Anomalies comptables ({alertes.anomalies_comptables.length})</p>
            {alertes.anomalies_comptables.slice(0, 5).map((a) => (
              <p key={a.id} className="text-muted">{a.type_anomalie} · {a.description}</p>
            ))}
          </div>
        </div>
      </WidgetCard>

      <Panel className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">Rapports générés</h2>
          {can("GENERER_RAPPORT") && (
            <Button onClick={() => void dispatch({ type: "GENERER_RAPPORT", periode: "JOURNALIER" })}>
              Générer le rapport du jour
            </Button>
          )}
        </div>
        <DataTable
          columns={[{ key: "p", label: "Période" }, { key: "d", label: "Date" }, { key: "g", label: "Généré le" }]}
          rows={state.rapports.map((r) => ({ p: r.periode, d: r.date_rapport, g: formatDateTime(r.date_generation) }))}
        />
      </Panel>
    </div>
  );
}

export default function DashboardPage() {
  const { state, articleName, role } = useStore();
  const ofOpen = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE").length;
  const lotsWait = state.lots.filter((l) => l.statut === "EN_ATTENTE").length;
  const stock = state.stock.reduce((a, s) => a + stockDisponible(s), 0);
  const ca = state.encaissements.reduce((a, e) => a + num(e.montant), 0);

  const isPilotage = role === "DIRECTION" || role === "COMPTABILITE_DAF";

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Pilotage" title="Tableau de bord" description="Vue d’ensemble de l’usine : stocks, encaissements, production et qualité." />
      {isPilotage ? (
        <ReportingDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Stock disponible" value={formatQty(stock, 0)} />
            <KpiCard label="Encaissements" value={formatDa(ca)} tone="success" />
            <KpiCard label="OF ouverts" value={ofOpen} tone="warning" />
            <KpiCard label="Lots en attente" value={lotsWait} tone={lotsWait ? "warning" : "success"} />
          </div>
          <Panel>
            <DataTable
              columns={[{ key: "n", label: "OF" }, { key: "a", label: "Article" }, { key: "s", label: "Statut" }]}
              rows={state.ofList.slice(0, 8).map((o) => ({ n: o.numero, a: articleName(o.article), s: STATUT_OF_LABEL[o.statut] ?? o.statut }))}
            />
          </Panel>
        </>
      )}
    </div>
  );
}
