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
    neutral: "bg-slate-100 text-slate-700",
    info: "bg-[#e8f1f5] text-primary",
    success: "bg-emerald-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
    teal: "bg-teal-50 text-teal",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", map[tone])}>
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
    primary: "bg-primary text-white hover:bg-primary-hover disabled:opacity-40",
    secondary: "bg-white text-ink border border-line-strong hover:bg-slate-50 disabled:opacity-40",
    ghost: "text-muted hover:bg-slate-100 disabled:opacity-40",
    danger: "bg-danger text-white hover:bg-red-800 disabled:opacity-40",
    success: "bg-success text-white hover:bg-emerald-800 disabled:opacity-40",
  };
  return (
    <button
      type={type}
      className={cn("inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-[6px] transition-colors", styles[variant], className)}
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
    <div className="flex items-start justify-between gap-6 mb-6">
      <div>
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.14em] text-muted mb-1">{eyebrow}</p>}
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
          {status}
        </div>
        {description && <p className="text-muted mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-surface border border-line rounded-[6px]", className)}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-8 w-full px-2.5 border border-line-strong rounded-[6px] bg-white text-ink outline-none focus:border-primary";

export function StatusStepper({
  steps,
  current,
}: {
  steps: { id: string; label: string }[];
  current: string;
}) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center gap-0 overflow-x-auto border border-line rounded-[6px] bg-white px-2 py-2">
      {steps.map((s, i) => {
        const done = idx > i;
        const active = idx === i;
        return (
          <li key={s.id} className="flex items-center min-w-0">
            <div className="flex items-center gap-2 px-2">
              <span
                className={cn(
                  "h-5 w-5 rounded-full text-[10px] flex items-center justify-center font-medium",
                  done && "bg-success text-white",
                  active && "bg-primary text-white",
                  !done && !active && "bg-slate-200 text-muted",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-[12px] whitespace-nowrap", active ? "text-ink font-medium" : "text-muted")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="w-8 h-px bg-line-strong mx-1" />}
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
  const border = variant === "ok" ? "border-success" : variant === "block" ? "border-danger" : "border-warning";
  const bg = variant === "ok" ? "bg-emerald-50" : variant === "block" ? "bg-red-50" : "bg-amber-50";
  return (
    <div className={cn("border rounded-[6px] px-4 py-3 flex items-start justify-between gap-4", border, bg)}>
      <div>
        <p className="text-[13px] font-semibold">{title}</p>
        <div className="text-[13px] mt-0.5 text-ink/80">{children}</div>
      </div>
      {action}
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
  const color =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-ink";
  return (
    <Panel className="px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("text-[22px] font-semibold mt-1 num", color)}>{value}</p>
      {hint && <p className="text-[12px] text-muted mt-1">{hint}</p>}
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
          <tr className="border-b border-line bg-[#f8fafb]">
            {columns.map((c) => (
              <th key={c.key} className={cn("px-3 py-2 text-[11px] uppercase tracking-wide text-muted font-medium", c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={cn("border-b border-line last:border-0", onRowClick && "hover:bg-slate-50 cursor-pointer")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-2 text-[13px] align-middle", c.className)}>
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const OF_STEPS = [
  { id: "cree", label: "Créé" },
  { id: "planifie", label: "Planifié" },
  { id: "en_production", label: "En production" },
  { id: "fin_production", label: "Fin production" },
  { id: "controle_qualite", label: "Contrôle qualité" },
  { id: "cloture", label: "Clôturé" },
];

export const ORDER_STEPS = [
  { id: "creee", label: "Créée" },
  { id: "stock_verifie", label: "Stock vérifié" },
  { id: "a_payer", label: "À payer" },
  { id: "payee", label: "Payée" },
  { id: "preparee", label: "Préparée" },
  { id: "livree", label: "Livrée" },
  { id: "exportee", label: "Exportée" },
];
