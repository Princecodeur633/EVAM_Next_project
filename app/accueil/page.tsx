"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/charts";
import { canAccess, flattenNav } from "@/lib/nav";
import { ROLE_PROFILES } from "@/lib/roles";
import type { AppState, Profil } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn, formatQty, num } from "@/lib/utils";
import { ACCENT_CLASS, ROLE_ICONS } from "@/components/icons";
import { Panel } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { STATUT_OF_LABEL, STATUT_PREP_LABEL, TYPE_ANOMALIE_LABEL } from "@/lib/labels";

export default function AccueilPage() {
  const { state, currentUser, articleName } = useStore();
  if (!currentUser) return null;
  const profile = ROLE_PROFILES[currentUser.role];
  const Icon = ROLE_ICONS[profile.icon];
  const shortcuts = flattenNav(currentUser.role).filter((i) => i.href !== "/accueil");
  const tasks = tasksForRole(currentUser.role, state, articleName);
  const visibleTasks = tasks.items.filter((t) => canAccess(currentUser.role, t.href));

  return (
    <div className="space-y-6 anim-in max-w-[1100px]">
      <section className="evam-card overflow-hidden">
        <div className={cn("h-1", ACCENT_CLASS[profile.accent])} />
        <div className="p-6 flex items-start gap-4">
          <span className={cn("h-11 w-11 rounded-[9px] text-white flex items-center justify-center shrink-0", ACCENT_CLASS[profile.accent])}>
            <Icon size={20} strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{profile.station}</p>
            <h1 className="text-[24px] font-semibold tracking-tight mt-0.5">Bonjour{currentUser.name ? `, ${currentUser.name.split(" ")[0]}` : ""}</h1>
            <p className="text-[13px] text-muted mt-1">{profile.label} · {profile.mission}</p>
          </div>
        </div>
      </section>

      {tasks.metrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tasks.metrics.map((m) => (
            <KpiCard key={m.label} label={m.label} value={m.value} hint={m.hint} tone={m.tone ?? "default"} />
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <Panel>
          <div className="px-5 py-3.5 border-b border-line bg-surface-2">
            <h2 className="text-[13px] font-semibold">À traiter aujourd’hui</h2>
          </div>
          {visibleTasks.length === 0 ? (
            <p className="px-5 py-10 text-[13px] text-muted">Rien en attente sur votre poste.</p>
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

        <Panel className="p-5">
          <h2 className="text-[13px] font-semibold mb-3">Accès rapides</h2>
          <ul className="space-y-0.5">
            {shortcuts.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="flex items-center justify-between gap-2 rounded-[7px] px-2.5 py-2 -mx-1 hover:bg-primary-soft">
                  <span className="text-[13px] font-medium">{s.label}</span>
                  <span className="text-[11px] text-muted truncate">{s.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function tasksForRole(role: Profil, state: AppState, articleName: (id: number) => string) {
  const ofOpen = state.ofList.filter((o) => o.statut !== "CLOTURE");
  const lotsWait = state.lots.filter((l) => l.statut === "EN_ATTENTE");
  const daWait = state.demandesAchat.filter((d) => d.statut === "EN_ATTENTE");
  const factEmise = state.factures.filter((f) => f.statut === "EMISE");
  const prep = state.preparations.filter((p) => p.statut === "A_PREPARER" || p.statut === "EN_PREPARATION");
  const stockSum = state.stock.reduce((a, s) => a + stockDisponible(s), 0);

  const metrics: { label: string; value: string | number; hint?: string; tone?: "default" | "warning" | "success" | "danger" }[] = [];
  const items: { href: string; title: string; detail: string }[] = [];

  if (["RESPONSABLE_PRODUCTION", "AGENT_PRODUCTION", "DIRECTION", "ADMIN_SI"].includes(role)) {
    metrics.push({ label: "OF ouverts", value: ofOpen.length });
    ofOpen.slice(0, 5).forEach((o) =>
      items.push({ href: `/production/of/${o.id}`, title: o.numero, detail: `${articleName(o.article)} · ${STATUT_OF_LABEL[o.statut]}` }),
    );
  }
  if (["RESPONSABLE_QUALITE", "DIRECTION"].includes(role)) {
    metrics.push({ label: "Lots en attente", value: lotsWait.length, tone: lotsWait.length ? "warning" : "success" });
    lotsWait.forEach((l) => items.push({ href: `/production/qualite/${l.id}`, title: l.numero_lot, detail: articleName(l.article) }));
  }
  if (["RESPONSABLE_ACHATS", "MAGASINIER"].includes(role)) {
    metrics.push({ label: "Demandes en attente", value: daWait.length, tone: daWait.length ? "warning" : "default" });
    daWait.forEach((d) => items.push({ href: "/approvisionnement/demandes", title: `Demande n°${d.id}`, detail: `${articleName(d.article)} · ${formatQty(num(d.quantite_demandee), 2)}` }));
  }
  if (["COMMERCIAL", "CAISSIER"].includes(role)) {
    metrics.push({ label: "Factures à encaisser", value: factEmise.length });
    factEmise.slice(0, 5).forEach((f) => items.push({ href: "/caisse", title: f.numero, detail: `Montant ${f.montant_total}` }));
  }
  if (["MAGASINIER", "RESPONSABLE_DISTRIBUTION", "CHAUFFEUR"].includes(role)) {
    metrics.push({ label: "Préparations", value: prep.length });
    prep.forEach((p) => items.push({ href: `/distribution/preparations/${p.id}`, title: `Préparation n°${p.id}`, detail: STATUT_PREP_LABEL[p.statut] }));
  }
  if (["DIRECTION", "MAGASINIER", "RESPONSABLE_ACHATS"].includes(role)) {
    metrics.push({ label: "Stock disponible", value: formatQty(stockSum, 1) });
  }
  if (role === "COMPTABILITE_DAF") {
    metrics.push({ label: "Anomalies", value: state.anomalies.filter((a) => a.statut === "DETECTEE").length, tone: "warning" });
    state.anomalies.slice(0, 5).forEach((a) => items.push({ href: "/comptabilite/brouillards", title: TYPE_ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie, detail: a.description }));
  }

  return { metrics, items };
}
