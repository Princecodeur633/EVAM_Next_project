"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export type ChartPoint = { label: string; value: number; color?: string };

export function WidgetCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("evam-card overflow-hidden flex flex-col", className)}>
      <div className="px-4 py-3 border-b border-line flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-muted mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  delta,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "warning" | "success" | "teal";
  delta?: string;
  icon?: ReactNode;
}) {
  const bar =
    tone === "danger"
      ? "bg-danger"
      : tone === "warning"
        ? "bg-warning"
        : tone === "success"
          ? "bg-success"
          : tone === "teal"
            ? "bg-teal"
            : "bg-primary";
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : tone === "success"
          ? "text-success"
          : tone === "teal"
            ? "text-teal"
            : "text-ink";
  return (
    <div className="evam-card overflow-hidden h-full">
      <div className={cn("h-[3px]", bar)} />
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted font-medium">{label}</p>
          {icon && <span className="text-muted opacity-70">{icon}</span>}
        </div>
        <p className={cn("text-[22px] sm:text-[26px] font-semibold mt-1.5 num tracking-tight leading-none break-words", color)}>{value}</p>
        <div className="flex items-center gap-2 mt-2 min-h-[16px]">
          {delta && (
            <span
              className={cn(
                "text-[11px] font-medium num px-1.5 py-0.5 rounded",
                delta.startsWith("-") ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
              )}
            >
              {delta}
            </span>
          )}
          {hint && <p className="text-[11.5px] text-muted truncate">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 160,
  format = (n) => String(n),
}: {
  data: ChartPoint[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const many = data.length > 6;
  return (
    <div className={cn("w-full", many && "overflow-x-auto overscroll-x-contain -mx-1 px-1")} style={{ height }}>
      <div className={cn("flex items-end gap-2 h-[calc(100%-28px)]", many && "min-w-[28rem]")}
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group min-w-[2rem]">
              <span className="text-[10px] num text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {format(d.value)}
              </span>
              <div className="w-full rounded-t-[5px] relative overflow-hidden bg-surface-2" style={{ height: `${Math.max(pct, 4)}%` }}>
                <div
                  className="absolute inset-0 rounded-t-[5px] transition-all duration-500"
                  style={{
                    background: `linear-gradient(180deg, ${d.color ?? COLORS[i % COLORS.length]} 0%, color-mix(in srgb, ${d.color ?? COLORS[i % COLORS.length]} 70%, transparent) 100%)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className={cn("flex gap-2 mt-2", many && "min-w-[28rem]")}>
        {data.map((d) => (
          <p key={d.label} className="flex-1 text-center text-[10px] text-muted truncate min-w-[2rem]">
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  data,
  height = 160,
  format = (n) => String(n),
}: {
  data: ChartPoint[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = Math.max(max - min, 1);
  const w = 320;
  const h = height - 24;
  const pad = 8;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = pad + (1 - (d.value - min) / span) * (h - pad * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1]?.x ?? 0} ${h} L ${points[0]?.x ?? 0} ${h} Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[calc(100%-22px)]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={pad + g * (h - pad * 2)}
            y2={pad + g * (h - pad * 2)}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke="var(--chart-1)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke="var(--chart-1)" strokeWidth="2">
            <title>
              {p.label}: {format(p.value)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between px-0.5 gap-1 overflow-hidden">
        {data.map((d) => (
          <span key={d.label} className="text-[10px] text-muted truncate min-w-0">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  size = 140,
  centerLabel,
  centerValue,
}: {
  data: ChartPoint[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 min-w-0">
      <div className="relative shrink-0 mx-auto sm:mx-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={d.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={d.color ?? COLORS[i % COLORS.length]}
                strokeWidth="10"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && <p className="text-[16px] font-semibold num leading-none">{centerValue}</p>}
            {centerLabel && <p className="text-[10px] text-muted mt-1">{centerLabel}</p>}
          </div>
        )}
      </div>
      <ul className="space-y-2 min-w-0 flex-1">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color ?? COLORS[i % COLORS.length] }} />
              <span className="truncate text-muted">{d.label}</span>
            </span>
            <span className="num font-medium shrink-0">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CapacityGauge({
  label,
  used,
  capacity,
  unit = "",
}: {
  label: string;
  used: number;
  capacity: number;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((used / Math.max(capacity, 1)) * 100));
  const tone = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-teal";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <p className="text-[12.5px] font-medium">{label}</p>
        <p className="text-[11px] num text-muted">
          {used}
          {unit} / {capacity}
          {unit}
        </p>
      </div>
      <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden border border-line">
        <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-muted mt-1 num">{pct}% de capacité</p>
    </div>
  );
}

export function SparkBars({ values, tone = "primary" }: { values: number[]; tone?: "primary" | "teal" | "success" | "warning" }) {
  const max = Math.max(...values, 1);
  const color =
    tone === "teal" ? "bg-teal" : tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-primary";
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("w-1.5 rounded-sm opacity-80", color)}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
