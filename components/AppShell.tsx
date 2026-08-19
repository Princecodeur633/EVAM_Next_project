"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { breadcrumbs, flattenNav, navForRole, ROLE_HOME } from "@/lib/nav";
import { ROLE_PROFILES } from "@/lib/roles";
import { ROLE_LABEL } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ACCENT_CLASS, ACCENT_SOFT, NAV_ICONS, ROLE_ICONS } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, currentUser, dispatch } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [jump, setJump] = useState(false);
  const [query, setQuery] = useState("");

  if (!currentUser) return null;

  const profile = ROLE_PROFILES[currentUser.role];
  const groups = navForRole(currentUser.role);
  const crumbs = breadcrumbs(pathname);
  const IconRole = ROLE_ICONS[profile.icon];

  const notifs = [
    state.ofList.some((o) => o.status === "fin_production") && {
      text: "Lot en attente de clôture qualité",
      href: "/production/qualite",
    },
    state.invoices.some((i) => i.status === "suspendue") && {
      text: "Facture suspendue — non exportable Sage",
      href: "/caisse/suspendues",
    },
    state.stock.some((s) => s.articleType === "matiere" && s.qty < 200) && {
      text: "Alerte seuil matières",
      href: "/stocks/alertes",
    },
  ].filter(Boolean) as { text: string; href: string }[];

  const jumpItems = flattenNav(currentUser.role).filter(
    (i) =>
      !query ||
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      (i.hint ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-[248px] shrink-0 bg-sidebar text-sidebar-text flex flex-col h-screen sticky top-0">
        <Link href="/accueil" className="h-[72px] px-4 flex items-center gap-3 border-b border-white/10">
          <span className="h-9 w-9 rounded-[8px] bg-white/10 text-white flex items-center justify-center text-[13px] font-semibold tracking-widest">
            EV
          </span>
          <span>
            <span className="block text-white text-[15px] font-semibold tracking-[0.18em] leading-none">EVAM</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-white/40 mt-1">Gestion intégrée</span>
          </span>
        </Link>

        <div className="px-3 py-3 border-b border-white/10">
            <div className="rounded-[8px] px-3 py-2.5 bg-white/5">
            <div className="flex items-center gap-2">
              <span className={cn("h-7 w-7 rounded-[6px] flex items-center justify-center text-white", ACCENT_CLASS[profile.accent])}>
                <IconRole size={14} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-white text-[12px] font-medium truncate">{profile.label}</p>
                <p className="text-[11px] text-white/45 truncate">{profile.station}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {groups.map((g) => {
            const GIcon = NAV_ICONS[g.icon] ?? HomeFallback;
            return (
              <div key={g.id} className="mb-3">
                <p className="px-3 mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
                  <GIcon size={11} strokeWidth={1.75} />
                  {g.label}
                </p>
                {g.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/accueil" && item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.hint}
                      className={cn(
                        "block mx-1 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors duration-150",
                        active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <p className="px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white/25 border-t border-white/10">
          Maquette V1 · 2026
        </p>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-line flex items-center justify-between px-5 sticky top-0 z-30">
          <nav className="flex items-center gap-1.5 text-[12px] text-muted min-w-0">
            {crumbs.map((c, i) => (
              <span key={c.href + i} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <span className="text-line-strong">/</span>}
                <Link href={c.href} className={cn("truncate hover:text-ink", i === crumbs.length - 1 && "text-ink font-medium")}>
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setJump(true)}
              className="hidden md:flex items-center gap-2 h-8 px-3 border border-line rounded-[6px] text-[12px] text-muted hover:border-line-strong"
            >
              <Search size={13} strokeWidth={1.75} />
              Aller à…
              <kbd className="text-[10px] border border-line rounded px-1">Ctrl K</kbd>
            </button>

            <select
              value={state.depotId}
              onChange={(e) => dispatch({ type: "SET_DEPOT", depotId: e.target.value })}
              className="h-8 border border-line rounded-[6px] px-2 text-[12px] text-ink bg-white"
            >
              {state.depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} · {d.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <button
                onClick={() => {
                  setOpenNotif(!openNotif);
                  setOpenUser(false);
                }}
                className="h-8 w-8 flex items-center justify-center border border-line rounded-[6px] text-muted hover:text-ink"
              >
                <Bell size={15} strokeWidth={1.5} />
                {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-danger rounded-full" />}
              </button>
              {openNotif && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-line rounded-[8px] z-40 overflow-hidden">
                  <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted border-b border-line">Alertes métier</p>
                  {notifs.length === 0 ? (
                    <p className="text-[12px] text-muted px-3 py-4">Aucune alerte</p>
                  ) : (
                    notifs.map((n) => (
                      <Link
                        key={n.text}
                        href={n.href}
                        onClick={() => setOpenNotif(false)}
                        className="block text-[12px] px-3 py-2.5 border-b border-line last:border-0 hover:bg-primary-soft"
                      >
                        {n.text}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setOpenUser(!openUser);
                  setOpenNotif(false);
                }}
                className="h-8 pl-1 pr-2 flex items-center gap-2 border border-line rounded-[6px] hover:border-line-strong"
              >
                <span className={cn("h-6 w-6 rounded-[5px] text-white text-[10px] flex items-center justify-center font-medium", ACCENT_CLASS[profile.accent])}>
                  {currentUser.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span className="text-[12px] text-ink hidden lg:block max-w-[140px] truncate">{currentUser.name}</span>
                <ChevronDown size={12} className="text-muted" />
              </button>
              {openUser && (
                <div className="absolute right-0 top-10 w-[340px] bg-white border border-line rounded-[8px] z-40 overflow-hidden">
                  <div className="px-3 py-3 border-b border-line">
                    <p className="text-[13px] font-medium">{currentUser.name}</p>
                    <p className={cn("inline-flex mt-1 text-[11px] px-2 py-0.5 rounded-[4px]", ACCENT_SOFT[profile.accent])}>
                      {profile.label}
                    </p>
                    <p className="text-[12px] text-muted mt-2 leading-relaxed">{profile.mission}</p>
                  </div>
                  <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Changer de poste (démo)</p>
                  <div className="max-h-64 overflow-y-auto">
                    {state.users.map((u) => {
                      const p = ROLE_PROFILES[u.role];
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            dispatch({ type: "SWITCH_ROLE_USER", userId: u.id });
                            setOpenUser(false);
                            router.push(ROLE_HOME[u.role]);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-primary-soft border-b border-line last:border-0",
                            u.id === currentUser.id && "bg-primary-soft/70",
                          )}
                        >
                          <span className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0", ACCENT_CLASS[p.accent])} />
                          <span>
                            <span className="block text-[12px] font-medium">{u.name}</span>
                            <span className="block text-[11px] text-muted">{ROLE_LABEL[u.role]} · {p.station}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-muted hover:text-ink border-t border-line"
                    onClick={() => {
                      dispatch({ type: "LOGOUT" });
                      router.push("/login");
                    }}
                  >
                    <LogOut size={13} /> Quitter la session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-line px-5 py-2 flex items-center gap-3">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ACCENT_CLASS[profile.accent])} />
          <p className="text-[12.5px] text-muted leading-snug">
            <span className="text-ink font-medium">{profile.label}.</span> {profile.posture}
          </p>
        </div>

        <main className="p-6 lg:p-7">{children}</main>
      </div>

      {jump && (
        <JumpModal
          query={query}
          setQuery={setQuery}
          items={jumpItems}
          onClose={() => {
            setJump(false);
            setQuery("");
          }}
          onPick={(href) => {
            router.push(href);
            setJump(false);
            setQuery("");
          }}
        />
      )}
      <KShortcut onOpen={() => setJump(true)} />
    </div>
  );
}

function HomeFallback(props: { size?: number; strokeWidth?: number }) {
  return <span style={{ width: props.size, height: props.size }} />;
}

function KShortcut({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
  return null;
}

function JumpModal({
  query,
  setQuery,
  items,
  onClose,
  onPick,
}: {
  query: string;
  setQuery: (v: string) => void;
  items: { href: string; label: string; hint?: string; group: string }[];
  onClose: () => void;
  onPick: (href: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const shown = useMemo(() => items.slice(0, 12), [items]);
  return (
    <div className="fixed inset-0 z-50 bg-ink/30 flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-[10px] border border-line overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 border-b border-line">
          <Search size={15} className="text-muted" />
          <input
            ref={ref}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un écran de votre poste…"
            className="h-11 flex-1 outline-none text-[14px]"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {shown.map((i) => (
            <li key={i.href}>
              <button
                onClick={() => onPick(i.href)}
                className="w-full text-left px-3 py-2.5 hover:bg-primary-soft flex items-baseline justify-between gap-3"
              >
                <span>
                  <span className="block text-[13px] font-medium">{i.label}</span>
                  {i.hint && <span className="block text-[11px] text-muted">{i.hint}</span>}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted">{i.group}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-3 py-6 text-[13px] text-muted">Aucun écran pour ce poste.</li>}
        </ul>
      </div>
    </div>
  );
}
