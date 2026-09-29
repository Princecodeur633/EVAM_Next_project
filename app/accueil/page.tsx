"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleSlash, Eye, EyeOff, Info, Landmark, Vault } from "lucide-react";
import { DonutChart, KpiCard } from "@/components/charts";
import { ACCENT_CLASS, ACCENT_SOFT, ITEM_ICONS, LABEL_ICONS, ROLE_ICONS } from "@/components/icons";
import { StatusBadge } from "@/components/ui";
import { homeForRole, type HomeCash, type HomeChart, type HomeSection } from "@/lib/home";
import { canAccess, flattenNav } from "@/lib/nav";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { cn, formatDa, num } from "@/lib/utils";

const TONE_CHIP: Record<string, string> = {
  neutral: "bg-surface-2 text-muted",
  info: "bg-primary-soft text-primary",
  teal: "bg-teal-soft text-teal",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export default function AccueilPage() {
  const { state, currentUser, articleName, clientName, userName } = useStore();
  if (!currentUser) return null;

  const role = currentUser.role;
  const profile = ROLE_PROFILES[role];
  const RoleIcon = ROLE_ICONS[profile.icon];
  const home = homeForRole(role, state, { meId: currentUser.id, articleName, clientName, userName });

  const allowed = (href: string) => canAccess(role, href);
  const actions = home.actions.filter((a) => allowed(a.href));
  const kpis = home.kpis.map((k) => ({ ...k, href: k.href && allowed(k.href) ? k.href : undefined }));
  const sections = home.sections
    .map((s) => ({ ...s, href: allowed(s.href) ? s.href : "", items: s.items.filter((i) => allowed(i.href)) }))
    // Une section vide et secondaire n’apporte rien : on ne garde que celles qui ont du contenu ou qui sont prioritaires.
    .filter((s, i) => s.total > 0 || s.tone === "warning" || s.tone === "danger" || i < 2);
  const pending = sections.filter((s) => s.tone === "warning" || s.tone === "danger").reduce((a, s) => a + s.total, 0);

  const seen = new Set<string>();
  const shortcuts = flattenNav(role).filter((i) => {
    if (i.href === "/accueil" || i.href === "/parametrage") return false;
    const key = i.href + i.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const now = new Date();
  const greeting = now.getHours() >= 18 ? "Bonsoir" : "Bonjour";
  const firstName = currentUser.name?.split(" ")[0];
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="space-y-5 anim-in max-w-[1440px]">
      {/* En-tête du poste */}
      <section className="evam-card relative overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0 w-1", ACCENT_CLASS[profile.accent])} />
        <div className="evam-grid-bg absolute inset-0 pointer-events-none opacity-60" />
        <div className="relative p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <span className={cn("h-11 w-11 sm:h-12 sm:w-12 rounded-[10px] text-white flex items-center justify-center shrink-0 shadow-sm", ACCENT_CLASS[profile.accent])}>
              <RoleIcon size={21} strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                <span className="first-letter:uppercase inline-block">{today}</span> · {profile.station}
              </p>
              <h1 className="text-[20px] sm:text-[24px] font-semibold tracking-tight mt-0.5 break-words">
                {greeting}
                {firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-[13px] text-muted mt-1 max-w-2xl">{profile.mission}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={cn("inline-flex text-[11px] px-2 py-0.5 rounded-[5px] font-medium", ACCENT_SOFT[profile.accent])}>{profile.label}</span>
                {pending > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-[5px] font-medium bg-warning-soft text-warning">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                    {pending} élément{pending > 1 ? "s" : ""} à traiter
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-[5px] font-medium bg-success-soft text-success">
                    <CheckCircle2 size={12} /> Tout est à jour
                  </span>
                )}
              </div>
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
              {actions.map((a, i) => (
                <Link
                  key={a.href + a.label}
                  href={a.href}
                  className={cn(
                    "inline-flex flex-1 md:flex-initial items-center justify-center gap-2 h-9 px-3.5 text-[13px] font-medium rounded-[7px] transition-all duration-150 whitespace-nowrap",
                    i === 0
                      ? "bg-primary text-white hover:bg-primary-hover shadow-sm"
                      : "bg-surface text-ink border border-line-strong hover:bg-surface-2",
                  )}
                >
                  <a.icon size={15} strokeWidth={1.8} />
                  {a.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {home.cash && <CashStrip cash={home.cash} />}

      {/* Indicateurs clés */}
      <div className={cn("grid grid-cols-1 min-[420px]:grid-cols-2 gap-3", kpis.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
        {kpis.map((k) => {
          const card = (
            <KpiCard label={k.label} value={k.value} hint={k.hint} tone={k.tone ?? "default"} icon={<k.icon size={16} strokeWidth={1.75} />} />
          );
          return k.href ? (
            <Link
              key={k.label}
              href={k.href}
              className="block rounded-[10px] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {card}
            </Link>
          ) : (
            <div key={k.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* Files de travail */}
        <div className="grid md:grid-cols-2 gap-4 items-start">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}
        </div>

        {/* Colonne latérale */}
        <aside className="grid sm:grid-cols-2 xl:grid-cols-1 gap-4 items-start">
          {home.chart && <ChartCard chart={home.chart} href={home.chart.href && allowed(home.chart.href) ? home.chart.href : undefined} />}

          <div className="evam-card p-4">
            <h2 className="text-[13px] font-semibold mb-3">Accès rapides</h2>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((s) => {
                const Icon = LABEL_ICONS[s.label] ?? ITEM_ICONS[s.href] ?? ArrowUpRight;
                return (
                  <Link
                    key={s.href + s.label}
                    href={s.href}
                    title={s.hint}
                    className="group flex items-center gap-2 rounded-[8px] border border-line px-2.5 py-2 hover:border-primary/40 hover:bg-primary-soft transition-colors min-w-0"
                  >
                    <span className="h-7 w-7 shrink-0 rounded-[6px] bg-surface-2 text-muted group-hover:bg-surface group-hover:text-primary flex items-center justify-center transition-colors">
                      <Icon size={14} strokeWidth={1.75} />
                    </span>
                    <span className="text-[12px] font-medium leading-tight line-clamp-2 min-w-0">{s.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {(profile.rules.length > 0 || profile.never.length > 0) && (
            <div className="evam-card p-4">
              <h2 className="text-[13px] font-semibold mb-3">Repères du poste</h2>
              <ul className="space-y-2">
                {profile.rules.map((r) => (
                  <li key={r} className="flex gap-2 text-[12px] leading-snug">
                    <Info size={13} className="text-primary shrink-0 mt-[2px]" />
                    <span>{r}</span>
                  </li>
                ))}
                {profile.never.map((r) => (
                  <li key={r} className="flex gap-2 text-[12px] leading-snug text-muted">
                    <CircleSlash size={13} className="text-danger/70 shrink-0 mt-[2px]" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SectionCard({ section: s }: { section: HomeSection }) {
  const Icon = s.icon;
  const more = s.total - s.items.length;
  return (
    <section className="evam-card overflow-hidden flex flex-col min-w-0">
      <header className="px-4 py-3 border-b border-line flex items-center gap-2.5">
        <span className={cn("h-7 w-7 shrink-0 rounded-[7px] flex items-center justify-center", TONE_CHIP[s.total > 0 ? s.tone ?? "info" : "neutral"])}>
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <h2 className="text-[13px] font-semibold truncate flex-1 min-w-0">{s.title}</h2>
        <span className={cn("text-[11px] num font-semibold px-1.5 min-w-[22px] text-center py-0.5 rounded-[5px]", TONE_CHIP[s.total > 0 ? s.tone ?? "info" : "neutral"])}>
          {s.total}
        </span>
      </header>
      {s.items.length === 0 ? (
        <div className="px-4 py-7 flex flex-col items-center text-center gap-1.5">
          <CheckCircle2 size={20} className="text-success/70" />
          <p className="text-[12.5px] text-muted">{s.empty}</p>
        </div>
      ) : (
        <ul className="flex-1">
          {s.items.map((t) => (
            <li key={t.href + t.title} className="border-b border-line last:border-0">
              <Link href={t.href} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-primary-soft/60 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-[13px] font-medium truncate">{t.title}</p>
                    {t.badge && (
                      <span className="shrink-0">
                        <StatusBadge tone={t.badge.tone}>{t.badge.label}</StatusBadge>
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted mt-0.5 truncate">{t.detail}</p>
                </div>
                {t.meta && <span className="text-[11px] text-muted shrink-0 hidden sm:block num">{t.meta}</span>}
                <ArrowRight size={14} className="text-muted shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {s.href && (s.total > 0 || more > 0) && (
        <Link
          href={s.href}
          className="px-4 py-2.5 border-t border-line text-[12px] font-medium text-primary hover:bg-primary-soft/60 flex items-center justify-between gap-2 bg-surface-2/50"
        >
          {more > 0 ? `Voir les ${s.total}` : "Ouvrir l’écran"}
          <ArrowRight size={13} />
        </Link>
      )}
    </section>
  );
}

function ChartCard({ chart, href }: { chart: HomeChart; href?: string }) {
  const total = chart.data.reduce((a, d) => a + d.value, 0);
  const max = Math.max(...chart.data.map((d) => d.value), 1);
  return (
    <div className="evam-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold truncate">{chart.title}</h2>
          {chart.subtitle && <p className="text-[11.5px] text-muted mt-0.5">{chart.subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="text-muted hover:text-primary shrink-0 p-0.5" aria-label={`Ouvrir ${chart.title}`}>
            <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      <div className="p-4">
        {total === 0 ? (
          <p className="text-[12.5px] text-muted py-6 text-center">Pas encore de données.</p>
        ) : chart.kind === "donut" ? (
          <DonutChart data={chart.data} size={120} centerValue={String(total)} centerLabel={chart.centerLabel} />
        ) : (
          <ul className="space-y-2.5">
            {chart.data.slice(0, 8).map((d) => (
              <li key={d.label}>
                <div className="flex items-baseline justify-between gap-2 text-[12px] mb-1">
                  <span className="truncate text-muted">{d.label}</span>
                  <span className="num font-medium shrink-0">{d.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--chart-1)] transition-all duration-500" style={{ width: `${(d.value / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Solde de la caisse principale (consolidé de toutes les caisses) + détail par caisse. */
function CashStrip({ cash }: { cash: HomeCash }) {
  const [visible, setVisible] = useState(true);
  const { principale, maCaisse, session, caisses } = cash;
  const ouvertes = caisses.filter((c) => c.session_ouverte != null).length;
  const mask = (v: string | number | null | undefined) => (visible ? formatDa(num(v)) : "••••••");
  const monSolde = session ? session.solde_theorique_actuel ?? session.solde_ouverture : maCaisse?.solde_actuel;
  const autres = caisses.filter((c) => c.id !== maCaisse?.id);

  return (
    <section className="evam-card overflow-hidden grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="relative bg-sidebar text-white p-5 sm:p-6 overflow-hidden">
        <Landmark size={140} strokeWidth={1} className="absolute -right-6 -bottom-8 text-white/[0.06] pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-9 w-9 rounded-[8px] bg-white/10 flex items-center justify-center shrink-0">
              <Vault size={17} strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/55 font-medium">Caisse principale</p>
              <p className="text-[12px] text-white/70 truncate">{principale ? "Solde consolidé de toutes les caisses" : "Non disponible"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="h-8 w-8 shrink-0 rounded-[7px] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={visible ? "Masquer les montants" : "Afficher les montants"}
            title={visible ? "Masquer les montants" : "Afficher les montants"}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <p className="relative mt-4 text-[30px] sm:text-[38px] font-semibold num tracking-tight leading-none break-words">
          {principale ? mask(principale.solde_actuel) : "—"}
        </p>
        <p className="relative mt-3 text-[12px] text-white/60">
          {caisses.length} caisse{caisses.length > 1 ? "s" : ""} · {ouvertes} session{ouvertes > 1 ? "s" : ""} ouverte{ouvertes > 1 ? "s" : ""}
        </p>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-3 min-w-0">
        <div className="rounded-[9px] border border-primary/25 bg-primary-soft/50 px-3.5 py-3 flex items-center gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">Ma caisse</p>
            <p className="text-[13px] font-semibold truncate">{maCaisse?.nom ?? "Aucune caisse affectée"}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[17px] font-semibold num leading-none">{maCaisse ? mask(monSolde) : "—"}</p>
            <p className={cn("text-[11px] mt-1 font-medium", session ? "text-success" : "text-muted")}>{session ? "Session ouverte" : "Session fermée"}</p>
          </div>
        </div>
        {autres.length > 0 && (
          <ul className="divide-y divide-line">
            {autres.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 py-2 min-w-0">
                <span
                  className={cn("h-2 w-2 rounded-full shrink-0", c.session_ouverte != null ? "bg-success" : "bg-line-strong")}
                  title={c.session_ouverte != null ? "Session ouverte" : "Session fermée"}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium truncate">{c.nom}</p>
                  <p className="text-[11px] text-muted truncate">{c.caissier_nom ?? "Sans caissier"}</p>
                </div>
                <span className="text-[12.5px] num font-medium shrink-0">{mask(c.solde_actuel)}</span>
              </li>
            ))}
          </ul>
        )}
        {autres.length > 4 && <p className="text-[11px] text-muted">+ {autres.length - 4} autre(s) caisse(s)</p>}
      </div>
    </section>
  );
}
