"use client";

import { useEffect, useState } from "react";
import { useSiteEauParDefaut } from "@/components/eau";
import { RefCrud } from "@/components/RefCrud";
import { DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { STATUT_ECHEANCE_EAU, TYPE_INTERVENTION_EAU_LABEL, optionsDe } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { EcheancesMaintenanceEau, InterventionEau, TypeInterventionEau } from "@/lib/types";
import { dateISO, formatDate } from "@/lib/utils";

/**
 * Maintenance du site eau, sans aucun montant : échéances du plan préventif (les éléments de coût
 * « Préventive ») et fins de vie des pièces en place, puis interventions saisies par les techniciens.
 */
export default function MaintenanceEauPage() {
  const { state, can } = useStore();
  const defaut = useSiteEauParDefaut();
  const [choixUsine, setUsine] = useState(0);
  const usine = choixUsine || defaut;
  const [e, setE] = useState<EcheancesMaintenanceEau | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!usine) return;
    let actif = true;
    actions
      .echeancesMaintenanceEau(usine)
      .then((r) => {
        if (actif) {
          setE(r);
          setErreur(null);
        }
      })
      .catch((x: unknown) => {
        if (actif) {
          setE(null);
          setErreur(x instanceof Error ? x.message : "Échéances indisponibles.");
        }
      });
    return () => {
      actif = false;
    };
  }, [usine, state.interventionsEau, state.installationsEau]);

  // Opérations et pièces : depuis les éléments de coût si le profil les lit, sinon depuis les échéances (techniciens).
  const operations = state.elementsCoutEau.length
    ? state.elementsCoutEau.filter((x) => x.famille === "PREVENTIVE").map((x) => ({ value: x.id, label: x.libelle }))
    : (e?.preventive ?? []).map((x) => ({ value: x.operation, label: x.libelle }));
  const pieces = state.elementsCoutEau.length
    ? state.elementsCoutEau.filter((x) => x.famille === "ETALEE").map((x) => ({ value: x.id, label: x.libelle }))
    : [...new Map((e?.fins_de_vie ?? []).map((x) => [x.element, { value: x.element, label: x.libelle }])).values()];
  // Équipements du forage ou du traitement : ceux dont le poste est sur une étape amont.
  const etapesAmont = new Set(state.etapesStandard.filter((x) => x.phase === "AMONT").map((x) => x.id));
  const postesAmont = new Set(state.postes.filter((p) => etapesAmont.has(p.etape)).map((p) => p.id));
  const equipements = state.equipements.filter((x) => x.poste != null && postesAmont.has(x.poste));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Traitement de l’eau"
        title="Maintenance"
        description="Prochaine échéance = dernière intervention préventive + durée de la période ÷ fréquence (ex : 3 fois par an = tous les 122 jours). Alerte 7 jours avant."
        actions={
          <div className="w-60">
            <Field label="Site">
              <select className={inputClass} value={usine} onChange={(x) => setUsine(Number(x.target.value))}>
                {state.usines.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        }
      />
      {erreur && <p className="text-[12.5px] text-danger">{erreur}</p>}
      <div className="grid xl:grid-cols-2 gap-3">
        <Panel className="overflow-hidden">
          <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Plan préventif</h2>
          <DataTable
            emptyText="Aucune opération préventive chiffrée."
            columns={[
              { key: "o", label: "Opération" },
              { key: "f", label: "Fréquence" },
              { key: "d", label: "Dernière" },
              { key: "p", label: "Prochaine" },
              { key: "s", label: "" },
            ]}
            rows={(e?.preventive ?? []).map((x) => ({
              o: (
                <span className="inline-flex flex-col">
                  <span>{x.libelle}</span>
                  <span className="text-[11.5px] text-muted">
                    {x.etape}
                    {x.equipement ? ` · ${x.equipement}` : ""}
                  </span>
                </span>
              ),
              f: `${x.frequence} (tous les ${x.intervalle_jours} j)`,
              d: x.derniere_intervention ? formatDate(x.derniere_intervention) : "Jamais",
              p: `${formatDate(x.prochaine_echeance)} (${x.jours_restants >= 0 ? `dans ${x.jours_restants} j` : `${-x.jours_restants} j de retard`})`,
              s: <StatusBadge tone={STATUT_ECHEANCE_EAU[x.statut].tone}>{STATUT_ECHEANCE_EAU[x.statut].label}</StatusBadge>,
            }))}
          />
        </Panel>
        <Panel className="overflow-hidden">
          <h2 className="px-4 py-2.5 border-b border-line text-[13px] font-semibold">Pièces en place</h2>
          <DataTable
            emptyText="Aucune pièce enregistrée par le contrôle de gestion."
            columns={[
              { key: "p", label: "Pièce" },
              { key: "q", label: "En place", className: "text-right" },
              { key: "i", label: "Installée" },
              { key: "f", label: "Fin de vie" },
              { key: "s", label: "" },
            ]}
            rows={(e?.fins_de_vie ?? []).map((x) => ({
              p: `${x.libelle}${x.equipement ? ` · ${x.equipement}` : ""}`,
              q: <span className="num">{x.quantite_en_place}</span>,
              i: `${x.mois_installation} (${x.duree_vie_mois} mois)`,
              f: x.dernier_mois,
              s: <StatusBadge tone={STATUT_ECHEANCE_EAU[x.statut].tone}>{STATUT_ECHEANCE_EAU[x.statut].label}</StatusBadge>,
            }))}
          />
        </Panel>
      </div>
      <RefCrud<InterventionEau>
        titre="Interventions"
        description="Une réparation ou un remplacement prévient le contrôle de gestion et la comptabilité (facture à rattacher, nouvelle pièce à enregistrer)."
        items={state.interventionsEau}
        endpoint={endpoints.interventionsEau}
        refresh={["interventionsEau"]}
        writable={can("SAISIR_INTERVENTION_EAU")}
        rechercheDans={(x) => [x.equipement_code, x.description, x.operation_libelle, x.element_remplace_libelle]}
        libelleItem={(x) => `${TYPE_INTERVENTION_EAU_LABEL[x.type_intervention].split(" (")[0]} · ${x.equipement_code} · ${formatDate(x.date)}`}
        supprimable={(x) => !x.nouvelle_piece_enregistree}
        vide="Aucune intervention."
        valeursInitiales={{ equipement: 0, type_intervention: "PREVENTIVE", date: dateISO(), description: "", pieces_utilisees: "", operation: 0, element_remplace: 0, quantite_remplacee: "" }}
        colonnes={[
          { cle: "d", label: "Jour", rendu: (x) => formatDate(x.date) },
          { cle: "t", label: "Type", rendu: (x) => TYPE_INTERVENTION_EAU_LABEL[x.type_intervention].split(" (")[0] },
          { cle: "e", label: "Équipement", rendu: (x) => x.equipement_code },
          {
            cle: "o",
            label: "Objet",
            rendu: (x) => (
              <span className="inline-flex flex-col">
                <span>{x.operation_libelle ?? (x.element_remplace_libelle ? `${x.element_remplace_libelle} × ${x.quantite_remplacee}` : x.description)}</span>
                {(x.operation_libelle || x.element_remplace_libelle) && <span className="text-[11.5px] text-muted">{x.description}</span>}
              </span>
            ),
          },
          {
            cle: "s",
            label: "",
            rendu: (x) =>
              x.nouvelle_piece_enregistree === false ? (
                <StatusBadge tone="warning">Pièce à enregistrer</StatusBadge>
              ) : x.nouvelle_piece_enregistree ? (
                <StatusBadge tone="success">Pièce enregistrée</StatusBadge>
              ) : null,
          },
          { cle: "p", label: "Saisi par", rendu: (x) => x.saisi_par_nom ?? "—" },
        ]}
        champs={[
          { cle: "type_intervention", label: "Type", type: "select", requis: true, options: optionsDe<TypeInterventionEau>(TYPE_INTERVENTION_EAU_LABEL) },
          { cle: "date", label: "Date", type: "date", requis: true },
          {
            cle: "equipement",
            label: "Équipement",
            type: "select",
            requis: true,
            pleineLargeur: true,
            aide: "Équipements du forage ou du traitement (rattachés à un poste de ces étapes).",
            options: equipements.map((x) => ({ value: x.id, label: `${x.code} · ${x.designation}` })),
          },
          { cle: "operation", label: "Opération du plan", type: "select", requis: true, visible: (f) => f.type_intervention === "PREVENTIVE", options: operations },
          { cle: "element_remplace", label: "Pièce remplacée", type: "select", requis: true, visible: (f) => f.type_intervention === "REMPLACEMENT", options: pieces },
          { cle: "quantite_remplacee", label: "Quantité remplacée", type: "number", visible: (f) => f.type_intervention === "REMPLACEMENT", aide: "1 par défaut." },
          { cle: "description", label: "Description", type: "textarea", requis: true },
          { cle: "pieces_utilisees", label: "Pièces et produits utilisés", type: "textarea" },
        ]}
      />
    </div>
  );
}
