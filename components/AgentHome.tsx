"use client";

import Link from "next/link";
import { ChevronRight, ListChecks, TrendingDown } from "lucide-react";
import { OfBadge } from "@/components/badges";
import { KpiCard } from "@/components/charts";
import { useStore } from "@/lib/store";
import type { StatutOF } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

const ORDRE: Partial<Record<StatutOF, number>> = { EN_PRODUCTION: 0, PRET: 1, MATIERES_EN_PREPARATION: 2, A_PREPARER: 3, BROUILLON: 4 };

function sameDay(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/** Accueil de l’agent de production (mobile) : ses OF en cartes, avec saisie en un geste. */
export function AgentHome() {
  const { state, currentUser, articleName } = useStore();
  // Le store ne garde déjà que les OF auxquels l’agent est affecté.
  const ofs = state.ofList
    .filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE")
    .sort((a, b) => (ORDRE[a.statut] ?? 9) - (ORDRE[b.statut] ?? 9));
  const etapesJour = state.etapes.filter((e) => e.agent === currentUser?.id && (sameDay(e.date_debut) || sameDay(e.date_fin)));
  const pertesJour = state.pertes.filter((p) => sameDay(p.date_constat));
  const firstName = currentUser?.name?.split(" ")[0];

  return (
    <div className="max-w-[640px] mx-auto space-y-4 anim-in">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-medium">Atelier</p>
        <h1 className="text-[22px] font-semibold tracking-tight">
          {new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-[13px] text-muted mt-0.5">Choisissez l’OF en production, saisissez chaque étape, déclarez les pertes.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Mes étapes du jour" value={etapesJour.length} tone="teal" icon={<ListChecks size={16} strokeWidth={1.75} />} />
        <KpiCard
          label="Pertes du jour"
          value={formatQty(pertesJour.reduce((a, p) => a + num(p.quantite_perte), 0), 0)}
          hint={`${pertesJour.length} déclaration${pertesJour.length > 1 ? "s" : ""}`}
          tone={pertesJour.length ? "danger" : "success"}
          icon={<TrendingDown size={16} strokeWidth={1.75} />}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted font-semibold">Mes OF ({ofs.length})</h2>
        {ofs.length === 0 ? (
          <div className="evam-card px-5 py-12 text-center">
            <p className="text-[14px] font-medium">Aucun OF ne vous est affecté.</p>
            <p className="text-[12.5px] text-muted mt-1">Le responsable de production vous affecte aux OF.</p>
          </div>
        ) : (
          ofs.map((o) => {
            const enProd = o.statut === "EN_PRODUCTION";
            return (
              <article key={o.id} className={cn("evam-card overflow-hidden", enProd && "ring-2 ring-primary/40")}>
                <Link href={`/production/of/${o.id}`} className="flex items-start gap-3 px-4 pt-4 pb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[16px] font-semibold num">{o.numero}</p>
                      <OfBadge status={o.statut} />
                    </div>
                    <p className="text-[13.5px] mt-1 truncate">{articleName(o.article)}</p>
                    <p className="text-[12px] text-muted mt-0.5 num">{formatQty(num(o.quantite_a_produire), 0)} à produire</p>
                  </div>
                  <ChevronRight size={18} className="text-muted shrink-0 mt-1" />
                </Link>
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  <Link
                    href={`/production/suivi?of=${o.id}&tab=etape`}
                    className={cn(
                      "h-12 rounded-[9px] inline-flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors",
                      enProd ? "bg-primary text-white hover:bg-primary-hover" : "bg-surface-2 border border-line-strong hover:bg-primary-soft",
                    )}
                  >
                    <ListChecks size={18} /> Étape
                  </Link>
                  <Link
                    href={`/production/suivi?of=${o.id}&tab=perte`}
                    className="h-12 rounded-[9px] inline-flex items-center justify-center gap-2 text-[15px] font-semibold border border-danger/30 text-danger bg-danger-soft hover:bg-danger hover:text-white transition-colors"
                  >
                    <TrendingDown size={18} /> Perte
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
