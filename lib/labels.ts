import type {
  Etape,
  ModePaiement,
  MomentControle,
  MotifPerte,
  MotifRetour,
  OrigineBesoin,
  PeriodeRapport,
  Priorite,
  Profil,
  ResultatControleRetour,
  StatutAnomalie,
  StatutAvoir,
  StatutBL,
  StatutCommande,
  StatutCommandeFournisseur,
  StatutDemandeAchat,
  StatutDemandeComplementaire,
  StatutDemandeMatiere,
  StatutFacture,
  StatutFicheTechnique,
  StatutInventaire,
  StatutLot,
  StatutOF,
  StatutPlan,
  StatutPreparation,
  StatutReclamation,
  StatutReconditionnement,
  StatutRetourPhysique,
  StatutSession,
  TypeAnomalie,
  TypeArticle,
  TypeClient,
  TypeCloture,
  TypeCommande,
  TypeExport,
  TypeMouvement,
  TypeProbleme,
  TypeSolution,
  TypeSortie,
  UniteMesure,
} from "./types";

export const PROFIL_LABEL: Record<Profil, string> = {
  RESPONSABLE_PRODUCTION: "Responsable Production",
  AGENT_PRODUCTION: "Agent Production",
  MAGASINIER: "Magasinier",
  RESPONSABLE_QUALITE: "Responsable Qualité",
  RESPONSABLE_ACHATS: "Responsable Achat",
  COMMERCIAL: "Commercial",
  CAISSIER: "Caissier",
  RESPONSABLE_DISTRIBUTION: "Responsable Distribution",
  CHAUFFEUR: "Chauffeur / Livreur",
  COMPTABILITE_DAF: "Comptabilité / DAF",
  DIRECTION: "PDG / Direction",
  ADMIN_SI: "Administrateur SI",
};

export const ROLE_LABEL = PROFIL_LABEL;

export const TYPE_ARTICLE_LABEL: Record<TypeArticle, string> = {
  MATIERE_PREMIERE: "Matière première",
  PRODUIT_INTERMEDIAIRE: "Produit intermédiaire",
  PRODUIT_FINI: "Produit fini",
};

export const UNITE_LABEL: Record<UniteMesure, string> = {
  KG: "Kilogramme",
  L: "Litre",
  UNITE: "Unité",
  CARTON: "Carton",
  PALETTE: "Palette",
  M: "Mètre",
};

export const STATUT_FT_LABEL: Record<StatutFicheTechnique, string> = {
  BROUILLON: "Brouillon",
  VALIDEE: "Validée",
  ARCHIVEE: "Archivée",
};

export const PRIORITE_LABEL: Record<Priorite, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

export const STATUT_PLAN_LABEL: Record<StatutPlan, string> = {
  PREVISION: "Prévision",
  A_CONVERTIR_EN_OF: "À convertir en OF",
  CONVERTIE: "Convertie en OF",
  ANNULEE: "Annulée",
};

export const STATUT_OF_LABEL: Record<StatutOF, string> = {
  BROUILLON: "Brouillon",
  A_PREPARER: "À préparer",
  MATIERES_EN_PREPARATION: "Matières en préparation",
  PRET: "Prêt",
  EN_PRODUCTION: "En production",
  PRODUCTION_TERMINEE: "Production terminée",
  EN_CONTROLE: "En contrôle",
  CLOTURE: "Clôturé",
  ANNULE: "Annulé",
};

/** Workflow normal OF — ANNULE est une branche hors séquence. */
export const ORDRE_STATUTS_OF: StatutOF[] = [
  "BROUILLON",
  "A_PREPARER",
  "MATIERES_EN_PREPARATION",
  "PRET",
  "EN_PRODUCTION",
  "PRODUCTION_TERMINEE",
  "EN_CONTROLE",
  "CLOTURE",
];

export const ETAPE_LABEL: Record<Etape, string> = {
  CAPTAGE: "Captage",
  TRAITEMENT: "Traitement",
  SOUFFLAGE: "Soufflage",
  EMBOUTEILLAGE: "Embouteillage",
  ETIQUETAGE: "Étiquetage",
  CONDITIONNEMENT: "Conditionnement",
};

