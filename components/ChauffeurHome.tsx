"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, PackageCheck, PenLine, Route, Truck } from "lucide-react";
import { KpiCard } from "@/components/charts";
import { RemiseDrawer, SignalerDrawer } from "@/components/livraison";
import { StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { BonLivraison } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

/** Badge du statut de paiement transmis avec le BL (libellé de la facture). */
function Paiement({ statut }: { statut?: string }) {
  if (!statut) return null;
  const tone = /pay[ée]e$/i.test(statut) && !/partiel/i.test(statut) ? "success" : /partiel/i.test(statut) ? "warning" : statut === "Non facturée" ? "neutral" : "danger";
  return <StatusBadge tone={tone}>{statut}</StatusBadge>;
}

/** Accueil du chauffeur (mobile) : sa tournée du jour, BL dans l’ordre de passage. */
export function ChauffeurHome() {
  const { state, currentUser } = useStore();
  const [remise, setRemise] = useState<BonLivraison | null>(null);
  const [signaler, setSignaler] = useState<BonLivraison | null>(null);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  // Le store ne garde déjà que les tournées et BL du chauffeur connecté.
  const tournees = state.tournees.filter((t) => t.date_tournee === aujourdhui);
  const ids = new Set(tournees.map((t) => t.id));
  // Pas de champ « ordre de passage » côté serveur : on suit l’ordre de création des BL.
  const bls = state.bonsLivraison.filter((b) => b.tournee != null && ids.has(b.tournee)).sort((a, b) => a.date_generation.localeCompare(b.date_generation) || a.id - b.id);
  const remis = (b: BonLivraison) => b.signature_client || b.statut !== "EN_LIVRAISON";
  const aLivrer = bls.filter((b) => !remis(b));
  const prochain = aLivrer[0]?.id;
  const firstName = currentUser?.name?.split(" ")[0];

  return (
    <div className="max-w-[640px] mx-auto space-y-4 anim-in">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-medium">Tournée du jour</p>
        <h1 className="text-[22px] font-semibold tracking-tight">
          {new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-[13px] text-muted mt-0.5">
          {tournees.length ? tournees.map((t) => t.numero).join(" · ") : "Aucune tournée aujourd’hui."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <KpiCard label="Tournées" value={tournees.length} icon={<Route size={15} strokeWidth={1.75} />} />
        <KpiCard label="À livrer" value={aLivrer.length} tone={aLivrer.length ? "warning" : "success"} icon={<Truck size={15} strokeWidth={1.75} />} />
        <KpiCard label="Livrés" value={bls.length - aLivrer.length} tone="success" icon={<PackageCheck size={15} strokeWidth={1.75} />} />
      </div>

      {bls.length === 0 ? (
        <div className="evam-card px-5 py-12 text-center">
          <Truck size={28} className="mx-auto text-muted/60" />
          <p className="text-[14px] font-medium mt-3">Aucun bon de livraison pour aujourd’hui.</p>
          <p className="text-[12.5px] text-muted mt-1">Le responsable distribution affecte les BL à votre tournée.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {bls.map((b, i) => {
            const fait = remis(b);
            const suivant = b.id === prochain;
            return (
              <li key={b.id} className={cn("evam-card overflow-hidden", suivant && "ring-2 ring-primary/50", fait && "opacity-75")}>
                <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                  <span
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-[14px] font-bold num shrink-0",
                      fait ? "bg-success text-white" : suivant ? "bg-primary text-white" : "bg-surface-2 text-muted border border-line",
                    )}
                  >
                    {fait ? <CheckCircle2 size={18} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[16px] font-semibold truncate">{b.client_nom ?? b.commande_numero ?? b.numero}</p>
                      {suivant && <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">Prochain arrêt</span>}
                    </div>
                    {b.client_adresse && (
                      <p className="text-[13px] text-muted mt-0.5 flex items-start gap-1">
                        <MapPin size={13} className="mt-0.5 shrink-0" /> {b.client_adresse}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <Link href={`/distribution/bl/${b.id}`} className="num text-[12px] text-primary hover:underline">
                        {b.numero}
                      </Link>
                      <Paiement statut={b.statut_paiement} />
                      {fait && <StatusBadge tone="success">{b.statut === "EN_LIVRAISON" ? "Remis · à confirmer" : "Livré"}</StatusBadge>}
                    </div>
                  </div>
                </div>
                {b.articles && b.articles.length > 0 && (
                  <ul className="mx-4 mb-3 rounded-[8px] bg-surface-2 border border-line divide-y divide-line">
                    {b.articles.map((a) => (
                      <li key={a.code} className="px-3 py-2 flex justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate">{a.designation}</span>
                        <span className="num font-semibold shrink-0">× {formatQty(num(a.quantite), 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {b.incident_livraison && (
                  <p className="mx-4 mb-3 rounded-[8px] bg-warning-soft border border-warning/30 px-3 py-2 text-[12.5px] flex gap-2">
                    <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" /> {b.incident_livraison}
                  </p>
                )}
                {!fait && (
                  <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => setRemise(b)}
                      className={cn("h-12 rounded-[9px] inline-flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors", suivant ? "bg-success text-white hover:opacity-90" : "bg-surface-2 border border-line-strong hover:bg-success-soft")}
                    >
                      <PenLine size={17} /> Marquer remis
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignaler(b)}
                      className="h-12 rounded-[9px] inline-flex items-center justify-center gap-2 text-[14px] font-semibold border border-warning/40 text-warning bg-warning-soft hover:bg-warning hover:text-white transition-colors"
                    >
                      <AlertTriangle size={16} /> Problème
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {remise && <RemiseDrawer bl={remise} onClose={() => setRemise(null)} />}
      {signaler && <SignalerDrawer blId={signaler.id} numero={signaler.numero} onClose={() => setSignaler(null)} />}
    </div>
  );
}
