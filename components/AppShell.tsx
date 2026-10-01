"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Circle, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { activeNavHref, BOTTOM_NAV_ROLES, breadcrumbs, canAccess, flattenNav, navForRole } from "@/lib/nav";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { actions } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { BrandLogo } from "./BrandLogo";
import { HubTabs } from "./HubTabs";
import { ACCENT_CLASS, ACCENT_SOFT, ITEM_ICONS, LABEL_ICONS, NAV_ICONS, ROLE_ICONS } from "./icons";

/** Écran où ouvrir une notification, selon le document qui l'a générée
 * (apps/core/notifications.py:REGLES_STATUT) — absent de la liste : non cliquable. */
const ROUTE_PAR_DOCUMENT: Record<string, string | string[]> = {
  "caisse.decaissement": "/caisse/decaissements",
  "production.demandematiere": "/production/demandes-matieres",
  "production.demandecomplementaire": "/production/demandes-matieres",
  "achats.demandeachat": "/approvisionnement/demandes",
  "achats.commandefournisseur": "/approvisionnement/commandes",
  "commercial.commande": "/commercial/commandes",
  // Caissier → encaissement, Commercial → facturation : le premier écran accessible l’emporte.
  "commercial.facture": ["/caisse", "/commercial/facturation"],
  "distribution.preparationlivraison": "/distribution/preparations",
  "distribution.bonlivraison": "/distribution/bl",
  "qualite.lot": "/production/qualite",
  "referentiel.fichetechnique": "/parametrage/fiches-techniques",
  "production.ordrefabrication": "/production/of",
};

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
  const [railOpen, setRailOpen] = useState(false);
  const railTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [nonLues, setNonLues] = useState(0);

  useEffect(() => {
    let annule = false;
    const rafraichir = () => {
      void actions.notifications().then((items) => {
        if (!annule) setNotifications(items);
      });
      void actions.notificationsNonLues().then(({ non_lues }) => {
        if (!annule) setNonLues(non_lues);
      });
    };
    rafraichir();
    const intervalle = setInterval(rafraichir, 45_000);
    return () => {
      annule = true;
      clearInterval(intervalle);
    };
  }, []);

  // Petits délais : évite d'ouvrir la barre quand le curseur ne fait que la traverser.
  const openRail = () => {
    if (railTimer.current) clearTimeout(railTimer.current);
    railTimer.current = setTimeout(() => setRailOpen(true), 90);
  };
  const closeRail = () => {
    if (railTimer.current) clearTimeout(railTimer.current);
    railTimer.current = setTimeout(() => setRailOpen(false), 180);
  };

  useEffect(
    () => () => {
      if (railTimer.current) clearTimeout(railTimer.current);
    },
    [],
  );

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
  const activeHref = activeNavHref(pathname, flattenNav(currentUser.role));
  const bottomNav = BOTTOM_NAV_ROLES.includes(currentUser.role);
  const showDepot = ["MAGASINIER", "RESPONSABLE_PRODUCTION", "RESPONSABLE_ACHATS", "AGENT_PRODUCTION", "RESPONSABLE_QUALITE", "RESPONSABLE_DISTRIBUTION"].includes(
    currentUser.role,
  );

  const ouvrirNotification = (n: AppNotification) => {
    if (!n.lue) {
      void actions.marquerNotificationLue(n.id);
      setNotifications((items) => items.map((i) => (i.id === n.id ? { ...i, lue: true } : i)));
      setNonLues((v) => Math.max(0, v - 1));
    }
    const cibles = ROUTE_PAR_DOCUMENT[n.type_document];
    const href = (Array.isArray(cibles) ? cibles : cibles ? [cibles] : []).find((h) => canAccess(currentUser.role, h));
    if (href) {
      router.push(href);
      setOpenNotif(false);
    }
  };
  const toutMarquerLu = () => {
    void actions.marquerToutesNotificationsLues();
    setNotifications((items) => items.map((i) => ({ ...i, lue: true })));
    setNonLues(0);
  };

  const jumpItems = flattenNav(currentUser.role).filter(
    (i) =>
      !query ||
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      (i.hint ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const itemIcon = (item: { href: string; label: string }) => LABEL_ICONS[item.label] ?? ITEM_ICONS[item.href] ?? Circle;
  const fade = (collapsed: boolean) =>
    cn("truncate transition-opacity duration-200", collapsed ? "opacity-0" : "opacity-100 delay-75");

  const renderSidebar = (collapsed = false) => (
    <>
      <Link
        href="/accueil"
        className="h-[72px] shrink-0 px-3 flex items-center border-b border-white/10 overflow-hidden"
        onClick={() => setNavOpen(false)}
      >
        <BrandLogo
          size="md"
          priority
          className={cn("max-h-10 transition-[width] duration-300", collapsed ? "w-10" : "w-auto")}
        />
      </Link>

      <div className="px-2 py-3 border-b border-white/10">
        <div
          className={cn(
            "rounded-[9px] px-[7px] py-2 border transition-colors duration-200",
            collapsed ? "bg-transparent border-transparent" : "bg-white/5 border-white/5",
          )}
          title={collapsed ? `${profile.label} · ${profile.station}` : undefined}
        >
          <div className="flex items-center gap-2.5">
            <span className={cn("h-8 w-8 shrink-0 rounded-[7px] flex items-center justify-center text-white", ACCENT_CLASS[profile.accent])}>
              <IconRole size={15} strokeWidth={1.75} />
            </span>
            <div className={cn("min-w-0", fade(collapsed))}>
              <p className="text-white text-[12.5px] font-semibold truncate">{profile.label}</p>
              <p className="text-[11px] text-white/45 truncate">{profile.station}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className={cn("flex-1 py-3 px-2 overscroll-contain overflow-x-hidden", collapsed ? "overflow-y-hidden" : "overflow-y-auto")}>
        {groups.map((g) => {
          const GIcon = NAV_ICONS[g.icon] ?? HomeFallback;
          return (
            <div key={g.id} className="mb-3.5">
              <div className="relative h-[15px] mb-1.5">
                <p
                  className={cn(
                    "absolute inset-0 px-3 flex items-center gap-2 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-white/35 font-medium",
                    fade(collapsed),
                  )}
                >
                  <GIcon size={11} strokeWidth={1.75} className="shrink-0" />
                  {g.label}
                </p>
                <span
                  className={cn(
                    "absolute left-[14px] top-1/2 h-px w-5 bg-white/15 transition-opacity duration-200",
                    collapsed ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
              {g.items.map((item) => {
                const ItemIcon = itemIcon(item);
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={collapsed ? item.label : item.hint}
                    onClick={() => setNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 mx-1 px-3 py-[8px] rounded-[7px] text-[13px] whitespace-nowrap transition-all duration-150",
                      active
                        ? "bg-white/12 text-white font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "hover:bg-white/6 hover:text-white text-white/75",
                    )}
                  >
                    <ItemIcon size={16} strokeWidth={1.75} className="shrink-0" />
                    <span className={fade(collapsed)}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <p className={cn("px-4 py-3 text-[11px] text-white/30 border-t border-white/10 whitespace-nowrap", fade(collapsed))}>
        Eau · Jus · Yaourts
      </p>
    </>
  );

  return (
    <div className="min-h-dvh flex bg-bg">
      {/* Barre latérale bureau : repliée (icônes), dépliée au survol. L'espace réservé suit la même
          animation que la barre, donc le contenu se décale et se redimensionne avec elle. */}
      <div
        aria-hidden
        className={cn(
          "hidden lg:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          railOpen ? "w-[252px]" : "w-16",
        )}
      />
      <aside
        onMouseEnter={openRail}
        onMouseLeave={closeRail}
        onFocus={openRail}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeRail();
        }}
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-40 h-dvh bg-sidebar text-sidebar-text flex-col overflow-hidden border-r border-white/5",
          "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          railOpen ? "w-[252px]" : "w-16",
        )}
      >
        {renderSidebar(!railOpen)}
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
              className={cn("lg:hidden h-8 w-8 shrink-0 flex items-center justify-center border border-line rounded-[7px] text-muted hover:text-ink bg-surface", bottomNav && "hidden")}
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
                {nonLues > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-danger rounded-full" />}
              </button>
              {openNotif && (
                <div className="absolute right-0 top-10 w-[min(22rem,calc(100vw-1rem))] bg-surface border border-line rounded-[10px] z-40 overflow-hidden shadow-[var(--shadow)]">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-line bg-surface-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      Notifications{nonLues > 0 ? ` (${nonLues})` : ""}
                    </p>
                    {nonLues > 0 && (
                      <button className="text-[11px] text-primary font-medium" onClick={toutMarquerLu}>
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-[22rem] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[12px] text-muted px-3 py-4">Aucune notification</p>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => ouvrirNotification(n)}
                          className={cn(
                            "w-full text-left text-[12px] px-3 py-2.5 border-b border-line last:border-0 hover:bg-primary-soft",
                            !n.lue && "bg-primary-soft/40",
                          )}
                        >
                          <span className={cn("block", !n.lue && "font-medium")}>{n.titre}</span>
                          {n.message && <span className="block text-muted mt-0.5">{n.message}</span>}
                        </button>
                      ))
                    )}
                  </div>
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

        <main
          className={cn(
            "p-3 sm:p-6 lg:p-8 relative min-w-0",
            bottomNav ? "pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-8" : "pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
        >
          <div className="relative min-w-0 max-w-full">
            <HubTabs pathname={pathname} role={currentUser.role} />
            {children}
          </div>
        </main>

        {/* Barre basse (mobile) des postes de saisie terrain */}
        {bottomNav && (
          <nav
            aria-label="Navigation principale"
            className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]"
          >
            <ul className="flex">
              {groups.flatMap((g) => g.items).map((item) => {
                const ItemIcon = itemIcon(item);
                const active = item.href === activeHref;
                return (
                  <li key={item.href} className="flex-1">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("h-16 flex flex-col items-center justify-center gap-1 text-[11.5px] font-medium transition-colors", active ? "text-primary" : "text-muted hover:text-ink")}
                    >
                      <span className={cn("h-7 w-12 rounded-full flex items-center justify-center transition-colors", active && "bg-primary-soft")}>
                        <ItemIcon size={19} strokeWidth={active ? 2.1 : 1.75} />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
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
