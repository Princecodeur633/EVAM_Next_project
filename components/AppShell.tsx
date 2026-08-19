"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { navForRole, ROLE_HOME } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, currentUser, dispatch } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser) return null;

  const groups = navForRole(currentUser.role);
  const notifs = [
    state.ofList.some((o) => o.status === "fin_production") && "Lot en attente de clôture qualité",
    state.invoices.some((i) => i.status === "suspendue") && "Facture suspendue — non exportable",
    state.stock.some((s) => s.articleType === "matiere" && s.qty < 200) && "Alerte seuil matières",
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-[264px] shrink-0 bg-sidebar text-sidebar-text flex flex-col min-h-screen sticky top-0">
        <div className="h-14 px-5 flex items-center border-b border-white/10">
          <Link href={ROLE_HOME[currentUser.role]} className="flex items-baseline gap-2">
            <span className="text-white text-[18px] font-semibold tracking-[0.18em]">EVAM</span>
            <span className="text-[10px] uppercase tracking-widest text-white/50">ERP</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {groups.map((g) => (
            <div key={g.id} className="mb-4">
              <p className="px-3 mb-1 text-[10px] uppercase tracking-[0.16em] text-white/35">{g.label}</p>
              {g.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-[6px] rounded-[4px] text-[13px]",
                      active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 text-[11px] text-white/40">
          Maquette UI · V1 · 2026
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-line flex items-center justify-between px-5 sticky top-0 z-20">
          <div className="flex items-center gap-4 text-[13px]">
            <label className="flex items-center gap-2 text-muted">
              Dépôt
              <select
                value={state.depotId}
                onChange={(e) => dispatch({ type: "SET_DEPOT", depotId: e.target.value })}
                className="h-8 border border-line-strong rounded-[6px] px-2 text-ink bg-white"
              >
                {state.depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-line-strong">|</span>
            <span className="text-muted">{state.settings.company}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="h-8 w-8 flex items-center justify-center border border-line rounded-[6px] text-muted">
                <Bell size={16} strokeWidth={1.5} />
                {notifs.length > 0 && <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-danger rounded-full" />}
              </button>
              <div className="hidden group-hover:block absolute right-0 top-9 w-80 bg-white border border-line rounded-[6px] p-2 z-30">
                {notifs.length === 0 ? (
                  <p className="text-[12px] text-muted px-2 py-3">Aucune alerte</p>
                ) : (
                  notifs.map((n) => (
                    <p key={n} className="text-[12px] px-2 py-1.5 border-b border-line last:border-0">
                      {n}
                    </p>
                  ))
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[12px] text-muted">
              Profil démo
              <span className="relative">
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    dispatch({ type: "SWITCH_ROLE_USER", userId: e.target.value });
                    const u = state.users.find((x) => x.id === e.target.value);
                    if (u) router.push(ROLE_HOME[u.role]);
                  }}
                  className="h-8 appearance-none pr-7 pl-2 border border-line-strong rounded-[6px] text-ink bg-white"
                >
                  {state.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {ROLE_LABEL[u.role]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2 pointer-events-none text-muted" />
              </span>
            </label>

            <Button
              variant="ghost"
              onClick={() => {
                dispatch({ type: "LOGOUT" });
                router.push("/login");
              }}
            >
              <LogOut size={14} strokeWidth={1.5} />
              Sortir
            </Button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
