/**
 * Coût de l'eau traitée (module backend `eau`) : libellés des listes de valeurs et petites aides.
 * Les listes sont figées côté backend (TextChoices) ; /api/eau/listes/ les renvoie aussi.
 */
import type {
  BlocEau,
  CategorieChargeEau,
  DecisionRevisionEau,
  StatutChargeAttendueEau,
  ValorisationSortiesStockEau,
  CausePerteEau,
  FamilleChargeEau,
  JoursMarche,
  MotifArretEau,
  PeriodeEau,
  StatutEcheanceEau,
  StatutStandardEau,
  TypeInterventionEau,
  TypeCompteurEau,
  TypePerteEau,
} from "./types";
import { dateISO } from "./utils";

export const BLOC_EAU_LABEL: Record<BlocEau, string> = {
  FORAGE: "Forage (commun aux deux sites)",
  TRAITEMENT: "Traitement de l’eau (site eau)",
};

export const FAMILLE_CHARGE_LABEL: Record<FamilleChargeEau, string> = {
  COURANTE: "Courante",
  ETALEE: "Étalée",
  PREVENTIVE: "Préventive",
  AU_BESOIN: "Au besoin",
};

/** Comment chaque famille se calcule dans le prévisionnel (onglet Paramétrage du classeur). */
export const FORMULE_FAMILLE: Record<FamilleChargeEau, string> = {
  COURANTE: "Quantité × prix × fréquence × coefficient de période × part site eau",
  ETALEE: "Quantité × prix ÷ durée de vie (mois) × part site eau",
  PREVENTIVE: "Quantité × prix × fréquence × coefficient de période × part site eau",
  AU_BESOIN: "Jamais prévue : comptée en réel le mois où elle arrive",
};

export const CATEGORIE_CHARGE_LABEL: Record<CategorieChargeEau, string> = {
  ELECTRICITE: "Électricité",
  CARBURANT: "Carburant",
  AMORTISSEMENT: "Amortissement",
  DUREE_DE_VIE: "Élément à durée de vie",
  CONSOMMABLE: "Consommable",
  ANALYSE: "Analyse",
  MAINTENANCE_PREVENTIVE: "Maintenance préventive",
  MAINTENANCE_AU_BESOIN: "Maintenance au besoin",
};

export const PERIODE_EAU_LABEL: Record<PeriodeEau, string> = {
  JOUR: "Jour (× 365 / 12)",
  SEMAINE: "Semaine (× 52 / 12)",
  MOIS: "Mois (× 1)",
  AN: "An (÷ 12)",
};

export const JOURS_MARCHE_LABEL: Record<JoursMarche, string> = {
  TOUS: "Tous les jours",
  LUNDI_SAMEDI: "Du lundi au samedi",
  LUNDI_VENDREDI: "Du lundi au vendredi",
};

export const TYPE_COMPTEUR_LABEL: Record<TypeCompteurEau, string> = {
  COMPTEUR_FORAGE: "Compteur du forage (eau captée au total)",
  DEBITMETRE: "Débitmètre forage → site",
};

export const MOTIF_ARRET_LABEL: Record<MotifArretEau, string> = {
  ARRET_PROGRAMME: "Arrêt programmé",
  PANNE: "Panne",
  LIGNE_ARRETEE: "Ligne à l’arrêt",
  MAINTENANCE: "Maintenance",
  COUPURE_COURANT: "Coupure de courant",
  AUTRE: "Autre",
};

export const CAUSE_PERTE_EAU_LABEL: Record<CausePerteEau, string> = {
  RINCAGE_BOUTEILLES: "Rinçage des bouteilles",
  LAVAGE_FILTRES: "Lavage des filtres",
  CIP: "Eau brute du CIP",
  REJET_ULTRAFILTRATION: "Rejets de l’ultrafiltration",
  FUITE: "Fuite",
  DEBORDEMENT: "Débordement",
  LOT_REJETE: "Lot rejeté",
  CASSE: "Casse",
  AUTRE: "Autre",
};

export const TYPE_PERTE_EAU_LABEL: Record<TypePerteEau, string> = {
  NORMALE: "Normale",
  ANORMALE: "Anormale",
};

export const STATUT_STANDARD_EAU_LABEL: Record<StatutStandardEau, string> = {
  PROPOSE: "Proposé",
  VALIDE: "Validé",
  REJETE: "Rejeté",
};

export const TYPE_INTERVENTION_EAU_LABEL: Record<TypeInterventionEau, string> = {
  PREVENTIVE: "Préventive (plan de maintenance)",
  AU_BESOIN: "Au besoin (panne, réparation)",
  REMPLACEMENT: "Remplacement d’une pièce",
};

export const STATUT_ECHEANCE_EAU: Record<StatutEcheanceEau, { label: string; tone: "danger" | "warning" | "info" | "success" }> = {
  EN_RETARD: { label: "En retard", tone: "danger" },
  A_FAIRE: { label: "À faire (7 jours)", tone: "warning" },
  A_VENIR: { label: "À venir", tone: "info" },
  FIN_DE_VIE_PROCHE: { label: "Dernier mois", tone: "warning" },
  FIN_DE_VIE_DEPASSEE: { label: "Fin de vie dépassée", tone: "danger" },
  EN_SERVICE: { label: "En service", tone: "success" },
};

export const DECISION_REVISION_EAU: Record<DecisionRevisionEau, { label: string; tone: "success" | "info" | "warning" }> = {
  MAINTENU: { label: "Standard maintenu", tone: "success" },
  MAINTENU_VOLUME_FAIBLE: { label: "Standard maintenu (volume trop faible)", tone: "info" },
  NOUVEAU_PROPOSE: { label: "Nouveau standard proposé", tone: "warning" },
};

export const STATUT_CHARGE_ATTENDUE_EAU: Record<StatutChargeAttendueEau, { label: string; tone: "success" | "info" | "danger" }> = {
  IMPUTEE: { label: "Imputée", tone: "success" },
  VALIDEE_SANS_IMPUTATION: { label: "Sans imputation", tone: "info" },
  MANQUANTE: { label: "Manquante", tone: "danger" },
};

export const VALORISATION_SORTIES_LABEL: Record<ValorisationSortiesStockEau, string> = {
  PEPS: "PEPS / FIFO (premier entré, premier sorti)",
  CMUP: "CMUP (coût moyen pondéré)",
};

/** Mois précédent (AAAA-MM) : par défaut, le mois à clôturer. */
export function moisPrecedent(mois: string) {
  const [a, m] = mois.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

export const optionsDe = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));

/** Mois courant au format AAAA-MM. */
export const moisCourant = () => dateISO().slice(0, 7);

/** Mois suivant (AAAA-MM). */
export function moisSuivant(mois: string) {
  const [a, m] = mois.split("-").map(Number);
  return `${a + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, "0")}`;
}

/** Une version par clé : la plus récente déjà applicable au mois donné (paramètres sans effet rétroactif). */
export function versionsEnVigueur<T extends { mois_application: string }>(items: T[], cle: (x: T) => string | number, mois = moisCourant()) {
  const retenues = new Map<string | number, T>();
  for (const x of items) {
    if (x.mois_application > mois) continue;
    const k = cle(x);
    const deja = retenues.get(k);
    if (!deja || deja.mois_application < x.mois_application) retenues.set(k, x);
  }
  return new Set(retenues.values());
}
