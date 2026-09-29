"use client";

import { useState } from "react";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { STATUT_SESSION_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime, num } from "@/lib/utils";

export default function SessionsCaissePage() {
  const { state, dispatch, can, userName, currentUser } = useStore();
  const [compte, setCompte] = useState<Record<number, string>>({});
  const [justif, setJustif] = useState<Record<number, string>>({});
  const caisseNom = (id: number) => state.caisses.find((c) => c.id === id)?.nom ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Caisse"
        title="Sessions de caisse"
        description="Clôturez en indiquant le solde compté : le solde théorique est calculé automatiquement. En cas d’écart, la justification est obligatoire — sans elle, la clôture est refusée."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "c", label: "Caisse" },
            { key: "caissier", label: "Caissier" },
            { key: "s", label: "Statut" },
            { key: "o", label: "Ouverture" },
            { key: "dec", label: "Décaissements" },
            { key: "th", label: "Théorique" },
            { key: "act", label: "" },
          ]}
          rows={state.sessionsCaisse.map((s) => {
            // Seul le caissier de la session peut la clôturer (revérifié côté serveur, sauf superutilisateur).
            const estMaSession = s.caissier === currentUser?.id;
            return {
              c: caisseNom(s.caisse),
              caissier: userName(s.caissier),
              s: <StatusBadge tone={s.statut === "OUVERTE" ? "warning" : "success"}>{STATUT_SESSION_LABEL[s.statut]}</StatusBadge>,
              o: formatDateTime(s.date_ouverture),
              dec: formatDa(state.decaissements.filter((d) => d.session_caisse === s.id).reduce((a, d) => a + num(d.montant), 0)),
              th: formatDa(num(s.statut === "OUVERTE" ? s.solde_theorique_actuel : s.solde_theorique_cloture)),
              act: s.statut === "OUVERTE" && estMaSession && can("CLOTURER_CAISSE") ? (
                <span className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                  <input
                    className="h-8 w-full sm:w-24 border border-line rounded px-2 text-[12px]"
                    placeholder="Solde compté"
                    value={compte[s.id] ?? ""}
                    onChange={(e) => setCompte((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                  <input
                    className="h-8 w-full sm:w-40 border border-line rounded px-2 text-[12px]"
                    placeholder="Justification (si écart)"
                    value={justif[s.id] ?? ""}
                    onChange={(e) => setJustif((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                  <button
                    className="text-primary text-[12px] whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!compte[s.id]?.trim()}
                    onClick={() => void dispatch({ type: "CLOTURER_CAISSE", id: s.id, solde_compte: compte[s.id], justification: justif[s.id]?.trim() || undefined })}
                  >
                    Clôturer
                  </button>
                </span>
              ) : s.statut === "OUVERTE" ? "—" : formatDa(num(s.solde_compte_cloture)),
            };
          })}
        />
      </Panel>
      <Panel className="p-4 space-y-2">
        <h2 className="text-[13px] font-semibold">Écarts de caisse</h2>
        <p className="text-[12px] text-muted">
          Un écart se justifie au moment de la clôture (ci-dessus), pas après — il est enregistré automatiquement s’il y en a un.
        </p>
        {state.ecartsCaisse.length === 0 ? (
          <p className="text-[13px] text-muted">Aucun écart enregistré.</p>
        ) : (
          state.ecartsCaisse.map((e) => (
            <p key={e.id} className="text-[13px]">
              Écart {formatDa(num(e.montant_ecart))} · {e.justification}
              {e.valide_par ? <span className="text-muted"> · validé par {userName(e.valide_par)}</span> : null}
            </p>
          ))
        )}
      </Panel>
    </div>
  );
}
