"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Banknote, Building2, CircleCheck, ExternalLink, FileText, Lock, Smartphone, Unlock, Vault, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SplitLayout } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Tabs } from "@/components/Tabs";
import { Button, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { MODE_PAIEMENT_LABEL, STATUT_FACTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Facture, ModePaiement } from "@/lib/types";
import { cn, formatDa, formatDate, formatDateTime, num } from "@/lib/utils";

const MODE_ICON: Record<ModePaiement, LucideIcon> = { ESPECES: Banknote, MOBILE_MONEY: Smartphone, VIREMENT: Building2, CHEQUE: FileText };
type Onglet = "a_encaisser" | "non_soldees";

export default function CaissePage() {
  return (
    <Suspense fallback={null}>
      <Caisse />
    </Suspense>
  );
}

function Caisse() {
  const { state, dispatch, clientName, can, currentUser } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  // Un encaissement n’est accepté que sur la session OUVERTE du caissier connecté.
  const session = state.sessionsCaisse.find((s) => s.statut === "OUVERTE" && s.caissier === currentUser?.id);
  const maCaisse = state.caisses.find((c) => c.caissier === currentUser?.id && !c.est_principale);
  const [onglet, setOnglet] = useState<Onglet>("a_encaisser");
  const [q, setQ] = useState("");
  const [ouverture, setOuverture] = useState(false);
  const selection = Number(params.get("facture")) || null;
  const choisir = (id: number | null) => router.replace(id ? `/caisse?facture=${id}` : "/caisse", { scroll: false });

  const paye = (f: Facture) => state.encaissements.filter((e) => e.facture === f.id).reduce((a, e) => a + num(e.montant), 0);
  const restant = (f: Facture) => Math.max(0, num(f.montant_total) - paye(f));
  const listes: Record<Onglet, Facture[]> = {
    a_encaisser: state.factures.filter((f) => f.statut === "EMISE"),
    non_soldees: state.factures.filter((f) => f.statut === "PARTIELLEMENT_PAYEE"),
  };
  const rows = listes[onglet]
    .filter((f) => matchSearch(q, f.numero, clientName(f.client)))
    .sort((a, b) => new Date(a.date_emission).getTime() - new Date(b.date_emission).getTime());
  const facture = state.factures.find((f) => f.id === selection) ?? null;

  async function ouvrir() {
    setOuverture(true);
    await dispatch({ type: "CREATE_SESSION" });
    setOuverture(false);
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Caisse" title="Encaisser" description="Choisissez une facture à gauche, puis encaissez-la à droite sur votre session ouverte." />

      {/* Barre de session, fixée en haut */}
      <div className="sticky top-[64px] z-20">
        {!maCaisse ? (
          <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-4 py-3 flex items-center gap-3 shadow-[var(--shadow)]" role="alert">
            <Lock size={17} className="text-danger shrink-0" />
            <p className="text-[13px]">
              <span className="font-semibold text-danger">Aucune caisse ne vous est affectée.</span>{" "}
              <span className="text-ink/80">Vous ne pouvez pas encaisser : contactez l’Admin SI.</span>
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-[10px] border px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shadow-[var(--shadow)] backdrop-blur-md",
              session ? "border-success/30 bg-success-soft/90" : "border-warning/30 bg-warning-soft/90",
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 hidden sm:block", session ? "bg-success animate-pulse" : "bg-warning")} />
            <div className="min-w-0 flex-1 text-[13px]">
              <span className="font-semibold">{maCaisse.nom}</span> ·{" "}
              {session ? (
                <>
                  Session ouverte depuis {formatDateTime(session.date_ouverture)} · solde théorique{" "}
                  <span className="num font-semibold">{formatDa(num(session.solde_theorique_actuel ?? session.solde_ouverture))}</span>
                </>
              ) : (
                <>Session fermée · solde repris : <span className="num font-semibold">{formatDa(num(maCaisse.solde_actuel))}</span></>
              )}
            </div>
            {session ? (
              <Link href="/caisse/cloture" className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-[7px] border border-line-strong bg-surface text-[13px] font-medium hover:bg-surface-2">
                <Vault size={14} /> Clôturer
              </Link>
            ) : (
              can("CREATE_SESSION") && (
                <Button disabled={ouverture} onClick={() => void ouvrir()}>
                  <Unlock size={14} /> {ouverture ? "Ouverture…" : "Ouvrir ma session"}
                </Button>
              )
            )}
          </div>
        )}
      </div>

      <SplitLayout>
        {/* Gauche : factures */}
        <div className="space-y-3 min-w-0">
          <Tabs
            label="Factures"
            value={onglet}
            onChange={setOnglet}
            items={[
              { value: "a_encaisser", label: "À encaisser", count: listes.a_encaisser.length },
              { value: "non_soldees", label: "Non soldées", count: listes.non_soldees.length },
            ]}
          />
          <Panel className="overflow-hidden">
            <FilterBar shown={rows.length} total={listes[onglet].length} active={!!q} onReset={() => setQ("")}>
              <SearchInput value={q} onChange={setQ} placeholder="N° de facture ou client…" />
            </FilterBar>
            {rows.length === 0 ? (
              <p className="px-4 py-12 text-center text-[13px] text-muted">{listes[onglet].length ? "Aucune facture pour cette recherche." : "Aucune facture dans cet onglet."}</p>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((f) => {
                  const actif = f.id === selection;
                  return (
                    <li key={f.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => choisir(f.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choisir(f.id)}
                        className={cn("px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors border-l-2", actif ? "bg-primary-soft border-primary" : "border-transparent hover:bg-surface-2")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="num text-[13.5px] font-semibold">{f.numero}</span>
                            {f.statut === "PARTIELLEMENT_PAYEE" && <StatusBadge tone="warning">Partiel</StatusBadge>}
                          </div>
                          <p className="text-[12.5px] text-muted truncate">
                            {clientName(f.client)} · émise le {formatDate(f.date_emission)}
                          </p>
                          <Link
                            href={`/commercial/commandes/${f.commande}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline mt-0.5"
                          >
                            Voir la commande <ExternalLink size={11} />
                          </Link>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="num text-[14px] font-semibold">{formatDa(restant(f))}</p>
                          {f.statut === "PARTIELLEMENT_PAYEE" && <p className="text-[11px] text-muted num">sur {formatDa(num(f.montant_total))}</p>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Droite : encaissement de la facture sélectionnée */}
        <div className="lg:sticky lg:top-[136px] min-w-0">
          {facture ? (
            <EncaissementPanel key={facture.id} facture={facture} restant={restant(facture)} paye={paye(facture)} sessionId={session?.id ?? null} onDone={() => choisir(null)} />
          ) : (
            <Panel className="px-6 py-14 text-center">
              <Wallet size={28} className="mx-auto text-muted/60" />
              <p className="text-[14px] font-medium mt-3">Sélectionnez une facture</p>
              <p className="text-[12.5px] text-muted mt-1">Le restant dû et le mode de paiement s’affichent ici.</p>
            </Panel>
          )}
        </div>
      </SplitLayout>
    </div>
  );
}

function EncaissementPanel({ facture, restant, paye, sessionId, onDone }: { facture: Facture; restant: number; paye: number; sessionId: number | null; onDone: () => void }) {
  const { state, dispatch, clientName, can } = useStore();
  const recus = state.encaissements.filter((e) => e.facture === facture.id).sort((a, b) => b.date_encaissement.localeCompare(a.date_encaissement));
  const [mode, setMode] = useState<ModePaiement>("ESPECES");
  const [montant, setMontant] = useState(String(restant));
  const [saving, setSaving] = useState(false);
  const [fait, setFait] = useState(false);
  const m = Number(montant);
  const soldee = facture.statut === "PAYEE" || restant <= 0;
  const valide = sessionId != null && m > 0 && m <= restant && can("ENCAISSER") && !soldee;

  async function encaisser() {
    if (sessionId == null) return;
    setSaving(true);
    const ok = await dispatch({ type: "ENCAISSER", session_caisse: sessionId, facture: facture.id, montant: m, mode_paiement: mode });
    setSaving(false);
    if (ok) {
      setFait(true);
      setTimeout(onDone, 1200);
    }
  }

  return (
    <Panel className="overflow-hidden flex flex-col">
      <div className="px-4 py-3.5 border-b border-line">
        <div className="flex items-center justify-between gap-2">
          <p className="num text-[15px] font-semibold">{facture.numero}</p>
          <StatusBadge tone={facture.statut === "PAYEE" ? "success" : "warning"}>{STATUT_FACTURE_LABEL[facture.statut]}</StatusBadge>
        </div>
        <p className="text-[12.5px] text-muted">{clientName(facture.client)}</p>
      </div>
      <div className="p-4 space-y-4">
        <div className="rounded-[10px] bg-sidebar text-white px-4 py-3.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/60 font-medium">Restant dû</p>
          <p className="text-[28px] font-semibold num leading-tight mt-0.5 break-words">{formatDa(restant)}</p>
          <p className="text-[12px] text-white/60 num">
            Total {formatDa(num(facture.montant_total))} · déjà payé {formatDa(paye)}
          </p>
        </div>

        {recus.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Paiements reçus</p>
            <ul className="rounded-[9px] border border-line divide-y divide-line">
              {recus.map((e) => (
                <li key={e.id} className="px-3 py-2 flex items-center gap-2 text-[12.5px]">
                  <span className="num font-medium">{e.numero}</span>
                  <span className="text-muted truncate flex-1">
                    {formatDateTime(e.date_encaissement)} · {MODE_PAIEMENT_LABEL[e.mode_paiement]}
                  </span>
                  <span className="num">{formatDa(num(e.montant))}</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary text-[12px] font-medium hover:underline"
                    onClick={() => void actions.pdf("recuCaisse", e.id, e.numero).catch(() => {})}
                  >
                    <FileText size={13} /> Reçu
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {soldee ? (
          <p className="text-[13px] text-success flex items-center gap-1.5">
            <CircleCheck size={15} /> Facture soldée.
          </p>
        ) : (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MODE_PAIEMENT_LABEL) as ModePaiement[]).map((k) => {
                  const Icon = MODE_ICON[k] ?? Wallet;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMode(k)}
                      aria-pressed={mode === k}
                      className={cn(
                        "h-12 rounded-[9px] border text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors",
                        mode === k ? "bg-primary text-white border-primary" : "border-line-strong bg-surface hover:bg-surface-2",
                      )}
                    >
                      <Icon size={16} /> {MODE_PAIEMENT_LABEL[k]}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Montant encaissé</span>
              <input
                type="number"
                min="0"
                className={cn(inputClass, "h-11 text-[17px] font-semibold num text-right", m > restant && "border-danger")}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
              {m > restant && <span className="block text-[11.5px] text-danger mt-1">Supérieur au restant dû.</span>}
              {m > 0 && m < restant && <span className="block text-[11.5px] text-muted mt-1">Paiement partiel : il restera {formatDa(restant - m)}.</span>}
            </label>
          </>
        )}
      </div>
      {!soldee && (
        <div className="p-4 pt-0">
          <Button className={cn("w-full h-12 text-[15px]", fait && "bg-success hover:bg-success")} disabled={!valide || saving || fait} onClick={() => void encaisser()}>
            {fait ? (
              <>
                <CircleCheck size={17} /> Encaissé
              </>
            ) : saving ? (
              "Encaissement…"
            ) : (
              <>
                <Wallet size={17} /> Encaisser {m > 0 ? formatDa(m) : ""}
              </>
            )}
          </Button>
          {sessionId == null && <p className="text-[11.5px] text-warning mt-2 text-center">Ouvrez votre session pour encaisser.</p>}
        </div>
      )}
    </Panel>
  );
}
