"use client";

import { BadgeVersion } from "@/components/eau";
import { RefCrud } from "@/components/RefCrud";
import { PageHeader } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { BLOC_EAU_LABEL, JOURS_MARCHE_LABEL, moisCourant, optionsDe, versionsEnVigueur } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CaracteristiquesEquipement, JoursMarche } from "@/lib/types";

/**
 * Puissance et heures de marche standard des équipements du site eau (y compris la ligne de
 * production, pour répartir la facture d'électricité). Les heures standard sont reportées chaque
 * jour : les techniciens ne saisissent que les exceptions.
 */
export default function EquipementsEauPage() {
  const { state, can } = useStore();
  const writable = can("PARAM_EAU");
  const enVigueur = versionsEnVigueur(state.caracteristiquesEquipements, (c) => c.equipement);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Coût de l’eau"
        title="Équipements"
        description="Le bloc (Forage ou Traitement) se déduit de l’étape du poste de l’équipement ; un équipement de la ligne de production est hors coût de l’eau."
      />
      <RefCrud<CaracteristiquesEquipement>
        titre="Caractéristiques des équipements"
        items={[...state.caracteristiquesEquipements].sort((a, b) => a.equipement_code.localeCompare(b.equipement_code) || b.mois_application.localeCompare(a.mois_application))}
        endpoint={endpoints.caracteristiquesEquipements}
        refresh={["caracteristiquesEquipements"]}
        writable={writable}
        rechercheDans={(c) => [c.equipement_code, c.equipement_designation]}
        libelleItem={(c) => `${c.equipement_code} · ${c.mois_application}`}
        supprimable={(c) => !c.figee}
        vide="Aucune caractéristique."
        valeursInitiales={{ equipement: 0, puissance_kw: "", heures_marche_jour: "", jours_de_marche: "TOUS", pression_max_bar: "", mois_application: moisCourant(), motif: "" }}
        colonnes={[
          {
            cle: "e",
            label: "Équipement",
            rendu: (c) => (
              <span className="inline-flex flex-col">
                <span>{c.equipement_designation}</span>
                <span className="text-[11.5px] text-muted">
                  {c.equipement_code} · {c.bloc ? BLOC_EAU_LABEL[c.bloc].split(" (")[0] : "Hors coût de l’eau"}
                </span>
              </span>
            ),
          },
          { cle: "k", label: "Puissance", className: "text-right", rendu: (c) => <span className="num">{c.puissance_kw ? `${c.puissance_kw} kW` : "—"}</span> },
          {
            cle: "h",
            label: "Heures standard",
            rendu: (c) => (c.heures_marche_jour ? `${c.heures_marche_jour} h/jour · ${JOURS_MARCHE_LABEL[c.jours_de_marche].toLowerCase()}` : "—"),
          },
          { cle: "p", label: "Pression max", className: "text-right", rendu: (c) => <span className="num">{c.pression_max_bar ? `${c.pression_max_bar} bar` : "—"}</span> },
          { cle: "m", label: "À partir de", rendu: (c) => c.mois_application },
          { cle: "s", label: "", rendu: (c) => <BadgeVersion enVigueur={enVigueur.has(c)} figee={c.figee} avenir={c.mois_application > moisCourant()} /> },
        ]}
        champs={[
          {
            cle: "equipement",
            label: "Équipement",
            type: "select",
            requis: true,
            creationSeulement: true,
            pleineLargeur: true,
            options: state.equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })),
          },
          { cle: "puissance_kw", label: "Puissance (kW)", type: "number" },
          { cle: "heures_marche_jour", label: "Heures de marche standard par jour", type: "number", aide: "Ex : pompe du forage 24 h/jour." },
          { cle: "jours_de_marche", label: "Jours de marche", type: "select", options: optionsDe<JoursMarche>(JOURS_MARCHE_LABEL) },
          { cle: "pression_max_bar", label: "Pression maximale (bar)", type: "number", aide: "Membranes : au-delà, alerte aux techniciens." },
          { cle: "mois_application", label: "S’applique à partir de", type: "month", requis: true, creationSeulement: true },
          { cle: "motif", label: "Motif de la modification", pleineLargeur: true },
        ]}
      />
    </div>
  );
}
