"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, X } from "lucide-react";
import { Segmented } from "@/components/Filters";
import { Button, DataTable, Field, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/api";
import { cn, formatDateTime, formatMoney, num } from "@/lib/utils";
import type { Decaissement, StatutDecaissement } from "@/lib/types";

const STATUT_LABEL: Record<StatutDecaissement, string> = {
  EN_ATTENTE: "En attente d'autorisation",
  AUTORISE: "Autorisé",
  REFUSE: "Refusé",
  EFFECTUE: "Effectué",
};
const STATUT_TONE: Record<StatutDecaissement, "warning" | "success" | "danger" | "info"> = {
  EN_ATTENTE: "warning",
  AUTORISE: "info",
  REFUSE: "danger",
  EFFECTUE: "success",
};

export default function DecaissementsPage() {
  const { role } = useStore();
  return role === "CAISSIER" ? <DecaissementsCaissier /> : <DecaissementsGeneral />;
}

/** Caissier : à gauche la demande, à droite le suivi de ses demandes (sortie seulement sur les siennes, autorisées). */
function DecaissementsCaissier() {
  const { state, dispatch, can, userName, currentUser } = useStore();
  const me = currentUser?.id;
  const maSession = state.sessionsCaisse.find((s) => s.statut === "OUVERTE" && s.caissier === me);
  const maCaisse = state.caisses.find((c) => c.caissier === me && !c.est_principale);
  const mesSessions = new Set(state.sessionsCaisse.filter((s) => s.caissier === me).map((s) => s.id));
  const mesDemandes = state.decaissements
    .filter((d) => mesSessions.has(d.session_caisse))
    .sort((a, b) => new Date(b.date_decaissement).getTime() - new Date(a.date_decaissement).getTime());
  const [montant, setMontant] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function demander() {
    if (!maSession) return;
    setBusy("demande");
    const ok = await dispatch({ type: "CREATE_DECAISSEMENT", session_caisse: maSession.id, montant: Number(montant), motif: motif.trim(), beneficiaire: beneficiaire.trim() });
    setBusy(null);
    if (ok) {
      setMontant("");
      setBeneficiaire("");
      setMotif("");
    }
  }
  async function effectuer(id: number) {
    setBusy(`e${id}`);
    await dispatch({ type: "EFFECTUER_DECAISSEMENT", id });
    setBusy(null);
  }

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Caisse"
        title="Décaissements"
        description="Vous demandez, la Direction ou la Comptabilité autorise ou refuse, puis vous effectuez la sortie d’argent."
      />
      <div className="grid lg:grid-cols-[minmax(300px,2fr)_minmax(0,3fr)] gap-4 items-start">
        <Panel className="p-4 space-y-3 lg:sticky lg:top-[72px]">
          <h2 className="text-[13px] font-semibold">Nouvelle demande</h2>
          {!maCaisse ? (
            <Guard variant="block" title="Aucune caisse affectée">
              Contactez l’Admin SI.
            </Guard>
          ) : !maSession ? (
            <Guard variant="warn" title="Session fermée">
              Ouvrez votre session avant de demander un décaissement.
            </Guard>
          ) : null}
          <Field label="Montant">
            <input type="number" min="0" className={cn(inputClass, "h-11 text-[16px] font-semibold num text-right")} value={montant} onChange={(e) => setMontant(e.target.value)} disabled={!maSession} />
          </Field>
          <Field label="Bénéficiaire">
            <input className={inputClass} value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} disabled={!maSession} />
          </Field>
          <Field label="Motif (obligatoire)">
            <textarea className={cn(inputClass, "h-20 py-2 resize-none")} value={motif} onChange={(e) => setMotif(e.target.value)} disabled={!maSession} />
          </Field>
          <Button className="w-full h-11" disabled={!maSession || !can("CREATE_DECAISSEMENT") || !(Number(montant) > 0) || !motif.trim() || busy !== null} onClick={() => void demander()}>
            {busy === "demande" ? "Envoi…" : "Demander l’autorisation"}
          </Button>
        </Panel>

        <Panel className="overflow-hidden min-w-0">
          <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Mes demandes</h2>
          {mesDemandes.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-muted">Aucune demande de décaissement.</p>
          ) : (
            <ul className="divide-y divide-line">
              {mesDemandes.map((d) => (
                <li key={d.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="num text-[13px] font-semibold">{d.numero}</span>
                      <StatusBadge tone={STATUT_TONE[d.statut]}>{STATUT_LABEL[d.statut]}</StatusBadge>
                    </div>
                    <p className="text-[12.5px] text-muted mt-0.5 break-words">
                      {d.statut === "REFUSE" ? `Refusé : ${d.motif_refus}` : d.motif}
                      {d.beneficiaire ? ` · ${d.beneficiaire}` : ""}
                      {d.autorise_par ? ` · ${d.statut === "REFUSE" ? "refusé" : "autorisé"} par ${userName(d.autorise_par)}` : ""}
                    </p>
                    <p className="text-[11px] text-muted">{formatDateTime(d.date_decaissement)}</p>
                  </div>
                  <span className="num text-[14px] font-semibold shrink-0">{formatMoney(num(d.montant))}</span>
                  {d.statut === "AUTORISE" && can("EFFECTUER_DECAISSEMENT") && (
                    <Button variant="success" className="h-9 shrink-0" disabled={busy !== null} onClick={() => void effectuer(d.id)}>
                      {busy === `e${d.id}` ? "…" : "Effectuer la sortie"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function DecaissementsGeneral() {
  const { state, dispatch, can, userName, currentUser } = useStore();
  // Le circuit est en 3 temps : le caissier DEMANDE (sur sa propre session
  // ouverte), la Direction/Comptabilité AUTORISE ou REFUSE, puis le caissier
  // EFFECTUE la sortie d'argent — jamais de choix « Autorisé par » à la saisie.
  const maSession = state.sessionsCaisse.find((s) => s.statut === "OUVERTE" && s.caissier === currentUser?.id);
  const [montant, setMontant] = useState(0);
  const [motif, setMotif] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");

  const [aAutoriser, setAAutoriser] = useState<Decaissement[]>([]);
  const [motifRefus, setMotifRefus] = useState<Record<number, string>>({});
  const rafraichirAAutoriser = () => void actions.decaissementsAAutoriser().then(setAAutoriser);
  // Direction / DAF : écran de décision (à autoriser + historique) ; caissier : demande + tableau.
  const valideur = can("AUTORISER_DECAISSEMENT") && !can("CREATE_DECAISSEMENT");
  const [enCours, setEnCours] = useState<number | null>(null);
  const [fHisto, setFHisto] = useState<"TOUS" | "AUTORISE" | "EFFECTUE" | "REFUSE">("TOUS");
  const historique = [...state.decaissements]
    .filter((d) => d.statut !== "EN_ATTENTE")
    .sort((a, b) => new Date(b.date_decaissement).getTime() - new Date(a.date_decaissement).getTime());
  const histoFiltre = historique.filter((d) => fHisto === "TOUS" || d.statut === fHisto);

  async function decider(id: number, decision: "AUTORISER" | "REFUSER") {
    setEnCours(id);
    await dispatch(decision === "AUTORISER" ? { type: "AUTORISER_DECAISSEMENT", id } : { type: "REFUSER_DECAISSEMENT", id, motif: motifRefus[id] });
    setEnCours(null);
    rafraichirAAutoriser();
  }
  useEffect(() => {
    if (can("AUTORISER_DECAISSEMENT")) rafraichirAAutoriser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.decaissements.length]);

  const caisseNom = (id: number) => {
    const s = state.sessionsCaisse.find((x) => x.id === id);
    const c = s ? state.caisses.find((x) => x.id === s.caisse) : undefined;
    return c ? `${c.nom} · ${userName(s?.caissier)}` : `#${id}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Caisse"
        title="Décaissements"
        description="Sortie de caisse en 3 temps : le caissier demande, la Direction ou la Comptabilité/DAF autorise ou refuse, puis le caissier effectue la sortie d'argent."
      />
      {can("CREATE_DECAISSEMENT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Nouvelle demande</h2>
          {maSession ? (
            <p className="text-[13px] text-muted col-span-full sm:col-span-1">
              Sur ma session : {caisseNom(maSession.id)}
            </p>
          ) : (
            <p className="text-[13px] text-danger col-span-full">
              Ouvrez votre session de caisse (écran Encaissements) avant de demander un décaissement.
            </p>
          )}
          <Field label="Montant">
            <input type="number" className={inputClass} value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
          </Field>
          <Field label="Bénéficiaire">
            <input className={inputClass} value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} />
          </Field>
          <Field label="Motif">
            <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Field>
          <Button
            disabled={!maSession || montant <= 0 || !motif.trim()}
            onClick={() => {
              void dispatch({ type: "CREATE_DECAISSEMENT", session_caisse: maSession!.id, montant, motif: motif.trim(), beneficiaire: beneficiaire.trim() });
              setMontant(0); setMotif(""); setBeneficiaire("");
            }}
          >
            Demander
          </Button>
        </Panel>
      )}

      {valideur && (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* À gauche : demandes à autoriser */}
          <section className="space-y-3 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold">À autoriser</h2>
              <span className={cn("text-[11px] num font-semibold px-1.5 py-0.5 rounded-[5px]", aAutoriser.length ? "bg-warning-soft text-warning" : "bg-surface-2 text-muted")}>
                {aAutoriser.length}
              </span>
            </div>
            {aAutoriser.length === 0 ? (
              <Panel className="px-4 py-10 flex flex-col items-center text-center gap-1.5">
                <CheckCircle2 size={22} className="text-success/70" />
                <p className="text-[13px] font-medium">Aucune demande en attente</p>
                <p className="text-[12px] text-muted">Les nouvelles demandes des caissiers apparaîtront ici.</p>
              </Panel>
            ) : (
              aAutoriser.map((dec) => {
                const refus = motifRefus[dec.id] ?? "";
                const busy = enCours === dec.id;
                return (
                  <Panel key={dec.id} className="overflow-hidden">
                    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">{dec.numero}</p>
                        <p className="text-[24px] font-semibold num tracking-tight leading-tight mt-1 break-words">{formatMoney(num(dec.montant))}</p>
                      </div>
                      <StatusBadge tone="warning">En attente</StatusBadge>
                    </div>
                    <dl className="px-4 pb-3 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px]">
                      <dt className="text-muted">Motif</dt>
                      <dd className="font-medium break-words">{dec.motif}</dd>
                      <dt className="text-muted">Bénéficiaire</dt>
                      <dd className="break-words">{dec.beneficiaire || "—"}</dd>
                      <dt className="text-muted">Caisse</dt>
                      <dd className="break-words">{caisseNom(dec.session_caisse)}</dd>
                      <dt className="text-muted">Demandé le</dt>
                      <dd>{formatDateTime(dec.date_decaissement)}</dd>
                    </dl>
                    <div className="px-4 py-3 border-t border-line bg-surface-2/50 space-y-2.5">
                      <Field label="Motif de refus">
                        <input
                          className={inputClass}
                          placeholder="Obligatoire pour refuser"
                          value={refus}
                          onChange={(e) => setMotifRefus((m) => ({ ...m, [dec.id]: e.target.value }))}
                        />
                      </Field>
                      <div className="flex gap-2 justify-end">
                        <Button variant="secondary" className="text-danger" disabled={busy || !refus.trim()} onClick={() => void decider(dec.id, "REFUSER")}>
                          <X size={14} /> Refuser
                        </Button>
                        <Button variant="success" disabled={busy} onClick={() => void decider(dec.id, "AUTORISER")}>
                          <Check size={14} /> Autoriser
                        </Button>
                      </div>
                    </div>
                  </Panel>
                );
              })
            )}
          </section>

          {/* À droite : historique */}
          <section className="space-y-3 min-w-0 lg:sticky lg:top-[72px]">
            <h2 className="text-[14px] font-semibold">Historique</h2>
            <Panel className="overflow-hidden">
              <div className="px-3 py-2.5 border-b border-line">
                <Segmented
                  label="Statut"
                  value={fHisto}
                  onChange={setFHisto}
                  options={[
                    { value: "TOUS", label: "Tous", count: historique.length },
                    { value: "AUTORISE", label: "Autorisés", count: historique.filter((d) => d.statut === "AUTORISE").length },
                    { value: "EFFECTUE", label: "Effectués", count: historique.filter((d) => d.statut === "EFFECTUE").length },
                    { value: "REFUSE", label: "Refusés", count: historique.filter((d) => d.statut === "REFUSE").length },
                  ]}
                />
              </div>
              {histoFiltre.length === 0 ? (
                <p className="px-4 py-10 text-center text-[12.5px] text-muted">Aucun décaissement.</p>
              ) : (
                <ul className="divide-y divide-line max-h-[calc(100dvh-220px)] overflow-y-auto overscroll-contain">
                  {histoFiltre.map((dec) => (
                    <li key={dec.id} className="px-4 py-3 flex items-start gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-medium">{dec.numero}</p>
                          <StatusBadge tone={STATUT_TONE[dec.statut]}>{STATUT_LABEL[dec.statut]}</StatusBadge>
                        </div>
                        <p className="text-[12px] text-muted mt-0.5 break-words">
                          {dec.statut === "REFUSE" ? `Refusé : ${dec.motif_refus}` : dec.motif}
                          {dec.autorise_par ? ` · par ${userName(dec.autorise_par)}` : ""}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">{formatDateTime(dec.date_decaissement)}</p>
                      </div>
                      <span className="text-[13px] num font-semibold shrink-0">{formatMoney(num(dec.montant))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>
        </div>
      )}

      {can("AUTORISER_DECAISSEMENT") && !valideur && (
        <Panel className="p-4 space-y-2">
          <h2 className="text-[13px] font-semibold">À autoriser</h2>
          {aAutoriser.length === 0 ? (
            <p className="text-[13px] text-muted">Aucune demande en attente.</p>
          ) : (
            aAutoriser.map((dec) => (
              <div key={dec.id} className="flex flex-wrap items-center gap-2 py-1 text-[13px]">
                <span className="font-medium">{dec.numero}</span>
                <span>{caisseNom(dec.session_caisse)}</span>
                <span>{formatMoney(num(dec.montant))}</span>
                <span className="text-muted">{dec.motif}</span>
                <span className="flex-1" />
                <input
                  className="h-8 w-40 border border-line rounded px-2 text-[12px]"
                  placeholder="Motif si refus"
                  value={motifRefus[dec.id] ?? ""}
                  onChange={(e) => setMotifRefus((m) => ({ ...m, [dec.id]: e.target.value }))}
                />
                <button
                  className="text-primary text-[12px]"
                  onClick={() => void dispatch({ type: "AUTORISER_DECAISSEMENT", id: dec.id }).then(rafraichirAAutoriser)}
                >
                  Autoriser
                </button>
                <button
                  className="text-danger text-[12px] disabled:opacity-40"
                  disabled={!motifRefus[dec.id]?.trim()}
                  onClick={() => void dispatch({ type: "REFUSER_DECAISSEMENT", id: dec.id, motif: motifRefus[dec.id] }).then(rafraichirAAutoriser)}
                >
                  Refuser
                </button>
              </div>
            ))
          )}
        </Panel>
      )}

      {!valideur && (
        <Panel>
          <DataTable
            columns={[
              { key: "n", label: "N°" },
              { key: "s", label: "Session" },
              { key: "m", label: "Montant" },
              { key: "b", label: "Bénéficiaire" },
              { key: "st", label: "Statut" },
              { key: "a", label: "Autorisé / refusé par" },
              { key: "d", label: "Date" },
              { key: "x", label: "Motif" },
              { key: "act", label: "" },
            ]}
            rows={state.decaissements.map((dec) => ({
              n: dec.numero,
              s: caisseNom(dec.session_caisse),
              m: formatMoney(num(dec.montant)),
              b: dec.beneficiaire || "—",
              st: <StatusBadge tone={STATUT_TONE[dec.statut]}>{STATUT_LABEL[dec.statut]}</StatusBadge>,
              a: dec.autorise_par ? userName(dec.autorise_par) : "—",
              d: formatDateTime(dec.date_decaissement),
              x: dec.statut === "REFUSE" ? `Refusé : ${dec.motif_refus}` : dec.motif,
              act: dec.statut === "AUTORISE" && dec.effectue_par === currentUser?.id && can("EFFECTUER_DECAISSEMENT") ? (
                <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "EFFECTUER_DECAISSEMENT", id: dec.id })}>
                  Effectuer la sortie
                </button>
              ) : "—",
            }))}
          />
        </Panel>
      )}
    </div>
  );
}
