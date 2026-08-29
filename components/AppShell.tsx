"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { breadcrumbs, canAccess, flattenNav, isNavActive, navForRole } from "@/lib/nav";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import { ACCENT_CLASS, ACCENT_SOFT, NAV_ICONS, ROLE_ICONS } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, currentUser, dispatch } = useStore();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [jump, setJump] = useState(false);
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
    setOpenNotif(false);
    setOpenUser(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  if (!currentUser) return null;

  const profile = ROLE_PROFILES[currentUser.role];
  const groups = navForRole(currentUser.role);
  const crumbs = breadcrumbs(pathname);
  const IconRole = ROLE_ICONS[profile.icon];
  const allHrefs = flattenNav(currentUser.role).map((i) => i.href);
  const showDepot = ["MAGASINIER", "RESPONSABLE_PRODUCTION", "RESPONSABLE_ACHATS", "AGENT_PRODUCTION", "RESPONSABLE_QUALITE", "RESPONSABLE_DISTRIBUTION"].includes(
    currentUser.role,
  );

  const notifs = (
    [
      state.lots.some((l) => l.statut === "EN_ATTENTE") && {
        text: `${state.lots.filter((l) => l.statut === "EN_ATTENTE").length} lot(s) en attente de contrôle`,
        href: "/production/qualite",
      },
      state.factures.some((i) => i.statut === "EMISE") && {
        text: `${state.factures.filter((i) => i.statut === "EMISE").length} facture(s) émise(s) à encaisser`,
        href: "/caisse",
      },
      state.demandesAchat.some((d) => d.statut === "EN_ATTENTE") && {
        text: `${state.demandesAchat.filter((d) => d.statut === "EN_ATTENTE").length} demande(s) d'achat en attente`,
        href: "/approvisionnement/demandes",
      },
    ].filter(Boolean) as { text: string; href: string }[]
  ).filter((n) => canAccess(currentUser.role, n.href));

  const jumpItems = flattenNav(currentUser.role).filter(
    (i) =>
      !query ||
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      (i.hint ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const renderSidebar = () => (
    <>
      <Link href="/accueil" className="h-[72px] px-3 sm:px-4 flex items-center gap-3 border-b border-white/10" onClick={() => setNavOpen(false)}>
        <BrandLogo size="md" className="max-h-10 w-auto" priority />
      </Link>

      <div className="px-3 py-3 border-b border-white/10">
        <div className="rounded-[9px] px-3 py-2.5 bg-white/5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <span className={cn("h-8 w-8 rounded-[7px] flex items-center justify-center text-white", ACCENT_CLASS[profile.accent])}>
              <IconRole size={15} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-white text-[12.5px] font-semibold truncate">{profile.label}</p>
              <p className="text-[11px] text-white/45 truncate">{profile.station}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 overscroll-contain">
        {groups.map((g) => {
          const GIcon = NAV_ICONS[g.icon] ?? HomeFallback;
          return (
            <div key={g.id} className="mb-3.5">
              <p className="px-3 mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/35 font-medium">
                <GIcon size={11} strokeWidth={1.75} />
                {g.label}
              </p>
              {g.items.map((item) => {
                const active = isNavActive(pathname, item.href, allHrefs);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.hint}
                    onClick={() => setNavOpen(false)}
                    className={cn(
                      "block mx-1 px-3 py-[8px] rounded-[7px] text-[13px] transition-all duration-150",
                      active
                        ? "bg-white/12 text-white font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "hover:bg-white/6 hover:text-white text-white/75",
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
      <p className="px-4 py-3 text-[11px] text-white/30 border-t border-white/10">Eau · Jus · Yaourts</p>
    </>
  );

  return (
    <div className="min-h-dvh flex bg-bg">
      <aside className="hidden lg:flex w-[252px] shrink-0 bg-sidebar text-sidebar-text flex-col h-dvh sticky top-0 border-r border-white/5">
        {renderSidebar()}
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={() => setNavOpen(false)}
          />
          <aside className="relative h-full w-[min(280px,88vw)] bg-sidebar text-sidebar-text flex flex-col shadow-[var(--shadow)]">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="absolute top-3.5 right-3 h-8 w-8 flex items-center justify-center rounded-[7px] text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
            {renderSidebar()}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-surface/90 backdrop-blur-md border-b border-line flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-5 sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <button
              type="button"
              className="lg:hidden h-8 w-8 shrink-0 flex items-center justify-center border border-line rounded-[7px] text-muted hover:text-ink bg-surface"
              onClick={() => setNavOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={16} strokeWidth={1.75} />
            </button>
            <nav className="flex items-center gap-1.5 text-[12px] text-muted min-w-0 overflow-hidden">
              {crumbs.map((c, i) => (
                <span key={c.href + i} className={cn("flex items-center gap-1.5 min-w-0", i < crumbs.length - 1 && "hidden sm:flex")}>
                  {i > 0 && <span className="text-line-strong hidden sm:inline">/</span>}
                  {canAccess(currentUser.role, c.href) ? (
                    <Link
                      href={c.href}
                      className={cn("truncate hover:text-ink", i === crumbs.length - 1 && "text-ink font-medium")}
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className={cn("truncate", i === crumbs.length - 1 && "text-ink font-medium")}>{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setJump(true)}
              className="hidden md:flex items-center gap-2 h-8 px-3 border border-line rounded-[7px] text-[12px] text-muted hover:border-line-strong hover:text-ink bg-surface"
            >
              <Search size={13} strokeWidth={1.75} />
              Aller à…
              <kbd className="text-[10px] border border-line rounded px-1 bg-surface-2">Ctrl K</kbd>
            </button>
            <button
              onClick={() => setJump(true)}
              className="md:hidden h-8 w-8 flex items-center justify-center border border-line rounded-[7px] text-muted hover:text-ink bg-surface"
              aria-label="Rechercher un écran"
            >
              <Search size={14} strokeWidth={1.75} />
            </button>

            {showDepot && state.depots.length > 0 && (
              <select
                value={state.depotId ?? ""}
                onChange={(e) => dispatch({ type: "SET_DEPOT", depotId: Number(e.target.value) })}
                className="hidden sm:block h-8 max-w-[12rem] border border-line rounded-[7px] px-2 text-[12px] text-ink bg-surface truncate"
                aria-label="Dépôt actif"
              >
                {state.depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={toggle}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              className="hidden sm:flex h-8 w-8 items-center justify-center border border-line rounded-[7px] text-muted hover:text-ink hover:border-line-strong bg-surface transition-colors"
            >
              {theme === "dark" ? <Sun size={14} strokeWidth={1.7} /> : <Moon size={14} strokeWidth={1.7} />}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setOpenNotif(!openNotif);
                  setOpenUser(false);
                }}
                className="h-8 w-8 flex items-center justify-center border border-line rounded-[7px] text-muted hover:text-ink bg-surface"
              >
                <Bell size={15} strokeWidth={1.5} />
                {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-danger rounded-full" />}
              </button>
              {openNotif && (
                <div className="absolute right-0 top-10 w-[min(20rem,calc(100vw-1rem))] bg-surface border border-line rounded-[10px] z-40 overflow-hidden shadow-[var(--shadow)]">
                  <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted border-b border-line bg-surface-2">Alertes</p>
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
                className="h-8 pl-1 pr-1.5 sm:pr-2 flex items-center gap-2 border border-line rounded-[7px] hover:border-line-strong bg-surface"
              >
                <span className={cn("h-6 w-6 rounded-[5px] text-white text-[10px] flex items-center justify-center font-semibold", ACCENT_CLASS[profile.accent])}>
                  {currentUser.name.split(" ").map((p) => p[0]).join("").slice(0, 2) || currentUser.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[12px] text-ink hidden lg:block max-w-[140px] truncate font-medium">{currentUser.name}</span>
                <ChevronDown size={12} className="text-muted hidden sm:block" />
              </button>
              {openUser && (
                <div className="absolute right-0 top-10 w-[min(280px,calc(100vw-1rem))] bg-surface border border-line rounded-[10px] z-40 overflow-hidden shadow-[var(--shadow)]">
                  <div className="px-4 py-3 border-b border-line bg-surface-2">
                    <p className="text-[13px] font-semibold break-words">{currentUser.name}</p>
                    <p className={cn("inline-flex mt-1.5 text-[11px] px-2 py-0.5 rounded-[4px]", ACCENT_SOFT[profile.accent])}>
                      {profile.label}
                    </p>
                  </div>
                  {showDepot && state.depots.length > 0 && (
                    <div className="sm:hidden px-4 py-2.5 border-b border-line">
                      <p className="text-[11px] uppercase tracking-wide text-muted mb-1.5">Dépôt</p>
                      <select
                        value={state.depotId ?? ""}
                        onChange={(e) => dispatch({ type: "SET_DEPOT", depotId: Number(e.target.value) })}
                        className="h-8 w-full border border-line rounded-[7px] px-2 text-[12px] text-ink bg-surface"
                      >
                        {state.depots.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    className="sm:hidden w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-muted hover:text-ink hover:bg-primary-soft border-b border-line"
                    onClick={() => {
                      toggle();
                      setOpenUser(false);
                    }}
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Mode clair" : "Mode sombre"}
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-muted hover:text-ink hover:bg-primary-soft"
                    onClick={() => {
                      dispatch({ type: "LOGOUT" });
                      router.push("/login");
                    }}
                  >
                    <LogOut size={14} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-6 lg:p-8 relative min-w-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="relative min-w-0 max-w-full">{children}</div>
        </main>
      </div>

      {state.lastError && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 sm:max-w-md bg-surface border border-danger/30 rounded-[10px] shadow-[var(--shadow)] overflow-hidden">
          <div className="flex">
            <span className="w-1 bg-danger shrink-0" />
            <div className="px-4 py-3 min-w-0">
              <p className="text-[12px] font-semibold text-danger">Action impossible</p>
              <p className="text-[13px] mt-1 leading-relaxed break-words">{state.lastError}</p>
              <button className="mt-2 text-[12px] text-primary font-medium" onClick={() => dispatch({ type: "CLEAR_ERROR" })}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-3 sm:px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-[12px] border border-line overflow-hidden shadow-[var(--shadow)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 border-b border-line bg-surface-2">
          <Search size={15} className="text-muted shrink-0" />
          <input
            ref={ref}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un écran…"
            className="h-11 flex-1 outline-none text-[14px] bg-transparent text-ink min-w-0"
          />
        </div>
        <ul className="max-h-[min(20rem,60vh)] overflow-y-auto py-1">
          {shown.map((i) => (
            <li key={i.href}>
              <button
                onClick={() => onPick(i.href)}
                className="w-full text-left px-3 py-2.5 hover:bg-primary-soft flex items-baseline justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{i.label}</span>
                  {i.hint && <span className="block text-[11px] text-muted truncate">{i.hint}</span>}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted shrink-0 hidden sm:inline">{i.group}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-3 py-6 text-[13px] text-muted">Aucun écran pour ce poste.</li>}
        </ul>
      </div>
    </div>
  );
}