export const MOTIF_PERTE_LABEL: Record<MotifPerte, string> = {
  CASSE: "Casse",
  MAUVAIS_REGLAGE: "Mauvais réglage",
  FUITE: "Fuite",
  DEFAUT_MATIERE: "Défaut matière",
  DEFAUT_BOUTEILLE: "Défaut bouteille",
  CONTROLE_QUALITE: "Contrôle qualité",
  ARRET_MACHINE: "Arrêt machine",
  NETTOYAGE: "Nettoyage",
  ERREUR_OPERATEUR: "Erreur opérateur",
  AUTRE: "Autre",
};

export const STATUT_DEMANDE_MATIERE_LABEL: Record<StatutDemandeMatiere, string> = {
  A_PREPARER: "À préparer",
  PARTIELLEMENT_PREPAREE: "Partiellement préparée",
  PREPAREE: "Préparée",
  LIVREE_A_LA_PRODUCTION: "Livrée à la production",
  ANNULEE: "Annulée",
};

export const STATUT_DEMANDE_COMPLEMENTAIRE_LABEL: Record<StatutDemandeComplementaire, string> = {
  EN_ATTENTE: "En attente",
  APPROUVEE_ET_LIVREE: "Approuvée et livrée",
  REJETEE: "Rejetée",
};

export const MOMENT_CONTROLE_LABEL: Record<MomentControle, string> = {
  APRES_TRAITEMENT: "Après traitement",
  AVANT_LIBERATION: "Avant libération",
  FIN_DE_LIGNE: "Fin de ligne",
  RECEPTION: "À réception",
  AUTRE: "Autre",
};

export const STATUT_AVOIR_LABEL: Record<StatutAvoir, string> = {
  EMIS: "Émis",
  UTILISE: "Utilisé",
  ANNULE: "Annulé",
};

export const TYPE_PROBLEME_LABEL: Record<TypeProbleme, string> = {
  PRODUIT_DEFECTUEUX: "Produit défectueux",
  PRODUIT_MANQUANT: "Produit manquant",
  ERREUR_REFERENCE: "Erreur de référence",
  EMBALLAGE_ENDOMMAGE: "Emballage endommagé",
  PRODUIT_PERIME: "Produit périmé",
  AUTRE: "Autre",
};

export const STATUT_RECLAMATION_LABEL: Record<StatutReclamation, string> = {
  OUVERTE: "Ouverte",
  EN_COURS: "En cours",
  CLOTUREE: "Clôturée",
};

export const STATUT_RETOUR_PHYSIQUE_LABEL: Record<StatutRetourPhysique, string> = {
  EN_QUARANTAINE: "En quarantaine",
  CONTROLE_EFFECTUE: "Contrôle effectué",
};

export const RESULTAT_CONTROLE_RETOUR_LABEL: Record<ResultatControleRetour, string> = {
  RECUPERABLE_DIRECT: "Récupérable directement",
  RECUPERABLE_AVEC_INTERVENTION: "Récupérable avec intervention",
  NON_RECUPERABLE: "Non récupérable",
};

export const STATUT_RECONDITIONNEMENT_LABEL: Record<StatutReconditionnement, string> = {
  EN_ATTENTE: "En attente",
  TERMINE: "Terminé",
};

export const TYPE_SOLUTION_LABEL: Record<TypeSolution, string> = {
  REMPLACEMENT: "Remplacement",
  AVOIR: "Avoir",
  REMBOURSEMENT: "Remboursement",
};

export const PERIODE_RAPPORT_LABEL: Record<PeriodeRapport, string> = {
  JOURNALIER: "Journalier",
  MENSUEL: "Mensuel",
};

export const STATUT_LOT_LABEL: Record<StatutLot, string> = {
  EN_ATTENTE: "En attente",
  CONFORME: "Conforme",
  NON_CONFORME: "Non conforme",
  BLOQUE: "Bloqué",
  LIBERE: "Libéré",
};

export const TYPE_MVT_LABEL: Record<TypeMouvement, string> = {
  ENTREE: "Entrée",
  SORTIE: "Sortie",
  TRANSFERT: "Transfert",
  AJUSTEMENT: "Ajustement",
  RETOUR: "Retour",
};

export const STATUT_INV_LABEL: Record<StatutInventaire, string> = {
  EN_COURS: "En cours",
  CLOTURE: "Clôturé",
};

