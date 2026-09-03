import type {
  Etape,
  ModePaiement,
  MotifPerte,
  MotifRetour,
  OrigineBesoin,
  Priorite,
  Profil,
  StatutAnomalie,
  StatutBL,
  StatutCommande,
  StatutCommandeFournisseur,
  StatutDemandeAchat,
  StatutFacture,
  StatutFicheTechnique,
  StatutInventaire,
  StatutLot,
  StatutOF,
  StatutPlan,
  StatutPreparation,
  StatutSession,
  TypeAnomalie,
  TypeArticle,
  TypeClient,
  TypeCloture,
  TypeCommande,
  TypeExport,
  TypeMouvement,
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
  PREVU: "Prévu",
  EN_COURS: "En cours",
  REALISE: "Réalisé",
  ANNULE: "Annulé",
};

export const STATUT_OF_LABEL: Record<StatutOF, string> = {
  BROUILLON: "Brouillon",
  PLANIFIE: "Planifié",
  LANCE: "Lancé",
  EN_PRODUCTION: "En production",
  TERMINE: "Terminé",
  CONTROLE_QUALITE: "Contrôle qualité",
  LIBERE: "Libéré",
  CLOTURE: "Clôturé",
};

export const ORDRE_STATUTS_OF: StatutOF[] = [
  "BROUILLON",
  "PLANIFIE",
  "LANCE",
  "EN_PRODUCTION",
  "TERMINE",
  "CONTROLE_QUALITE",
  "LIBERE",
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
  NON_CONFORMITE: "Non-conformité",
  PANNE_MACHINE: "Panne machine",
  ERREUR_MANIPULATION: "Erreur de manipulation",
  AUTRE: "Autre",
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

const PROFIL_ALIASES: Record<string, Profil> = {
  ADMIN: "ADMIN_SI",
  ADMINSI: "ADMIN_SI",
  ADMINISTRATEUR: "ADMIN_SI",
  PDG: "DIRECTION",
  DIRECTION: "DIRECTION",
  PRODUCTION: "RESPONSABLE_PRODUCTION",
  RESP_PROD: "RESPONSABLE_PRODUCTION",
  AGENT: "AGENT_PRODUCTION",
  QUALITE: "RESPONSABLE_QUALITE",
  MAGASIN: "MAGASINIER",
  ACHATS: "RESPONSABLE_ACHATS",
  ACHAT: "RESPONSABLE_ACHATS",
  VENTE: "COMMERCIAL",
  CAISSE: "CAISSIER",
  DISTRIBUTION: "RESPONSABLE_DISTRIBUTION",
  LIVREUR: "CHAUFFEUR",
  DAF: "COMPTABILITE_DAF",
  COMPTABILITE: "COMPTABILITE_DAF",
};

export function isProfil(value: string): value is Profil {
  return (Object.keys(PROFIL_LABEL) as string[]).includes(value);
}

export function profilFromUsername(username: string): Profil | null {
  const key = username.trim().toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
  if (isProfil(key)) return key;
  return PROFIL_ALIASES[key] ?? PROFIL_ALIASES[key.replace(/_/g, "")] ?? null;
}
