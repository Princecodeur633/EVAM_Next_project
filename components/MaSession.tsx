"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, Unlock, Vault } from "lucide-react";
import { Button, DataTable, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { MODE_PAIEMENT_LABEL, STATUT_SESSION_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { cn, formatDa, formatDateTime, num } from "@/lib/utils";

/** « Ma session » du caissier : uniquement ses sessions, clôture avec écart justifié. */
export function MaSession() {
  const { state, dispatch, can, currentUser } = useStore();
  const me = currentUser?.id;
  const maCaisse = state.caisses.find((c) => c.caissier === me && !c.est_principale);
  const mesSessions = state.sessionsCaisse.filter((s) => s.caissier === me).sort((a, b) => new Date(b.date_ouverture).getTime() - new Date(a.date_ouverture).getTime());
  const session = mesSessions.find((s) => s.statut === "OUVERTE");
  const mesIds = new Set(mesSessions.map((s) => s.id));
  const ecarts = state.ecartsCaisse.filter((e) => mesIds.has(e.session_caisse));

  const [compte, setCompte] = useState("");
  const [justif, setJustif] = useState("");
  const [busy, setBusy] = useState(false);

  const encaissements = session ? state.encaissements.filter((e) => e.session_caisse === session.id) : [];
  const decaissements = session ? state.decaissements.filter((d) => d.session_caisse === session.id && d.statut === "EFFECTUE") : [];
  const totalEnc = encaissements.reduce((a, e) => a + num(e.montant), 0);
  const totalDec = decaissements.reduce((a, d) => a + num(d.montant), 0);
  const theorique = session ? num(session.solde_theorique_actuel ?? session.solde_ouverture) : 0;
  const saisi = compte.trim() !== "";
  const ecart = saisi ? Number(compte) - theorique : 0;
  const justifRequise = saisi && Math.abs(ecart) > 0.004;
  const peutCloturer = !!session && can("CLOTURER_CAISSE") && saisi && (!justifRequise || justif.trim().length > 0);

  const parMode = Object.entries(
    encaissements.reduce<Record<string, number>>((a, e) => ({ ...a, [e.mode_paiement]: (a[e.mode_paiement] ?? 0) + num(e.montant) }), {}),
  );

  async function cloturer() {
    if (!session) return;
    setBusy(true);
    const ok = await dispatch({ type: "CLOTURER_CAISSE", id: session.id, solde_compte: compte, justification: justif.trim() || undefined });
    setBusy(false);
    if (ok) {
      setCompte("");
      setJustif("");
    }
  }
  async function ouvrir() {
    setBusy(true);
    await dispatch({ type: "CREATE_SESSION" });
    setBusy(false);
  }

  return (
    <div className="space-y-4 max-w-[1100px]">
      <PageHeader eyebrow="Caisse" title="Ma session" description="Le solde théorique est calculé automatiquement. Saisissez le solde compté : tout écart doit être justifié pour clôturer." />

      {!maCaisse ? (
        <Guard variant="block" title="Aucune caisse ne vous est affectée">
          Vous ne pouvez ni ouvrir de session ni encaisser : contactez l’Admin SI.
        </Guard>
      ) : !session ? (
        <Panel className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="h-11 w-11 rounded-[10px] bg-surface-2 text-muted flex items-center justify-center shrink-0">
            <Lock size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold">Session fermée · {maCaisse.nom}</p>
            <p className="text-[12.5px] text-muted">
              Solde repris de la dernière clôture : <span className="num font-medium text-ink">{formatDa(num(maCaisse.solde_actuel))}</span>
            </p>
          </div>
          {can("CREATE_SESSION") && (
            <Button className="h-11 px-5 text-[14px]" disabled={busy} onClick={() => void ouvrir()}>
              <Unlock size={16} /> {busy ? "Ouverture…" : "Ouvrir ma session"}
            </Button>
          )}
        </Panel>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* Calcul du théorique */}
          <Panel className="overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <Vault size={15} className="text-muted" />
              <h2 className="text-[13px] font-semibold flex-1">{maCaisse.nom}</h2>
              <StatusBadge tone="success">Ouverte</StatusBadge>
            </div>
            <dl className="divide-y divide-line text-[13px]">
              <div className="px-4 py-2.5 flex justify-between gap-3">
                <dt className="text-muted">Ouverte le</dt>
                <dd>{formatDateTime(session.date_ouverture)}</dd>
              </div>
              <div className="px-4 py-2.5 flex justify-between gap-3">
                <dt className="text-muted">Solde d’ouverture</dt>
                <dd className="num">{formatDa(num(session.solde_ouverture))}</dd>
              </div>
              <div className="px-4 py-2.5 flex justify-between gap-3">
                <dt className="text-muted">+ Encaissements ({encaissements.length})</dt>
                <dd className="num text-success">{formatDa(totalEnc)}</dd>
              </div>
              {parMode.map(([mode, v]) => (
                <div key={mode} className="px-4 py-1.5 pl-8 flex justify-between gap-3 text-[12px] text-muted">
                  <dt>{MODE_PAIEMENT_LABEL[mode as keyof typeof MODE_PAIEMENT_LABEL] ?? mode}</dt>
                  <dd className="num">{formatDa(v)}</dd>
                </div>
              ))}
              <div className="px-4 py-2.5 flex justify-between gap-3">
                <dt className="text-muted">− Décaissements effectués ({decaissements.length})</dt>
                <dd className="num text-danger">{formatDa(totalDec)}</dd>
              </div>
              <div className="px-4 py-3 flex justify-between gap-3 bg-surface-2/60">
                <dt className="font-semibold">Solde théorique</dt>
                <dd className="num text-[18px] font-semibold">{formatDa(theorique)}</dd>
              </div>
            </dl>
          </Panel>

          {/* Clôture */}
          <Panel className="p-4 space-y-4">
            <h2 className="text-[13px] font-semibold">Clôturer la session</h2>
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Solde compté</span>
              <input type="number" min="0" className={cn(inputClass, "h-11 text-[17px] font-semibold num text-right")} value={compte} onChange={(e) => setCompte(e.target.value)} placeholder="0" />
            </label>
            {saisi && (
              <div
                className={cn(
                  "rounded-[9px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-[13px]",
                  justifRequise ? "bg-danger-soft border border-danger/30" : "bg-success-soft border border-success/30",
                )}
              >
                <span className={justifRequise ? "text-danger font-medium" : "text-success font-medium"}>{justifRequise ? "Écart constaté" : "Aucun écart"}</span>
                <span className={cn("num font-semibold", justifRequise ? "text-danger" : "text-success")}>
                  {ecart > 0 ? "+" : ""}
                  {formatDa(ecart)}
                </span>
              </div>
            )}
            {justifRequise && (
              <label className="block">
                <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Justification (obligatoire)</span>
                <textarea className={cn(inputClass, "h-24 py-2 resize-none")} value={justif} onChange={(e) => setJustif(e.target.value)} placeholder="Erreur de rendu de monnaie, billet refusé…" />
              </label>
            )}
            <Button className="w-full h-11 text-[14px]" disabled={!peutCloturer || busy} onClick={() => void cloturer()}>
              <Lock size={15} /> {busy ? "Clôture…" : "Clôturer"}
            </Button>
            <p className="text-[11.5px] text-muted">Un écart est enregistré automatiquement à la clôture ; il ne peut pas être supprimé.</p>
          </Panel>
        </div>
      )}

      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Mes sessions</h2>
        <DataTable
          emptyText="Aucune session."
          columns={[
            { key: "o", label: "Ouverture" },
            { key: "c", label: "Clôture" },
            { key: "s", label: "Statut" },
            { key: "t", label: "Théorique", className: "text-right" },
            { key: "k", label: "Compté", className: "text-right" },
            { key: "e", label: "Écart", className: "text-right" },
          ]}
          rows={mesSessions.map((s) => {
            const e = s.ecart != null ? num(s.ecart) : null;
            return {
              o: formatDateTime(s.date_ouverture),
              c: s.date_cloture ? formatDateTime(s.date_cloture) : "—",
              s: <StatusBadge tone={s.statut === "OUVERTE" ? "warning" : "success"}>{STATUT_SESSION_LABEL[s.statut]}</StatusBadge>,
              t: <span className="num">{formatDa(num(s.statut === "OUVERTE" ? s.solde_theorique_actuel : s.solde_theorique_cloture))}</span>,
              k: <span className="num">{s.solde_compte_cloture != null ? formatDa(num(s.solde_compte_cloture)) : "—"}</span>,
              e: <span className={cn("num", e ? "text-danger font-semibold" : "text-muted")}>{e != null ? formatDa(e) : "—"}</span>,
            };
          })}
        />
      </Panel>

      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Mes écarts (lecture seule)</h2>
        <DataTable
          emptyText="Aucun écart enregistré."
          columns={[
            { key: "d", label: "Date" },
            { key: "m", label: "Montant", className: "text-right" },
            { key: "j", label: "Justification" },
            { key: "v", label: "Validation" },
          ]}
          rows={ecarts.map((e) => ({
            d: formatDateTime(e.date_creation),
            m: <span className="num text-danger font-medium">{formatDa(num(e.montant_ecart))}</span>,
            j: e.justification || "—",
            v: e.valide_par ? <StatusBadge tone="success">Validé</StatusBadge> : <StatusBadge tone="neutral">En attente</StatusBadge>,
          }))}
        />
      </Panel>
      <p className="text-[12px] text-muted">
        Besoin de sortir de l’argent ? <Link href="/caisse/decaissements" className="text-primary font-medium hover:underline">Demander un décaissement</Link>.
      </p>
    </div>
  );
}
