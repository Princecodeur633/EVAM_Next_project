"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Panneau latéral droit (création / édition), fermé par la croix, Échap ou un clic sur le fond. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] drawer-fade" onClick={onClose} />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 w-full bg-surface border-l border-line shadow-[var(--shadow)] flex flex-col drawer-in",
          width === "lg" ? "sm:max-w-[560px]" : "sm:max-w-[440px]",
        )}
      >
        <header className="px-5 py-4 border-b border-line flex items-start gap-3 shrink-0">
          {icon && <span className="h-9 w-9 shrink-0 rounded-[8px] bg-primary-soft text-primary flex items-center justify-center">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight break-words">{title}</h2>
            {subtitle && <div className="text-[12px] text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-[7px] text-muted hover:text-ink hover:bg-surface-2"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-line bg-surface-2/60 flex flex-wrap items-center justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</footer>}
      </aside>
    </div>
  );
}

/** Bloc titré à l’intérieur d’un tiroir. */
export function DrawerSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">{title}</h3>
        {hint && <p className="text-[12px] text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Panneau latéral intégré à la page (colonne de droite, ~40 %) : même contenu qu'un tiroir,
 * mais sans fond flouté sur ordinateur. Sur mobile, il s'ouvre en plein écran si `mobileOpen`.
 */
export function SidePanel({
  title,
  subtitle,
  icon,
  children,
  footer,
  onClose,
  mobileOpen = false,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Croix de fermeture (revient à l'état par défaut du panneau). */
  onClose?: () => void;
  mobileOpen?: boolean;
}) {
  return (
    <div className={cn("lg:block lg:sticky lg:top-[72px]", mobileOpen ? "fixed inset-0 z-50 lg:static lg:z-auto" : "hidden")}>
      {mobileOpen && onClose && (
        <button type="button" aria-label="Fermer" className="lg:hidden absolute inset-0 bg-ink/40 drawer-fade" onClick={onClose} />
      )}
      <aside
        className={cn(
          "bg-surface flex flex-col",
          "lg:relative lg:border lg:border-line lg:rounded-[10px] lg:shadow-[var(--shadow)] lg:max-h-[calc(100dvh-96px)] lg:overflow-hidden",
          mobileOpen && "absolute inset-y-0 right-0 w-full sm:max-w-[440px] shadow-[var(--shadow)] drawer-in lg:static lg:max-w-none lg:shadow-none lg:animate-none",
        )}
      >
        <header className="px-4 py-3.5 border-b border-line flex items-start gap-3 shrink-0">
          {icon && <span className="h-8 w-8 shrink-0 rounded-[8px] bg-primary-soft text-primary flex items-center justify-center">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-semibold tracking-tight break-words">{title}</h2>
            {subtitle && <div className="text-[11.5px] text-muted mt-0.5">{subtitle}</div>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded-[7px] text-muted hover:text-ink hover:bg-surface-2"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">{children}</div>
        {footer && (
          <footer className="px-4 py-3 border-t border-line bg-surface-2/60 flex flex-wrap items-center justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}

/** Grille « tableau 60 % / panneau 40 % » ; empilée sur mobile. */
export function SplitLayout({ children }: { children: ReactNode }) {
  return <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] gap-4 items-start">{children}</div>;
}
