/**
 * Coût de l'eau traitée (module backend `eau`) : libellés des listes de valeurs et petites aides.
 * Les listes sont figées côté backend (TextChoices) ; /api/eau/listes/ les renvoie aussi.
 */
import type {
  BlocEau,
  CategorieChargeEau,
  CausePerteEau,
  FamilleChargeEau,
  JoursMarche,
  MotifArretEau,
  PeriodeEau,
  StatutStandardEau,
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
