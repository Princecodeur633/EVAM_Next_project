"use client";

import { fcfaCentimes } from "@/components/eau";
import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { moisCourant } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { InstallationEau } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/**
 * Pièces étalées réellement en place, lot par lot (membranes, lampes, sable, équipements amortis).
 * Un lot qui en remplace un autre dégage la valeur résiduelle de l'ancien : charge exceptionnelle
 * du mois (membrane de 1 000 000 sur 48 mois remplacée après 12 mois → 750 000).
 */
export default function InstallationsEauPage() {
  const { state, can } = useStore();
  const writable = can("PARAM_EAU");
  const lots = [...state.installationsEau].sort((a, b) => a.element_libelle.localeCompare(b.element_libelle) || b.mois_installation.localeCompare(a.mois_installation));
  const remplacements = state.interventionsEau.filter((i) => i.type_intervention === "REMPLACEMENT");
  const mois = moisCourant();

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Coût de l’eau" title="Pièces installées" description="Chaque lot est étalé sur sa durée de vie à partir de son mois d’installation. Un lot déjà remplacé ne se modifie plus." />
      <RefCrud<InstallationEau>
        titre="Lots étalés"
        items={lots}
        endpoint={endpoints.installationsEau}
        refresh={["installationsEau", "interventionsEau"]}
        writable={writable}
        rechercheDans={(l) => [l.element_libelle, l.mois_installation, l.observations]}
        libelleItem={(l) => `${l.element_libelle} · ${l.mois_installation}`}
        supprimable={(l) => !state.installationsEau.some((x) => x.remplace === l.id)}
        vide="Aucune pièce enregistrée."
        valeursInitiales={{ element: 0, quantite: "1", prix_unitaire: "", duree_vie_mois: "", mois_installation: mois, remplace: 0, intervention: 0, observations: "" }}
        colonnes={[
          { cle: "e", label: "Pièce", rendu: (l) => l.element_libelle },
          { cle: "q", label: "Quantité × prix", className: "text-right", rendu: (l) => <span className="num">{l.quantite} × {fcfaCentimes(l.prix_unitaire)}</span> },
          { cle: "v", label: "Durée de vie", rendu: (l) => `${l.duree_vie_mois} mois : ${l.mois_installation} → ${l.dernier_mois}` },
          { cle: "m", label: "Étalé par mois", className: "text-right", rendu: (l) => <span className="num">{fcfaCentimes(l.montant_etale_mensuel)}</span> },
          {
            cle: "r",
            label: "Remplacement",
            rendu: (l) =>
              l.remplace ? (
                <span className="inline-flex flex-col">
                  <span>Valeur résiduelle {fcfaCentimes(l.valeur_residuelle)}</span>
                  <span className="text-[11.5px] text-muted">après {l.mois_deja_etales} mois étalés</span>
                </span>
              ) : (
                "—"
              ),
          },
          {
            cle: "s",
            label: "",
            rendu: (l) =>
              state.installationsEau.some((x) => x.remplace === l.id) ? (
                <StatusBadge tone="neutral">Remplacé</StatusBadge>
              ) : l.dernier_mois < mois ? (
                <StatusBadge tone="danger">Fin de vie dépassée</StatusBadge>
              ) : l.dernier_mois === mois ? (
                <StatusBadge tone="warning">Dernier mois</StatusBadge>
              ) : (
                <StatusBadge tone="success">En place</StatusBadge>
              ),
          },
        ]}
        champs={[
          {
            cle: "element",
            label: "Élément étalé",
            type: "select",
            requis: true,
            pleineLargeur: true,
            options: state.elementsCoutEau.filter((x) => x.famille === "ETALEE").map((x) => ({ value: x.id, label: x.libelle })),
          },
          { cle: "quantite", label: "Quantité", type: "number", requis: true },
          { cle: "prix_unitaire", label: "Prix unitaire HT (FCFA)", type: "number", requis: true },
          { cle: "duree_vie_mois", label: "Durée de vie (mois)", type: "number", requis: true },
          { cle: "mois_installation", label: "Mois d’installation", type: "month", requis: true, aide: "Premier mois étalé." },
          {
            cle: "remplace",
            label: "Lot remplacé",
            type: "select",
            aide: "Pour un remplacement : sa valeur résiduelle est imputée ce mois-ci.",
            options: state.installationsEau.map((x) => ({ value: x.id, label: `${x.element_libelle} · installé en ${x.mois_installation} (× ${x.quantite})` })),
          },
          {
            cle: "intervention",
            label: "Intervention de remplacement",
            type: "select",
            options: remplacements.map((i) => ({ value: i.id, label: `${i.element_remplace_libelle} · ${i.equipement_code} · ${formatDate(i.date)}` })),
          },
          { cle: "observations", label: "Observations", pleineLargeur: true },
        ]}
      />
    </div>
  );
}
