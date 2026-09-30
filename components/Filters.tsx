"use client";

import { RotateCcw, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Texte normalisé pour la recherche : minuscules, sans accents. */
export function norm(v: unknown) {
  return String(v ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Vrai si la recherche (vide = tout) apparaît dans l’un des champs. */
export function matchSearch(query: string, ...fields: unknown[]) {
  const q = norm(query).trim();
  if (!q) return true;
  const hay = fields.map(norm).join(" ");
  return q.split(/\s+/).every((mot) => hay.includes(mot));
}

/** Barre de filtres posée en tête d’un tableau, avec compteur de résultats et remise à zéro. */
export function FilterBar({
  children,
  shown,
  total,
  onReset,
  active,
}: {
  children: ReactNode;
  shown: number;
  total: number;
  onReset?: () => void;
  active?: boolean;
}) {
  return (
    <div className="px-3 sm:px-4 py-3 border-b border-line flex flex-col xl:flex-row xl:items-center gap-2.5">
      <div className="flex flex-1 flex-col lg:flex-row lg:items-center gap-2 min-w-0 flex-wrap">{children}</div>
      <div className="flex items-center justify-between xl:justify-end gap-3 shrink-0">
        <span className="text-[12px] text-muted num whitespace-nowrap">
          {shown === total ? `${total} ligne${total > 1 ? "s" : ""}` : `${shown} sur ${total}`}
        </span>
        {onReset && active && (
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline whitespace-nowrap">
            <RotateCcw size={12} /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Rechercher…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input className={cn(inputClass, "h-8 pl-8 pr-8 text-[12.5px]")} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5" aria-label="Effacer la recherche">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/** Boutons exclusifs (statut, période…), avec compteur optionnel. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label?: string;
}) {
  return (
    <div className="inline-flex rounded-[7px] border border-line p-0.5 bg-surface-2 max-w-full overflow-x-auto self-start" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "h-7 px-2.5 rounded-[5px] text-[12px] font-medium transition-colors whitespace-nowrap",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
          {o.count != null && <span className="ml-1 num opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Liste déroulante de filtre ; la valeur vide signifie « tous ». */
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  label: string;
}) {
  return (
    <select
      className={cn(inputClass, "h-8 w-full lg:w-auto lg:max-w-[220px] text-[12px]", value && "border-primary text-primary font-medium")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
