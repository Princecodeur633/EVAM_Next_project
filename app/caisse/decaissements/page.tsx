"use client";

import { useEffect, useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { displayName } from "@/lib/labels";
import { formatDateTime, formatMoney, num } from "@/lib/utils";

export default function DecaissementsPage() {
  const { state, dispatch, can, userName, currentUser } = useStore();
  const sessionsOuvertes = state.sessionsCaisse.filter((s) => s.statut === "OUVERTE");
  const [session, setSession] = useState(sessionsOuvertes[0]?.id ?? 0);
  useEffect(() => {
    if (!session && sessionsOuvertes[0]) setSession(sessionsOuvertes[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsOuvertes.length]);
  const [montant, setMontant] = useState(0);
  const [motif, setMotif] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [autorisePar, setAutorisePar] = useState(0);

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
        description="Sortie de caisse autorisée (remboursement, dépense de fonctionnement) : nécessite toujours une session ouverte, un motif et une autorisation."
      />
      {can("CREATE_DECAISSEMENT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          {sessionsOuvertes.length > 1 ? (
            <Field label="Session de caisse (ouverte)">
              <select className={inputClass} value={session} onChange={(e) => setSession(Number(e.target.value))}>
                <option value={0}>—</option>
                {sessionsOuvertes.map((s) => <option key={s.id} value={s.id}>{caisseNom(s.id)}</option>)}
              </select>
            </Field>
          ) : (
            <p className="text-[13px] text-muted">
              Session : {sessionsOuvertes[0] ? caisseNom(sessionsOuvertes[0].id) : "aucune session ouverte"}
            </p>
          )}
          <Field label="Montant">
            <input type="number" className={inputClass} value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
          </Field>
          <Field label="Bénéficiaire">
            <input className={inputClass} value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} />
          </Field>
          <Field label="Autorisé par">
            <select className={inputClass} value={autorisePar} onChange={(e) => setAutorisePar(Number(e.target.value))}>
              <option value={0}>—</option>
              {/* Le backend refuse qu'on s'autorise soi-même (DecaissementSerializer.validate) */}
              {state.utilisateurs.filter((u) => u.actif && u.id !== currentUser?.id).map((u) => (
                <option key={u.id} value={u.id}>{displayName(u)}</option>
              ))}
            </select>
          </Field>
          <Field label="Motif">
            <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Field>
          <Button
            disabled={!session || montant <= 0 || !motif.trim() || !autorisePar}
            onClick={() =>
              void dispatch({
                type: "CREATE_DECAISSEMENT",
                session_caisse: session,
                montant,
                motif: motif.trim(),
                autorise_par: autorisePar,
                beneficiaire: beneficiaire.trim(),
              })
            }
          >
            Décaisser
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "s", label: "Session" },
            { key: "m", label: "Montant" },
            { key: "b", label: "Bénéficiaire" },
            { key: "a", label: "Autorisé par" },
            { key: "d", label: "Date" },
            { key: "x", label: "Motif" },
          ]}
          rows={state.decaissements.map((dec) => ({
            n: dec.numero,
            s: caisseNom(dec.session_caisse),
            m: formatMoney(num(dec.montant)),
            b: dec.beneficiaire || "—",
            a: userName(dec.autorise_par),
            d: formatDateTime(dec.date_decaissement),
            x: dec.motif,
          }))}
        />
      </Panel>
    </div>
  );
}
