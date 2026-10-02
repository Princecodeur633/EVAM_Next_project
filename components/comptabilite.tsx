"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import type { AppState } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Période AAAA-MM à clôturer : le mois précédent tant qu’il n’est pas clôturé, sinon le mois en cours. */
export function periodeACloturer(state: AppState) {
  const d = new Date();
  const mois = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;
  const precedent = d.getMonth() === 0 ? mois(d.getFullYear() - 1, 11) : mois(d.getFullYear(), d.getMonth() - 1);
  return state.clotures.some((c) => c.periode === precedent) ? mois(d.getFullYear(), d.getMonth()) : precedent;
}

export type EtapeCloture = { id: string; label: string; href: string; fait: boolean; detail: string };

/**
 * État des 4 étapes de clôture d’une période mensuelle (AAAA-MM) :
 * ① coûts recalculés → ② écritures → ③ export → ④ clôture.
 * Calcul indicatif côté écran ; le serveur reste juge au moment de clôturer.
 */
export function etatCloture(state: AppState, periode: string): EtapeCloture[] {
  const [y, m] = periode.split("-").map(Number);
  const debut = `${periode}-01`;
  const fin = new Date(y, m, 0).toISOString().slice(0, 10);
  const dansPeriode = (iso: string) => iso.slice(0, 10) >= debut && iso.slice(0, 10) <= fin;

  const perimes = state.coutsReels.filter((c) => c.date_calcul.slice(0, 10) < debut).length;
  const ecritures = state.ecrituresComptables.filter((e) => dansPeriode(e.date));
  const nonExportees = ecritures.filter((e) => !e.exportee_le).length;
  const exportJournal = state.exportsComptables.some((x) => x.type_export === "JOURNAL" && x.periode_debut <= debut && x.periode_fin >= fin);
  const cloturee = state.clotures.some((c) => c.periode === periode);

  return [
    {
      id: "couts",
      label: "Coûts recalculés",
      href: "/couts",
      fait: perimes === 0,
      detail: perimes ? `${perimes} coût(s) réel(s) calculé(s) avant le début de la période.` : "Tous les coûts réels sont à jour.",
    },
    {
      id: "ecritures",
      label: "Écritures",
      href: "/comptabilite/ecritures",
      fait: ecritures.length > 0,
      detail: ecritures.length ? `${ecritures.length} écriture(s) générée(s) sur la période.` : "Aucune écriture générée sur la période.",
    },
    {
      id: "export",
      label: "Export",
      href: "/comptabilite/export-sage",
      fait: exportJournal && nonExportees === 0,
      detail: !exportJournal ? "Aucun export « Journal » couvrant toute la période." : nonExportees ? `${nonExportees} écriture(s) pas encore exportée(s).` : "Journal de la période exporté.",
    },
    {
      id: "cloture",
      label: "Clôture",
      href: "/comptabilite/clotures",
      fait: cloturee,
      detail: cloturee ? "Période verrouillée." : "Période ouverte.",
    },
  ];
}

/** Motif de blocage d’une étape : la première étape précédente non remplie. */
export function motifBlocage(etapes: EtapeCloture[], id: string) {
  const i = etapes.findIndex((e) => e.id === id);
  const manquante = etapes.slice(0, i).find((e) => !e.fait);
  return manquante ? `Étape « ${manquante.label} » à terminer : ${manquante.detail}` : null;
}

/** Frise ① → ④ ; une étape dont la précédente n’est pas remplie est grisée avec son motif. */
export function FriseCloture({ state, periode, actif }: { state: AppState; periode: string; actif?: string }) {
  const etapes = etatCloture(state, periode);
  return (
    <section className="evam-card p-3 sm:p-4 space-y-2.5" aria-label={`Clôture de ${periode}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted">
          Clôture de la période <span className="num font-semibold text-ink">{periode}</span>
        </p>
        <span className="text-[11px] num text-muted">
          {etapes.filter((e) => e.fait).length}/{etapes.length}
        </span>
      </div>
      <ol className="flex flex-col md:flex-row md:items-stretch gap-1.5 md:gap-0">
        {etapes.map((e, i) => {
          const bloque = !!motifBlocage(etapes, e.id) && !e.fait;
          const courant = e.id === actif;
          return (
            <li key={e.id} className="flex items-center flex-1 min-w-0">
              <Link
                href={e.href}
                title={bloque ? motifBlocage(etapes, e.id) ?? undefined : e.detail}
                className={cn(
                  "flex-1 min-w-0 flex items-start gap-2.5 rounded-[8px] px-3 py-2 border transition-colors",
                  courant ? "border-primary bg-primary-soft" : "border-transparent hover:bg-surface-2",
                  bloque && "opacity-55",
                )}
              >
                <span
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-semibold num shrink-0",
                    e.fait ? "bg-success text-white" : bloque ? "bg-surface-2 text-muted border border-line" : "bg-primary text-white",
                  )}
                >
                  {e.fait ? <Check size={14} strokeWidth={2.5} /> : bloque ? <Lock size={12} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{e.label}</span>
                  <span className={cn("block text-[11.5px] leading-snug", e.fait ? "text-success" : bloque ? "text-muted" : "text-warning")}>
                    {bloque ? "En attente de l’étape précédente" : e.detail}
                  </span>
                </span>
              </Link>
              {i < etapes.length - 1 && <ChevronRight size={15} className="text-line-strong shrink-0 hidden md:block mx-0.5" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
