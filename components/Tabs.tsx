"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string = string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
  /** Onglet lié à une route (hub de pages) plutôt qu’à un état local. */
  href?: string;
};

/** Barre d’onglets soulignée ; défile horizontalement sur mobile. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange?: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-line overflow-x-auto overscroll-x-contain", className)}>
      <nav className="flex gap-1 min-w-max" role="tablist" aria-label={label}>
        {items.map((t) => {
          const active = t.value === value;
          const Icon = t.icon;
          const inner = (
            <>
              {Icon && <Icon size={14} strokeWidth={1.8} className={active ? "text-primary" : "text-muted"} />}
              {t.label}
              {t.count != null && (
                <span className={cn("num text-[11px] px-1.5 rounded-[4px]", active ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted")}>{t.count}</span>
              )}
            </>
          );
          const cls = cn(
            "relative inline-flex items-center gap-2 h-10 px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
            "after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:transition-colors",
            active ? "text-ink after:bg-primary" : "text-muted hover:text-ink after:bg-transparent",
          );
          return t.href ? (
            <Link key={t.value} href={t.href} role="tab" aria-selected={active} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={t.value} type="button" role="tab" aria-selected={active} onClick={() => onChange?.(t.value)} className={cls}>
              {inner}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
