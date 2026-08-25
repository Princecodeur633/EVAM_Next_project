import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatusBadge({
  tone,
  children,
}: {
  tone: "neutral" | "info" | "success" | "warning" | "danger" | "teal";
  children: ReactNode;
}) {
  const map = {
    neutral: "bg-surface-2 text-muted border border-line",
    info: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    teal: "bg-teal-soft text-teal",
  };
  const dot = {
    neutral: "bg-muted",
    info: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    teal: "bg-teal",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-[3px] text-[11px] font-medium tracking-wide rounded-[5px]", map[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  type = "button",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
}) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-hover disabled:opacity-40 shadow-sm",
    secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 disabled:opacity-40",
    ghost: "text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40",
    danger: "bg-danger text-white hover:opacity-90 disabled:opacity-40",
    success: "bg-success text-white hover:opacity-90 disabled:opacity-40",
  };
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium rounded-[7px] transition-all duration-150",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  status,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6 anim-in">
      <div>
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-1.5 font-medium">{eyebrow}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-ink">{title}</h1>
          {status}
        </div>
        {description && <p className="text-muted mt-1.5 max-w-2xl text-[13.5px] leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("evam-card", className)}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-9 w-full px-3 border border-line-strong rounded-[7px] bg-surface text-ink outline-none focus:border-primary transition-colors placeholder:text-muted/60";

export function StatusStepper({
  steps,
  current,
}: {
  steps: { id: string; label: string }[];
  current: string;
}) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center overflow-x-auto bg-surface border border-line rounded-[10px] px-3 py-3 shadow-[var(--shadow)]">
      {steps.map((s, i) => {
        const done = idx > i;
        const active = idx === i;
        return (
          <li key={s.id} className="flex items-center min-w-0">
            <div className="flex items-center gap-2 px-1.5">
              <span
                className={cn(
                  "h-6 w-6 rounded-full text-[10px] flex items-center justify-center font-semibold shrink-0 transition-colors",
                  done && "bg-success text-white",
                  active && "bg-primary text-white",
                  !done && !active && "bg-surface-2 text-muted border border-line",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={cn("text-[12px] whitespace-nowrap", active ? "text-ink font-medium" : "text-muted")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("w-7 h-px mx-1", done ? "bg-success" : "bg-line-strong")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Guard({
  variant,
  title,
  children,
  action,
}: {
  variant: "ok" | "block" | "warn";
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const map = {
    ok: "border-success/30 bg-success-soft",
    block: "border-danger/30 bg-danger-soft",
    warn: "border-warning/30 bg-warning-soft",
  };
  const bar = variant === "ok" ? "bg-success" : variant === "block" ? "bg-danger" : "bg-warning";
  return (
    <div className={cn("border rounded-[10px] overflow-hidden flex", map[variant])}>
      <span className={cn("w-1 shrink-0", bar)} />
      <div className="px-4 py-3 flex items-start justify-between gap-4 flex-1">
        <div>
          <p className="text-[13px] font-semibold">{title}</p>
          <div className="text-[13px] mt-0.5 text-ink/80 leading-relaxed">{children}</div>
        </div>
        {action}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-muted text-[13px] mt-1">{hint}</p>}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const bar =
    tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : tone === "success" ? "bg-success" : "bg-primary";
  const color =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-ink";
  return (
    <Panel className="overflow-hidden">
      <div className={cn("h-[3px]", bar)} />
      <div className="px-4 py-3.5">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted font-medium">{label}</p>
        <p className={cn("text-[24px] font-semibold mt-1.5 num tracking-tight", color)}>{value}</p>
        {hint && <p className="text-[12px] text-muted mt-1">{hint}</p>}
      </div>
    </Panel>
  );
}

export function DataTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, ReactNode>[];
  onRowClick?: (row: Record<string, ReactNode>) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line bg-surface-2">
            {columns.map((c) => (
              <th key={c.key} className={cn("px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-muted font-medium", c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3.5 py-12 text-center text-[13px] text-muted">
                Aucun enregistrement pour le moment.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-line last:border-0 transition-colors",
                  onRowClick && "hover:bg-primary-soft/60 cursor-pointer",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3.5 py-2.5 text-[13px] align-middle", c.className)}>
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const OF_STEPS = [
  { id: "BROUILLON", label: "Brouillon" },
  { id: "PLANIFIE", label: "Planifié" },
  { id: "LANCE", label: "Lancé" },
  { id: "EN_PRODUCTION", label: "En production" },
  { id: "TERMINE", label: "Terminé" },
  { id: "CONTROLE_QUALITE", label: "Contrôle qualité" },
  { id: "LIBERE", label: "Libéré" },
  { id: "CLOTURE", label: "Clôturé" },
];

export const ORDER_STEPS = [
  { id: "BROUILLON", label: "Brouillon" },
  { id: "VALIDEE", label: "Validée" },
  { id: "EN_PREPARATION", label: "En préparation" },
  { id: "LIVREE", label: "Livrée" },
  { id: "FACTUREE", label: "Facturée" },
];
