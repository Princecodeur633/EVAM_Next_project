"use client";

import Link from "next/link";
import { ArrowRight, Ban, Check } from "lucide-react";
import { BarChart, DonutChart, KpiCard, SparkBars, WidgetCard } from "@/components/charts";
import { canAccess, flattenNav } from "@/lib/nav";
import { FLOW_STEPS, ROLE_PROFILES, type FlowId } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn, formatDa, formatQty } from "@/lib/utils";
import { ACCENT_CLASS, ACCENT_SOFT, ROLE_ICONS } from "@/components/icons";
import { Panel } from "@/components/ui";

export default function AccueilPage() {
  const { state, currentUser, productName } = useStore();
  if (!currentUser) return null;
  const profile = ROLE_PROFILES[currentUser.role];
  const Icon = ROLE_ICONS[profile.icon];
  const shortcuts = flattenNav(currentUser.role).filter((i) => i.href !== "/accueil");
  const tasks = tasksForRole(currentUser.role, state, productName);
  const visibleTasks = tasks.items.filter((t) => canAccess(currentUser.role, t.href));

  return (
    <div className="space-y-6 anim-in max-w-[1180px]">
      <section className="evam-card overflow-hidden">
        <div className={cn("h-1", ACCENT_CLASS[profile.accent])} />
        <div className="p-6 lg:p-7 flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{profile.station}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn("h-11 w-11 rounded-[8px] text-white flex items-center justify-center", ACCENT_CLASS[profile.accent])}>
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <div>
                <h1 className="text-[26px] font-semibold tracking-tight leading-tight">{profile.label}</h1>
                <p className="text-[13px] text-muted">{currentUser.name} · {currentUser.email}</p>
              </div>
            </div>
            <p className="mt-4 text-[14.5px] leading-relaxed max-w-2xl">{profile.mission}</p>
            <p className="mt-2 text-[13px] text-muted">{profile.homeHint}</p>
          </div>
          <div className="lg:w-[280px] shrink-0">
            <p className={cn("text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-[4px] inline-block", ACCENT_SOFT[profile.accent])}>
              Posture
            </p>
            <p className="text-[13px] leading-relaxed mt-2 text-muted">{profile.posture}</p>
          </div>
        </div>
        <FlowStrip active={profile.flow} />
      </section>

      {tasks.metrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tasks.metrics.map((m) => (
            <KpiCard key={m.label} label={m.label} value={m.value} hint={m.hint} tone={m.tone ?? "default"} />
          ))}
        </div>
      )}

      <RoleInsights role={currentUser.role} state={state} />

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <Panel>
          <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-surface-2">
            <h2 className="text-[13px] font-semibold">File du jour — ce que vous traitez</h2>
            <div className="flex items-center gap-3">
              <SparkBars values={[6, 9, 4, 12, 8, 14, visibleTasks.length || 3]} tone="teal" />
              <span className="text-[11px] text-muted">{visibleTasks.length} élément{visibleTasks.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          {visibleTasks.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-muted">Rien en attente sur votre poste pour le moment.</p>
          ) : (
            <ul>
              {visibleTasks.map((t) => (
                <li key={t.href + t.title} className="border-b border-line last:border-0">
                  <Link href={t.href} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-primary-soft/70 transition-colors">
                    <div>
                      <p className="text-[13px] font-medium">{t.title}</p>
                      <p className="text-[12px] text-muted mt-0.5">{t.detail}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5">
            <h2 className="text-[13px] font-semibold mb-3">Vous faites</h2>
            <ul className="space-y-2">
              {profile.owns.map((o) => (
                <li key={o} className="flex gap-2 text-[13px]">
                  <Check size={14} className="text-success mt-0.5 shrink-0" strokeWidth={2} />
                  {o}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-[13px] font-semibold mb-3">Vous ne faites pas</h2>
            <ul className="space-y-2">
              {profile.never.map((o) => (
                <li key={o} className="flex gap-2 text-[13px] text-muted">
                  <Ban size={14} className="text-danger/80 mt-0.5 shrink-0" strokeWidth={2} />
                  {o}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel className="p-5">
        <h2 className="text-[13px] font-semibold mb-3">Règles qui ne se négocient pas</h2>
        <ol className="grid md:grid-cols-2 gap-3">
          {profile.rules.map((r, i) => (
            <li key={r} className="flex gap-3 text-[13px] leading-relaxed">
              <span className="num text-muted text-[12px] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              {r}
            </li>
          ))}
        </ol>
      </Panel>

      <div>
        <h2 className="text-[13px] font-semibold mb-3">Vos écrans</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="evam-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary-soft/40 transition-colors group"
            >
              <p className="text-[11px] uppercase tracking-wide text-muted">{s.group}</p>
              <p className="text-[14px] font-medium mt-1 group-hover:text-primary">{s.label}</p>
              {s.hint && <p className="text-[12px] text-muted mt-1">{s.hint}</p>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleInsights({
  role,
  state,
}: {
  role: Role;
  state: ReturnType<typeof useStore>["state"];
}) {
  const ofPipeline = [
    { label: "Planifié", value: state.ofList.filter((o) => o.status === "planifie").length },
    { label: "Prod.", value: state.ofList.filter((o) => o.status === "en_production").length },
    { label: "Qualité", value: state.ofList.filter((o) => o.status === "fin_production").length },
    { label: "Clôturé", value: state.ofList.filter((o) => o.status === "cloture").length },
  ];

  const financeMix = [
    { label: "Payées", value: state.invoices.filter((i) => i.status === "payee").length, color: "var(--chart-5)" },
    { label: "À payer", value: state.invoices.filter((i) => i.status === "a_payer").length, color: "var(--chart-3)" },
    { label: "Suspendues", value: state.invoices.filter((i) => i.status === "suspendue").length, color: "var(--danger)" },
  ];

  const stockPf = state.stock.filter((s) => s.articleType === "produit" && s.depotId === "dep-pf");
  const stockUnits = stockPf.reduce((a, s) => a + s.qty, 0);
  const familyMix = [
    {
      label: "Eau",
      value: stockPf.filter((s) => state.products.find((p) => p.id === s.articleId)?.family === "eau").reduce((a, s) => a + s.qty, 0),
      color: "var(--chart-1)",
    },
    {
      label: "Jus",
      value: stockPf.filter((s) => state.products.find((p) => p.id === s.articleId)?.family === "jus").reduce((a, s) => a + s.qty, 0),
      color: "var(--chart-2)",
    },
    {
      label: "Yaourt",
      value: stockPf.filter((s) => state.products.find((p) => p.id === s.articleId)?.family === "yaourt").reduce((a, s) => a + s.qty, 0),
      color: "var(--chart-3)",
    },
  ];

  if (role === "direction" || role === "administrateur") {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetCard title="Charge atelier" subtitle="Pipeline OF du jour">
          <BarChart data={ofPipeline} height={150} />
        </WidgetCard>
        <WidgetCard title="Portefeuille finance" subtitle="Factures par statut">
          <DonutChart data={financeMix} centerValue={String(state.invoices.length)} centerLabel="factures" />
        </WidgetCard>
      </div>
    );
  }

  if (["responsable_production", "agent_production", "controleur_qualite"].includes(role)) {
    return (
      <WidgetCard title="Pipeline production" subtitle="Où en sont les OF — votre poste agit ici">
        <BarChart data={ofPipeline} height={150} />
      </WidgetCard>
    );
  }

  if (role === "caissier" || role === "comptabilite") {
    const aPayer = state.invoices.filter((i) => i.status === "a_payer").reduce((a, i) => a + i.amount, 0);
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetCard title="Encaissements" subtitle="Répartition des factures">
          <DonutChart data={financeMix} centerValue={formatDa(aPayer)} centerLabel="à encaisser" />
        </WidgetCard>
        <WidgetCard title="Flux caisse / Sage" subtitle="Ce qui reste actionnable aujourd'hui">
          <BarChart
            data={[
              { label: "À payer", value: state.invoices.filter((i) => i.status === "a_payer").length },
              { label: "Brouillards", value: state.drafts.filter((d) => d.status === "a_valider").length },
              { label: "Exclus", value: state.drafts.filter((d) => d.status === "exclu").length },
            ]}
            height={150}
          />
        </WidgetCard>
      </div>
    );
  }

  if (role === "magasinier" || role === "responsable_achats") {
    return (
      <WidgetCard title="Stock PF par famille" subtitle="Capacité vendable dépôt produits finis">
        <DonutChart data={familyMix} centerValue={formatQty(stockUnits)} centerLabel="unités" />
      </WidgetCard>
    );
  }

  if (role === "commercial" || role === "preparateur" || role === "logistique") {
    return (
      <WidgetCard title="Cycle commercial" subtitle="Commandes · préparation · livraison">
        <BarChart
          data={[
            { label: "Commandes", value: state.orders.filter((o) => !["livree", "annulee"].includes(o.status)).length },
            { label: "Prépa.", value: state.orders.filter((o) => o.prepStatus !== "complete").length },
            { label: "BL", value: state.deliveryNotes.filter((b) => b.status !== "livre").length },
          ]}
          height={150}
        />
      </WidgetCard>
    );
  }

  return null;
}

function FlowStrip({ active }: { active: FlowId[] }) {
  return (
    <div className="border-t border-line px-4 py-3 bg-surface-2 overflow-x-auto">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted mb-2 px-1">Chaîne EVAM — votre position</p>
      <ol className="flex items-center gap-0 min-w-max">
        {FLOW_STEPS.map((s, i) => {
          const on = active.includes(s.id);
          const all = active.length === FLOW_STEPS.length;
          return (
            <li key={s.id} className="flex items-center">
              <span
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-[4px] whitespace-nowrap",
                  on || all ? "bg-primary text-white font-medium" : "text-muted",
                )}
              >
                {s.label}
              </span>
              {i < FLOW_STEPS.length - 1 && <span className="w-4 h-px bg-line-strong mx-0.5" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type Task = { title: string; detail: string; href: string };
type MetricT = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "warning" | "success" | "teal";
};

function tasksForRole(
  role: Role,
  state: ReturnType<typeof useStore>["state"],
  productName: (id: string) => string,
): { items: Task[]; metrics: MetricT[] } {
  const ofWaitQ = state.ofList.filter((o) => o.status === "fin_production");
  const ofRun = state.ofList.filter((o) => ["en_production", "planifie"].includes(o.status));
  const pay = state.invoices.filter((i) => i.status === "a_payer");
  const susp = state.invoices.filter((i) => i.status === "suspendue");
  const dm = state.materialRequests.filter((r) => r.status === "demandee");
  const da = state.purchaseRequests.filter((d) => d.status === "soumise");
  const blLock = state.deliveryNotes.filter((b) => b.status === "verrouille");
  const prep = state.orders.filter((o) => o.prepStatus !== "complete" && !["suspendue", "annulee"].includes(o.status));
  const drafts = state.drafts.filter((d) => d.status === "a_valider");

  switch (role) {
    case "administrateur":
      return {
        metrics: [
          { label: "Utilisateurs", value: state.users.length },
          { label: "Profils", value: 12 },
        ],
        items: [
          { title: "Matrice des droits", detail: "Vérifier le périmètre de chaque poste", href: "/admin/droits" },
          { title: "Journal d'audit", detail: "Clôtures, suspensions, exports Sage", href: "/admin/audit" },
          { title: "Paramétrage", detail: "Référentiels saisis une fois", href: "/parametrage" },
        ],
      };
    case "direction":
      return {
        metrics: [
          { label: "OF ouverts", value: ofRun.length + ofWaitQ.length, hint: "Hors clôturés", tone: "warning" },
          { label: "À encaisser", value: pay.length, tone: pay.length ? "warning" : "success" },
          { label: "Suspendues", value: susp.length, tone: susp.length ? "danger" : "default" },
          { label: "Lots à clôturer", value: ofWaitQ.length, tone: ofWaitQ.length ? "warning" : "success" },
        ],
        items: [
          { title: "Tableau de bord", detail: "Cinq indicateurs vitaux — lecture seule", href: "/dashboard" },
          ...susp.map((i) => ({
            title: `Facture suspendue · ${i.number}`,
            detail: i.suspendReason ?? "Hors export Sage",
            href: "/caisse/suspendues",
          })),
          ...ofWaitQ.map((o) => ({
            title: `OF en attente qualité · ${o.id}`,
            detail: productName(o.productId),
            href: `/production/of/${o.id}`,
          })),
        ].slice(0, 5),
      };
    case "responsable_production":
      return {
        metrics: [
          { label: "OF à piloter", value: ofRun.length, tone: "warning" },
          { label: "Plans", value: state.plans.length },
        ],
        items: [
          { title: "Créer le plan du jour", detail: "1 produit · 1 date · 1 quantité → OF auto", href: "/production/planning" },
          ...ofRun.map((o) => ({
            title: o.status === "en_production" ? `Valider fin de production · ${o.id}` : `Démarrer · ${o.id}`,
            detail: productName(o.productId),
            href: `/production/of/${o.id}`,
          })),
        ],
      };
    case "agent_production":
      return {
        metrics: [{ label: "OF en atelier", value: ofRun.length, tone: "warning" }],
        items: ofRun.map((o) => ({
          title: `Saisir le réel · ${o.id}`,
          detail: `${productName(o.productId)} · prévu ${formatQty(o.qtyPlanned)}`,
          href: "/production/suivi",
        })),
      };
    case "controleur_qualite":
      return {
        metrics: [{ label: "Lots en attente", value: ofWaitQ.length, tone: ofWaitQ.length ? "warning" : "success" }],
        items: ofWaitQ.map((o) => ({
          title: `Contrôler ${o.lot ?? o.id}`,
          detail: `${productName(o.productId)} — conforme = entrée stock PF`,
          href: `/production/qualite/${o.id}`,
        })),
      };
    case "magasinier":
      return {
        metrics: [{ label: "Demandes à servir", value: dm.length, tone: dm.length ? "warning" : "success" }],
        items: [
          ...dm.map((r) => ({
            title: `Servir matières · ${r.ofId}`,
            detail: "Sortie stock magasin",
            href: "/production/demandes-matieres",
          })),
          { title: "Inventaire PF ouvert", detail: "Comptage théorique vs physique", href: "/stocks/inventaires" },
        ],
      };
    case "responsable_achats":
      return {
        metrics: [{ label: "DA à valider", value: da.length, tone: da.length ? "warning" : "default" }],
        items: [
          ...da.map((d) => ({ title: `Valider ${d.number}`, detail: d.reason, href: "/approvisionnement/demandes" })),
          { title: "Réception avec écart", detail: "Concentré orange 180 / 250", href: "/approvisionnement/receptions" },
        ],
      };
    case "commercial":
      return {
        metrics: [{ label: "Commandes actives", value: state.orders.filter((o) => o.status !== "livree").length }],
        items: [
          { title: "Nouvelle commande", detail: "Tester le StockGuard avec une quantité trop haute", href: "/commercial/commandes/nouvelle" },
          ...state.orders.slice(0, 3).map((o) => ({
            title: o.number,
            detail: o.status,
            href: `/commercial/commandes/${o.id}`,
          })),
        ],
      };
    case "caissier":
      return {
        metrics: [
          { label: "À encaisser", value: pay.length, tone: "warning" },
          { label: "Suspendues", value: susp.length, tone: susp.length ? "danger" : "default" },
        ],
        items: pay.map((i) => ({
          title: `Encaisser ${i.number}`,
          detail: formatDa(i.amount),
          href: `/caisse/encaissement/${i.id}`,
        })),
      };
    case "preparateur":
      return {
        metrics: [{ label: "À préparer", value: prep.length, tone: "warning" }],
        items: prep.map((o) => ({
          title: o.number,
          detail: `Préparation ${o.prepStatus} · paiement ${o.status}`,
          href: `/distribution/preparations/${o.id}`,
        })),
      };
    case "logistique":
      return {
        metrics: [{ label: "BL verrouillés", value: blLock.length, tone: blLock.length ? "danger" : "success" }],
        items: state.deliveryNotes.map((b) => ({
          title: b.number,
          detail: b.status === "verrouille" ? "Impayé — livraison interdite" : b.status,
          href: `/distribution/bl/${b.id}`,
        })),
      };
    case "comptabilite":
      return {
        metrics: [
          { label: "Brouillards à valider", value: drafts.length, tone: "warning" },
          { label: "Exclus Sage", value: state.drafts.filter((d) => d.status === "exclu").length, tone: "danger" },
        ],
        items: [
          { title: "Valider les brouillards", detail: "Hors factures suspendues", href: "/comptabilite/brouillards" },
          { title: "Export Sage 100", detail: "Manuel, pièces validées uniquement", href: "/comptabilite/export-sage" },
        ],
      };
    default:
      return { items: [], metrics: [] };
  }
}
