"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, Guard, PageHeader, Panel, inputClass } from "@/components/ui";
import {
  RESULTAT_CONTROLE_RETOUR_LABEL,
  STATUT_RECLAMATION_LABEL,
  STATUT_RECONDITIONNEMENT_LABEL,
  STATUT_RETOUR_PHYSIQUE_LABEL,
  TYPE_PROBLEME_LABEL,
  TYPE_SOLUTION_LABEL,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty, num } from "@/lib/utils";
import type { ResultatControleRetour, TypeSolution } from "@/lib/types";

export default function ReclamationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, clientName, can, userName } = useStore();
  const reclamation = state.reclamations.find((r) => r.id === Number(id));
  const retour = state.retoursPhysiques.find((r) => r.reclamation === reclamation?.id);
  const controle = state.controlesRetour.find((c) => c.retour_physique === retour?.id);
  const recond = state.reconditionnements.find((r) => r.controle_retour === controle?.id);
  const solution = state.solutionsReclamation.find((s) => s.reclamation === reclamation?.id);

  const [qtyRetour, setQtyRetour] = useState(0);
  const [resultat, setResultat] = useState<ResultatControleRetour>("RECUPERABLE_DIRECT");
  const [obs, setObs] = useState("");
  const [typeSol, setTypeSol] = useState<TypeSolution>("AVOIR");
  const [montant, setMontant] = useState(0);
  const [qtyRecond, setQtyRecond] = useState(0);

  const qtyDefaut = useMemo(() => (reclamation ? num(reclamation.quantite) : 0), [reclamation]);

  if (!reclamation) {
    return <p className="text-[13px] text-muted">Réclamation introuvable.</p>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Réclamation"
        title={reclamation.numero}
        description={`${clientName(reclamation.client)} · ${articleName(reclamation.article)}`}
        status={<span className="text-[12px]">{STATUT_RECLAMATION_LABEL[reclamation.statut]}</span>}
      />
      <Panel className="p-4 space-y-2 text-[13px]">
        <p>Problème : {TYPE_PROBLEME_LABEL[reclamation.type_probleme]}</p>
        <p>Quantité : {formatQty(qtyDefaut, 2)}</p>
        <p>Description : {reclamation.description}</p>
        <p>Créée le {formatDateTime(reclamation.date_creation)} par {userName(reclamation.cree_par)}</p>
        <p>Produit retourné : {reclamation.produit_retourne ? "Oui" : "Non"}</p>
      </Panel>

      {!retour && can("CREATE_RETOUR_PHYSIQUE") && reclamation.produit_retourne && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Retour physique (quarantaine)</h2>
          <Field label="Quantité retournée">
            <input
              type="number"
              className={inputClass}
              value={qtyRetour || qtyDefaut}
              onChange={(e) => setQtyRetour(Number(e.target.value))}
            />
          </Field>
          <Button
            onClick={() =>
              void dispatch({
                type: "CREATE_RETOUR_PHYSIQUE",
                reclamation: reclamation.id,
                quantite_retournee: qtyRetour || qtyDefaut,
              })
            }
          >
            Réceptionner en quarantaine
          </Button>
        </Panel>
      )}

      {retour && (
        <Panel className="p-4 text-[13px] space-y-1">
          <h2 className="font-semibold">Retour physique</h2>
          <p>Statut : {STATUT_RETOUR_PHYSIQUE_LABEL[retour.statut]}</p>
          <p>Qté : {formatQty(num(retour.quantite_retournee), 2)}</p>
        </Panel>
      )}

      {retour && !controle && can("CREATE_CONTROLE_RETOUR") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Contrôle retour</h2>
          <Field label="Résultat">
            <select className={inputClass} value={resultat} onChange={(e) => setResultat(e.target.value as ResultatControleRetour)}>
              {(Object.keys(RESULTAT_CONTROLE_RETOUR_LABEL) as ResultatControleRetour[]).map((k) => (
                <option key={k} value={k}>{RESULTAT_CONTROLE_RETOUR_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Observations">
            <input className={inputClass} value={obs} onChange={(e) => setObs(e.target.value)} />
          </Field>
          <Button
            onClick={() =>
              void dispatch({
                type: "CREATE_CONTROLE_RETOUR",
                retour_physique: retour.id,
                resultat,
                observations: obs,
              })
            }
          >
            Enregistrer le contrôle
          </Button>
        </Panel>
      )}

      {controle && (
        <Guard variant="ok" title={RESULTAT_CONTROLE_RETOUR_LABEL[controle.resultat]}>
          Décision appliquée automatiquement (réintégration, reconditionnement ou rebut).
        </Guard>
      )}

      {recond && (
        <Panel className="p-4 space-y-3">
          <h2 className="text-[13px] font-semibold">
            Reconditionnement · {STATUT_RECONDITIONNEMENT_LABEL[recond.statut]}
          </h2>
          {can("TERMINER_RECONDITIONNEMENT") && recond.statut === "EN_ATTENTE" && (
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <Field label="Quantité reconditionnée">
                <input type="number" className={inputClass} value={qtyRecond || qtyDefaut} onChange={(e) => setQtyRecond(Number(e.target.value))} />
              </Field>
              <Button
                onClick={() =>
                  void dispatch({
                    type: "TERMINER_RECONDITIONNEMENT",
                    id: recond.id,
                    quantite_reconditionnee: qtyRecond || qtyDefaut,
                  })
                }
              >
                Terminer & réintégrer
              </Button>
            </div>
          )}
        </Panel>
      )}

      {!solution && can("CREATE_SOLUTION") && reclamation.statut !== "CLOTUREE" && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Solution client</h2>
          <Field label="Type">
            <select className={inputClass} value={typeSol} onChange={(e) => setTypeSol(e.target.value as TypeSolution)}>
              {(Object.keys(TYPE_SOLUTION_LABEL) as TypeSolution[]).map((k) => (
                <option key={k} value={k}>{TYPE_SOLUTION_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Montant (avoir / remboursement)">
            <input type="number" className={inputClass} value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
          </Field>
          <Button
            onClick={() =>
              void dispatch({
                type: "CREATE_SOLUTION",
                reclamation: reclamation.id,
                type_solution: typeSol,
                montant_avoir: typeSol === "AVOIR" ? montant : undefined,
                montant_rembourse: typeSol === "REMBOURSEMENT" ? montant : undefined,
              })
            }
          >
            Appliquer la solution
          </Button>
        </Panel>
      )}

      {solution && (
        <Guard variant="ok" title={`Solution : ${TYPE_SOLUTION_LABEL[solution.type_solution]}`}>
          La réclamation est clôturée automatiquement à l’enregistrement de la solution.
        </Guard>
      )}
    </div>
  );
}