export const STATUT_DA_LABEL: Record<StatutDemandeAchat, string> = {
  EN_ATTENTE: "En attente",
  APPROUVEE: "Approuvée",
  REJETEE: "Rejetée",
  TRANSFORMEE: "Transformée",
};

export const STATUT_CF_LABEL: Record<StatutCommandeFournisseur, string> = {
  BROUILLON: "Brouillon",
  ENVOYEE: "Envoyée",
  PARTIELLEMENT_RECUE: "Partiellement reçue",
  RECUE: "Reçue",
  ANNULEE: "Annulée",
};

export const MOTIF_RETOUR_LABEL: Record<MotifRetour, string> = {
  NON_CONFORME: "Non conforme",
  ENDOMMAGE: "Endommagé",
  QUANTITE_EXCEDENTAIRE: "Quantité excédentaire",
  ERREUR_REFERENCE: "Erreur de référence",
  AUTRE: "Autre",
};

export const TYPE_COMMANDE_LABEL: Record<TypeCommande, string> = {
  COMPTANT: "Vente au comptant",
  CONTRAT: "Client sous contrat",
};

export const STATUT_CMD_LABEL: Record<StatutCommande, string> = {
  BROUILLON: "Brouillon",
  VALIDEE: "Validée",
  EN_PREPARATION: "En préparation",
  LIVREE: "Livrée",
  FACTUREE: "Facturée",
  ANNULEE: "Annulée",
};

export const STATUT_FACTURE_LABEL: Record<StatutFacture, string> = {
  EMISE: "Émise",
  PAYEE: "Payée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  ANNULEE: "Annulée",
};

export const MODE_PAIEMENT_LABEL: Record<ModePaiement, string> = {
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile money",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
};

export const STATUT_SESSION_LABEL: Record<StatutSession, string> = {
  OUVERTE: "Ouverte",
  CLOTUREE: "Clôturée",
};

export const STATUT_PREP_LABEL: Record<StatutPreparation, string> = {
  A_PREPARER: "À préparer",
  EN_PREPARATION: "En préparation",
  PRETE: "Prête",
  SORTIE_MAGASIN: "Sortie magasin",
};

export const STATUT_BL_LABEL: Record<StatutBL, string> = {
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  PARTIELLEMENT_LIVREE: "Partiellement livrée",
  RETOURNEE: "Retournée",
};

export const TYPE_CLIENT_LABEL: Record<TypeClient, string> = {
  PARTICULIER: "Particulier",
  SOCIETE: "Société",
  CONTRAT: "Contrat",
};

export const TYPE_SORTIE_LABEL: Record<TypeSortie, string> = {
  NORMALE: "Normale",
  COMPLEMENTAIRE: "Complémentaire",
};

export const ORIGINE_BESOIN_LABEL: Record<OrigineBesoin, string> = {
  AUTO_PRODUCTION: "Issu de la production",
  MANUEL: "Saisi manuellement",
};

export const TYPE_ANOMALIE_LABEL: Record<TypeAnomalie, string> = {
  ECART_STOCK: "Écart de stock",
  ECART_CAISSE: "Écart de caisse",
  DEPASSEMENT_MATIERE: "Dépassement matière",
  LOT_NON_LIBERE_VENDU: "Lot non libéré vendu",
  COMMANDE_CLIENT_BLOQUE: "Commande d’un client bloqué",
  AUTRE: "Autre",
};

export const STATUT_ANOMALIE_LABEL: Record<StatutAnomalie, string> = {
  DETECTEE: "Détectée",
  EN_TRAITEMENT: "En traitement",
  TRAITEE: "Traitée",
  IGNOREE: "Ignorée",
};

export const TYPE_EXPORT_LABEL: Record<TypeExport, string> = {
  VENTES: "Ventes",
  ENCAISSEMENTS: "Encaissements",
  ACHATS: "Achats",
  JOURNAL: "Journal",
};

export const TYPE_CLOTURE_LABEL: Record<TypeCloture, string> = {
  MENSUELLE: "Mensuelle",
  ANNUELLE: "Annuelle",
};

export function displayName(user: { first_name?: string; last_name?: string; username: string }) {
  const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return full || user.username;
}

export function isProfil(value: string): value is Profil {
  return (Object.keys(PROFIL_LABEL) as string[]).includes(value);
}
