"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Boxes,
  Crown,
  Factory,
  FileBarChart,
  Gauge,
  PackageX,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { BarChart, DonutChart, KpiCard, WidgetCard } from "@/components/charts";
import { Button, DataTable, PageHeader, Panel } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { fetchTableauDeBordDirection, type TableauDeBordDirection } from "@/lib/api";
import { PERIODE_RAPPORT_LABEL, STATUT_OF_LABEL, TYPE_ANOMALIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeAnomalie } from "@/lib/types";
import { cn, formatDa, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

function pct(v: number | null | undefined) {
  return v != null ? `${formatQty(v, 1)} %` : "—";
}

/** Petite tuile chiffre + libellé, utilisée à l’intérieur des widgets. */
function Stat({ label, value, tone, sub }: { label: string; value: ReactNode; tone?: "danger" | "warning" | "success"; sub?: string }) {
  return (
    <div className="rounded-[8px] border border-line bg-surface-2/60 px-3 py-2.5 min-w-0">
      <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium truncate">{label}</p>
      <p
        className={cn(
          "text-[17px] font-semibold num mt-1 leading-none break-words",
          tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-ink",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted mt-1 truncate">{sub}</p>}
    </div>
  );
}

/** Barre de progression pour un pourcentage (rendement, pertes, marge). */
function Meter({ label, value, tone }: { label: string; value: number | null | undefined; tone: "teal" | "danger" | "success" }) {
  const w = Math.max(0, Math.min(100, value ?? 0));
  const bar = tone === "danger" ? "bg-danger" : tone === "success" ? "bg-success" : "bg-teal";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="text-[12px] num font-semibold">{pct(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 border border-line overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function AlertBlock({
  title,
  icon,
  count,
  href,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  href?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-[9px] border p-3 min-w-0", count ? "border-danger/25 bg-danger-soft/40" : "border-line bg-surface-2/40")}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("shrink-0", count ? "text-danger" : "text-muted")}>{icon}</span>
        <p className="text-[12.5px] font-semibold flex-1 min-w-0 truncate">{title}</p>
        <span className={cn("text-[11px] num font-semibold px-1.5 py-0.5 rounded-[5px]", count ? "bg-danger text-white" : "bg-surface-2 text-muted")}>{count}</span>
        {href && (
          <Link href={href} className="text-muted hover:text-primary" aria-label={`Ouvrir ${title}`}>
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
      {count === 0 ? <p className="text-[12px] text-muted">Rien à signaler.</p> : <ul className="space-y-1 text-[12px]">{children}</ul>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="evam-card h-[96px]" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="evam-card h-[220px] lg:col-span-2" />
        <div className="evam-card h-[220px]" />
      </div>
    </div>
  );
}

function ReportingDashboard() {
  const { state, can, dispatch } = useStore();
  const [data, setData] = useState<TableauDeBordDirection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchTableauDeBordDirection());
      setUpdatedAt(new Date());
    } catch {
      setError("Impossible de charger le tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !data) {
    return (
      <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-danger">{error}</p>
        <Button variant="secondary" onClick={() => void load()}>
          <RefreshCw size={14} /> Réessayer
        </Button>
      </Panel>
    );
  }
  if (!data) return <DashboardSkeleton />;

  const { production, stock, commercial, caisse, distribution, rentabilite, alertes } = data;
  const valeurStock = stock.valeur_stock_matieres + stock.valeur_stock_produits_finis;
  const ecart = num(caisse.ecart_caisse);
  const livTotal = distribution.livraisons_prevues || 1;
  const tauxLivraison = Math.round((distribution.livraisons_terminees / livTotal) * 100);
  const maxMarge = Math.max(...rentabilite.produits_les_plus_rentables.map((p) => p.marge), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
        <span>{updatedAt ? `Mis à jour à ${updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 border border-line rounded-[7px] bg-surface hover:text-ink hover:border-line-strong disabled:opacity-50"
        >
          <RefreshCw size={13} className={cn(loading && "animate-spin")} /> Actualiser
        </button>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="CA du jour"
          value={formatDa(num(commercial.chiffre_affaires_jour))}
          hint={`${formatDa(num(commercial.chiffre_affaires_mois))} ce mois`}
          tone="success"
          icon={<TrendingUp size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label="Encaissé aujourd’hui"
          value={formatDa(num(caisse.encaissements_jour))}
          hint={ecart ? `Écart caisse ${formatDa(ecart)}` : "Aucun écart de caisse"}
          tone={ecart ? "warning" : "teal"}
          icon={<Wallet size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label="Rendement du jour"
          value={pct(production.aujourd_hui.rendement_pourcentage)}
          hint={`Pertes ${pct(production.aujourd_hui.pertes_pourcentage)}`}
          icon={<Gauge size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label="Valeur du stock"
          value={formatDa(valeurStock)}
          hint={stock.articles_en_rupture ? `${stock.articles_en_rupture} article(s) en rupture` : "Aucune rupture"}
          tone={stock.articles_en_rupture ? "danger" : "default"}
          icon={<Boxes size={16} strokeWidth={1.75} />}
        />
      </div>

      {/* Widgets sur 2 colonnes, alertes en colonne droite fixe */}
      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        <div className="grid md:grid-cols-2 gap-4 items-start min-w-0">
          <WidgetCard
            title="Production"
            subtitle="Quantité conforme, rendement et pertes"
            action={
              <Link href="/production/qualite" className="text-[12px] text-primary font-medium inline-flex items-center gap-1 shrink-0">
                Lots <ArrowUpRight size={13} />
              </Link>
            }
          >
            <div className="grid sm:grid-cols-2 md:grid-cols-1 2xl:grid-cols-2 gap-4">
              {[
                { titre: "Aujourd’hui", bloc: production.aujourd_hui },
                { titre: "Ce mois", bloc: production.mois },
              ].map(({ titre, bloc }) => (
                <div key={titre} className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">{titre}</p>
                    <p className="text-[18px] font-semibold num">
                      {formatQty(num(bloc.production_conforme), 0)} <span className="text-[11px] text-muted font-normal">conformes</span>
                    </p>
                  </div>
                  <Meter label="Rendement" value={bloc.rendement_pourcentage} tone="teal" />
                  <Meter label="Pertes" value={bloc.pertes_pourcentage} tone="danger" />
                </div>
              ))}
            </div>
          </WidgetCard>
          <WidgetCard title="Livraisons du jour" subtitle={`${tauxLivraison} % terminées`}>
            <BarChart
              data={[
                { label: "Prévues", value: distribution.livraisons_prevues, color: "var(--chart-1)" },
                { label: "En cours", value: distribution.livraisons_en_cours, color: "var(--chart-3)" },
                { label: "Terminées", value: distribution.livraisons_terminees, color: "var(--success)" },
                { label: "En retard", value: distribution.livraisons_en_retard, color: "var(--danger)" },
              ]}
              height={150}
            />
            <div className="grid grid-cols-4 gap-1 mt-2 text-center">
              {[distribution.livraisons_prevues, distribution.livraisons_en_cours, distribution.livraisons_terminees, distribution.livraisons_en_retard].map((v, i) => (
                <p key={i} className={cn("text-[13px] num font-semibold", i === 3 && v > 0 && "text-danger")}>
                  {v}
                </p>
              ))}
            </div>
          </WidgetCard>
          <WidgetCard title="Stock" subtitle="Valeur par nature et alertes">
            <DonutChart
              size={104}
              centerValue={valeurStock ? `${Math.round((stock.valeur_stock_produits_finis / valeurStock) * 100)}%` : "—"}
              centerLabel="produits finis"
              data={[
                { label: "Produits finis", value: stock.valeur_stock_produits_finis },
                { label: "Matières", value: stock.valeur_stock_matieres },
              ]}
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Stat label="En rupture" value={stock.articles_en_rupture} tone={stock.articles_en_rupture ? "danger" : "success"} />
              <Stat label="Sous minimum" value={stock.articles_sous_minimum} tone={stock.articles_sous_minimum ? "warning" : "success"} />
            </div>
          </WidgetCard>
          <WidgetCard title="Caisse" subtitle="Situation du jour">
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              <Stat label="Encaissements" value={formatDa(num(caisse.encaissements_jour))} tone="success" />
              <Stat label="Solde théorique" value={formatDa(caisse.solde_theorique)} />
              <div className="min-[420px]:col-span-2">
                <Stat
                  label="Écart de caisse"
                  value={formatDa(ecart)}
                  tone={ecart ? "danger" : "success"}
                  sub={alertes.ecarts_caisse_non_justifies.length ? `${alertes.ecarts_caisse_non_justifies.length} non justifié(s)` : "Tous justifiés"}
                />
              </div>
            </div>
          </WidgetCard>
          <WidgetCard title="Commercial" subtitle="Ventes du mois">
            <div className="space-y-3">
              <Stat label="Chiffre d’affaires du mois" value={formatDa(num(commercial.chiffre_affaires_mois))} tone="success" />
              <div className="flex items-center gap-3 rounded-[8px] border border-line px-3 py-2.5">
                <span className="h-8 w-8 rounded-[7px] bg-warning-soft text-warning flex items-center justify-center shrink-0">
                  <Star size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Produit le plus vendu</p>
                  <p className="text-[13px] font-medium truncate">{commercial.produit_le_plus_vendu ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[8px] border border-line px-3 py-2.5">
                <span className="h-8 w-8 rounded-[7px] bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Crown size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Client principal</p>
                  <p className="text-[13px] font-medium truncate">{commercial.client_principal ?? "—"}</p>
                </div>
              </div>
            </div>
          </WidgetCard>
          <WidgetCard
            title="Rentabilité"
            subtitle={`Marge moyenne : ${pct(rentabilite.marge_moyenne_pourcentage)}`}
            action={
              <Link href="/couts/marges" className="text-[12px] text-primary font-medium inline-flex items-center gap-1 shrink-0">
                Coûts <ArrowUpRight size={13} />
              </Link>
            }
          >
            {rentabilite.produits_les_plus_rentables.length === 0 ? (
              <p className="text-[13px] text-muted py-6 text-center">Pas encore de coût réel calculé.</p>
            ) : (
              <ul className="space-y-3">
                {rentabilite.produits_les_plus_rentables.slice(0, 5).map((p, i) => (
                  <li key={p.produit}>
                    <div className="flex items-baseline justify-between gap-2 text-[12.5px] mb-1">
                      <span className="truncate min-w-0">
                        <span className="text-muted num mr-1.5">{i + 1}.</span>
                        {p.produit}
                      </span>
                      <span className="num font-medium shrink-0">
                        {formatDa(p.marge)} <span className="text-muted font-normal">· {pct(p.taux_marge_pourcentage)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${Math.max(4, (p.marge / maxMarge) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        </div>

        <aside className="xl:sticky xl:top-[72px] min-w-0">
          <WidgetCard title="Alertes" subtitle="Signaux consolidés des autres modules">
            <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-3">
              <AlertBlock title="Matières manquantes" icon={<Factory size={15} />} count={alertes.matieres_manquantes.length}>
                {alertes.matieres_manquantes.slice(0, 4).map((m, i) => (
                  <li key={i} className="flex justify-between gap-2 min-w-0">
                    <span className="truncate text-muted">
                      {m.of} · {m.matiere}
                    </span>
                    <span className="num shrink-0 text-danger">−{formatQty(num(m.manquant), 2)}</span>
                  </li>
                ))}
              </AlertBlock>
              <AlertBlock title="Ruptures de stock" icon={<PackageX size={15} />} count={alertes.ruptures_stock.length}>
                {alertes.ruptures_stock.slice(0, 4).map((r, i) => (
                  <li key={i} className="truncate text-muted">
                    {r.article} · {r.depot}
                  </li>
                ))}
              </AlertBlock>
              <AlertBlock title="Écarts de caisse non justifiés" icon={<Banknote size={15} />} count={alertes.ecarts_caisse_non_justifies.length}>
                {alertes.ecarts_caisse_non_justifies.slice(0, 4).map((e, i) => (
                  <li key={i} className="flex justify-between gap-2 min-w-0">
                    <span className="truncate text-muted">{e.caisse}</span>
                    <span className="num shrink-0">{formatDa(num(e.ecart))}</span>
                  </li>
                ))}
              </AlertBlock>
              <AlertBlock title="Anomalies comptables" icon={<AlertTriangle size={15} />} count={alertes.anomalies_comptables.length} href="/comptabilite/brouillards">
                {alertes.anomalies_comptables.slice(0, 4).map((a) => (
                  <li key={a.id} className="truncate text-muted">
                    <span className="text-ink">{TYPE_ANOMALIE_LABEL[a.type_anomalie as TypeAnomalie] ?? a.type_anomalie}</span> · {a.description}
                  </li>
                ))}
              </AlertBlock>
            </div>
          </WidgetCard>
        </aside>
      </div>

      {/* Rapports */}
      <Panel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileBarChart size={15} className="text-muted" />
            <h2 className="text-[13px] font-semibold">Rapports générés</h2>
          </div>
          {can("GENERER_RAPPORT") && (
            <Button onClick={() => void dispatch({ type: "GENERER_RAPPORT", periode: "JOURNALIER" })}>Générer le rapport du jour</Button>
          )}
        </div>
        <DataTable
          columns={[
            { key: "p", label: "Période" },
            { key: "d", label: "Date" },
            { key: "g", label: "Généré le" },
          ]}
          rows={[...state.rapports]
            .sort((a, b) => new Date(b.date_generation).getTime() - new Date(a.date_generation).getTime())
            .map((r) => ({ p: PERIODE_RAPPORT_LABEL[r.periode] ?? r.periode, d: formatDate(r.date_rapport), g: formatDateTime(r.date_generation) }))}
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
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Pilotage" title="Tableau de bord" description="Vue d’ensemble de l’usine : ventes, caisse, production, stock, livraisons et rentabilité." />
      {isPilotage ? (
        <ReportingDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Stock disponible" value={formatQty(stock, 0)} icon={<Boxes size={16} strokeWidth={1.75} />} />
            <KpiCard label="Encaissements" value={formatDa(ca)} tone="success" icon={<Wallet size={16} strokeWidth={1.75} />} />
            <KpiCard label="OF ouverts" value={ofOpen} tone="warning" icon={<Factory size={16} strokeWidth={1.75} />} />
            <KpiCard label="Lots en attente" value={lotsWait} tone={lotsWait ? "warning" : "success"} icon={<TrendingDown size={16} strokeWidth={1.75} />} />
          </div>
          <Panel>
            <DataTable
              columns={[
                { key: "n", label: "OF" },
                { key: "a", label: "Article" },
                { key: "s", label: "Statut" },
              ]}
              rows={state.ofList.slice(0, 8).map((o) => ({ n: o.numero, a: articleName(o.article), s: STATUT_OF_LABEL[o.statut] ?? o.statut }))}
            />
          </Panel>
          <p className="text-[12px] text-muted flex items-center gap-1.5">
            <Truck size={13} /> Les indicateurs détaillés sont réservés à la direction.
          </p>
        </>
      )}
    </div>
  );
}
