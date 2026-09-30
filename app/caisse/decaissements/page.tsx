"use client";

import { useEffect, useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/api";
import { formatDateTime, formatMoney, num } from "@/lib/utils";
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

      {can("AUTORISER_DECAISSEMENT") && (
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
    </div>
  );
}
