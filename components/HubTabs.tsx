"use client";

import Link from "next/link";
import { activeHub, canAccess } from "@/lib/nav";
import type { Profil } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ITEM_ICONS } from "./icons";
import { Tabs } from "./Tabs";

/** En-tête commun des hubs (Supervision, Référentiel…) : titre, onglets, puis sous-onglets éventuels. */
export function HubTabs({ pathname, role }: { pathname: string; role: Profil }) {
  const hub = activeHub(pathname, role);
  if (!hub) return null;
  const { item, tab, sub } = hub;
  const tabs = item.hub!.filter((t) => (t.items ?? [t]).some((i) => canAccess(role, i.href)));
  const subs = (tab.items ?? []).filter((i) => canAccess(role, i.href));

  return (
    <div className="mb-5 anim-in">
      <h1 className="text-[20px] sm:text-[24px] leading-tight font-semibold tracking-tight">{item.label}</h1>
      {item.hint && <p className="text-[13px] text-muted mt-1">{item.hint}</p>}
      <Tabs
        label={item.label}
        className="mt-3"
        value={tab.href}
        items={tabs.map((t) => {
          const first = (t.items ?? [t]).find((i) => canAccess(role, i.href)) ?? t;
          return { value: t.href, href: first.href, label: t.label, icon: ITEM_ICONS[t.href] };
        })}
      />
      {subs.length > 1 && (
        <nav className="flex flex-wrap gap-1.5 mt-3" aria-label={`${tab.label} : écrans`}>
          {subs.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={sub?.href === i.href ? "page" : undefined}
              className={cn(
                "h-7 px-3 inline-flex items-center rounded-full text-[12px] font-medium border transition-colors",
                sub?.href === i.href ? "bg-primary text-white border-primary" : "bg-surface text-muted border-line hover:text-ink hover:border-line-strong",
              )}
            >
              {i.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
