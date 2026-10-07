import type {
  ActionImmediate,
  BaseCalcul,
  CategorieCout,
  CategorieEconomique,
  DecisionNC,
  Declencheur,
  EtapeStandard,
  FamilleParametre,
  Inducteur,
  Laboratoire,
  ModeApprovisionnement,
  NaturePerte,
  NiveauRepartition,
  PhaseEtape,
  StatutCircuit,
  StatutControleRealise,
  StatutDonnee,
  StatutLotMatiere,
  StatutNC,
  StatutPointControle,
  StatutRepartition,
  StatutTransfert,
  Traitement,
  TypeEquipement,
  TypeLieu,
  TypeResultat,
  UniteReference,
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
  EMBALLAGE: "Emballage",
  CONSOMMABLE: "Consommable",
  FLUIDE_PROCESS: "Fluide de process",
};

/** Articles achetés et consommés, jamais fabriqués par un OF (TYPES_NON_FABRIQUES côté backend). */
export const TYPES_ACHETES: TypeArticle[] = ["MATIERE_PREMIERE", "EMBALLAGE", "CONSOMMABLE"];
/** Articles pouvant entrer dans une composition (TYPES_COMPOSANTS côté backend). */
export const TYPES_COMPOSANTS: TypeArticle[] = ["MATIERE_PREMIERE", "PRODUIT_INTERMEDIAIRE", "EMBALLAGE", "CONSOMMABLE", "FLUIDE_PROCESS"];
/** Articles fabriqués par un OF (produit fini, intermédiaire, fluide de process). */
export const TYPES_FABRIQUES: TypeArticle[] = ["PRODUIT_FINI", "PRODUIT_INTERMEDIAIRE", "FLUIDE_PROCESS"];

export const UNITE_LABEL: Record<UniteMesure, string> = {
  KG: "Kilogramme",
  G: "Gramme",
  L: "Litre",
  CL: "Centilitre",
  M3: "Mètre cube",
  UNITE: "Unité",
  BOUTEILLE: "Bouteille",
  POT: "Pot",
  PACK: "Pack",
  CARTON: "Carton",
  SAC: "Sac",
  PALETTE: "Palette",
  M: "Mètre",
};

export const MODE_APPRO_LABEL: Record<ModeApprovisionnement, string> = {
  ACHETE: "Acheté",
  FABRIQUE: "Fabriqué",
  PROCESS: "Produit par le process",
};

export const STATUT_FT_LABEL: Record<StatutFicheTechnique, string> = {
  BROUILLON: "Brouillon",
  EN_TEST: "En test",
  VALIDEE: "Validée",
  ARCHIVEE: "Remplacée / archivée",
};

export const UNITE_REFERENCE_LABEL: Record<UniteReference, string> = {
  UNITE_STOCK: "Unité de stock du produit",
  L: "Litre de produit",
  KG: "Kilogramme de produit",
};

export const BASE_CALCUL_LABEL: Record<BaseCalcul, string> = {
  REFERENCE: "Quantité de référence",
  UNITE: "Par bouteille / pot",
  PACK: "Par pack / carton",
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

/** Libellés de repli des étapes ; la référence est le paramétrage industriel (EtapeStandard). */
export const ETAPE_LABEL: Record<string, string> = {
  CAPTAGE: "Captage / forage",
  TRAITEMENT: "Traitement de l'eau",
  DECANTATION: "Décantation",
  FILTRATION: "Filtration / traitement",
  CUVE_TAMPON: "Cuve tampon",
  UV: "Traitement UV",
  STOCKAGE_PROCESS: "Stockage process",
  PREPARATION: "Préparation du produit",
  TRAITEMENT_THERMIQUE: "Traitement thermique",
  SOUFFLAGE: "Soufflage",
  REMPLISSAGE: "Remplissage",
  EMBOUTEILLAGE: "Remplissage",
  BOUCHAGE: "Bouchage",
  ETIQUETAGE: "Étiquetage",
  CONDITIONNEMENT: "Conditionnement",
  PALETTISATION: "Palettisation",
  STOCKAGE_PF: "Stockage produit fini",
  DISTRIBUTION: "Distribution",
};

/** Libellé d'une étape : d'abord le paramétrage industriel, sinon le libellé de repli, sinon le code. */
export function etapeLibelle(code: string | null | undefined, etapes: EtapeStandard[] = []) {
  if (!code) return "—";
  return etapes.find((e) => e.code === code)?.libelle ?? ETAPE_LABEL[code] ?? code;
}

export const PHASE_ETAPE_LABEL: Record<PhaseEtape, string> = {
  AMONT: "Amont (eau)",
  PREPARATION: "Préparation",
  CONDITIONNEMENT: "Remplissage et conditionnement",
  APRES_PRODUCTION: "Après production",
};

export const TYPE_EQUIPEMENT_LABEL: Record<TypeEquipement, string> = {
  FORAGE: "Forage / captage",
  POMPE: "Pompe",
  TRAITEMENT: "Traitement de l'eau",
  CUVE: "Cuve",
  MELANGEUR: "Mélangeur",
  PASTEURISATEUR: "Pasteurisateur",
  SOUFFLEUSE: "Souffleuse",
  REMPLISSEUSE: "Remplisseuse",
  BOUCHEUSE: "Boucheuse / operculeuse",
  ETIQUETEUSE: "Étiqueteuse",
  FARDELEUSE: "Fardeleuse",
  PALETTISEUR: "Palettiseur",
  LABORATOIRE: "Laboratoire",
  AUTRE: "Autre",
};

export const STATUT_CIRCUIT_LABEL: Record<StatutCircuit, string> = {
  BROUILLON: "Brouillon",
  VALIDE: "Validé",
  ARCHIVE: "Archivé",
};

export const NATURE_PERTE_LABEL: Record<NaturePerte, string> = {
  PREFORMES_REJETEES: "Préformes rejetées (soufflage)",
  SUR_REMPLISSAGE: "Sur-remplissage",
  REBUT_REMPLISSAGE: "Rebuts de remplissage",
  ETIQUETTES: "Étiquettes perdues",
  FILM: "Film perdu (plastification)",
  PACKS_NON_CONFORMES: "Packs non conformes",
  CONCENTRE_REJETE: "Concentré rejeté (osmose)",
  EAU: "Perte d'eau",
  PRODUIT_DEMARRAGE: "Rebuts de démarrage",
  CASSE_STOCKAGE: "Casse en stockage",
  AUTRE: "Autre",
};

export const TYPE_LIEU_LABEL: Record<TypeLieu, string> = {
  MAGASIN_MATIERES: "Magasin matières (usine)",
  STOCK_USINE: "Stock usine (produits finis)",
  DEPOT_EXTERIEUR: "Dépôt extérieur / point de vente",
  QUARANTAINE: "Quarantaine",
};

export const STATUT_LOT_MATIERE_LABEL: Record<StatutLotMatiere, string> = {
  A_CONTROLER: "À contrôler",
  LIBERE: "Libéré",
  BLOQUE: "Bloqué",
  EPUISE: "Épuisé",
};

export const STATUT_TRANSFERT_LABEL: Record<StatutTransfert, string> = {
  BROUILLON: "Brouillon",
  EXPEDIE: "Expédié (en transit)",
  RECU: "Reçu",
  ANNULE: "Annulé",
};

export const FAMILLE_PARAMETRE_LABEL: Record<FamilleParametre, string> = {
  PHYSICO_CHIMIQUE: "Physico-chimique",
  MICROBIOLOGIQUE: "Microbiologique",
  ORGANOLEPTIQUE: "Organoleptique",
  PROCESS: "Process",
  CONDITIONNEMENT: "Conditionnement",
  MATIERE: "Matière / réception",
  DOCUMENTAIRE: "Documentaire",
};

export const TYPE_RESULTAT_LABEL: Record<TypeResultat, string> = {
  NUMERIQUE: "Valeur mesurée",
  QUALITATIF: "Conforme / non conforme",
};

export const LABORATOIRE_LABEL: Record<Laboratoire, string> = {
  LIGNE: "Sur ligne (opérateur)",
  INTERNE: "Laboratoire interne",
  EXTERNE: "Laboratoire externe",
};

export const DECLENCHEUR_LABEL: Record<Declencheur, string> = {
  RECEPTION: "À la réception (lot matière)",
  DEMARRAGE: "Au démarrage de l'OF",
  CHAQUE_OF: "Une fois par OF",
  CHAQUE_LOT: "À chaque lot",
  PERIODIQUE: "Périodique (toutes les X min)",
  CHANGEMENT_SERIE: "Après changement de série",
  PONCTUEL: "Ponctuel",
};

export const STATUT_POINT_CONTROLE_LABEL: Record<StatutPointControle, string> = {
  BROUILLON: "Brouillon",
  ACTIF: "Actif",
  INACTIF: "Inactif",
};

export const STATUT_CONTROLE_REALISE_LABEL: Record<StatutControleRealise, string> = {
  A_REALISER: "À réaliser",
  EN_ATTENTE_VALIDATION: "Au laboratoire",
  CONFORME: "Conforme",
  NON_CONFORME: "Non conforme",
  ANNULE: "Annulé",
};

export const STATUT_NC_LABEL: Record<StatutNC, string> = {
  OUVERTE: "Ouverte",
  EN_COURS: "Action en cours",
  CLOTUREE: "Clôturée",
};

export const ACTION_IMMEDIATE_LABEL: Record<ActionImmediate, string> = {
  ALERTE: "Alerte",
  ARRET: "Arrêt production",
  BLOCAGE_LOT: "Blocage du lot",
  NOUVEAU_CONTROLE: "Nouveau contrôle",
  CONTRE_ANALYSE: "Contre-analyse",
  REGLAGE: "Réglage machine",
  NETTOYAGE: "Nettoyage / désinfection",
  CORRECTION_FORMULATION: "Correction de formulation",
  QUARANTAINE: "Quarantaine",
};

export const DECISION_NC_LABEL: Record<DecisionNC, string> = {
  LIBERATION: "Libération (reprise conforme)",
  REPRISE: "Reprise / retraitement",
  REJET: "Rejet",
  QUARANTAINE: "Maintien en quarantaine",
};

export const INDUCTEUR_LABEL: Record<Inducteur, string> = {
  VOLUME_EAU_M3: "Volume d'eau (m³)",
  BOUTEILLES: "Bouteilles / pots produits",
  PACKS: "Packs / cartons",
  PALETTES: "Palettes",
  LITRES_PRODUITS: "Litres produits",
  HEURES_MACHINE: "Heures machine",
  HEURES_MO: "Heures de main-d'œuvre",
  KWH: "kWh",
  ANALYSES_PONDEREES: "Analyses pondérées",
  PALETTES_JOURS: "Palettes-jours (stockage)",
  KM: "Kilomètres (tournées)",
  QUANTITE_LIVREE: "Quantité livrée",
  AUCUN: "Aucun (charge directe)",
};

export const CATEGORIE_COUT_LABEL: Record<CategorieCout, string> = {
  PRODUCTION: "Coût de production",
  STOCKAGE: "Stockage produit fini",
  DISTRIBUTION: "Distribution",
  HORS_COUT: "Frais généraux non incorporés",
};

export const TRAITEMENT_LABEL: Record<Traitement, string> = {
  DIRECT: "Direct",
  INDIRECT: "Indirect (réparti par clé)",
};

export const CATEGORIE_ECONOMIQUE_LABEL: Record<CategorieEconomique, string> = {
  ENERGIE: "Énergie",
  MAINTENANCE: "Maintenance",
  PIECES: "Pièces / lubrifiants",
  MAIN_OEUVRE: "Main-d'œuvre",
  AMORTISSEMENT: "Amortissement",
  PRODUITS_TRAITEMENT: "Produits de traitement / nettoyage",
  ANALYSES: "Analyses / laboratoire",
  EMBALLAGES: "Emballages / consommables",
  LOCATION: "Bâtiment / location",
  CARBURANT: "Carburant / péages",
  SOUS_TRAITANCE: "Sous-traitance",
  AUTRE: "Autre",
};

export const STATUT_DONNEE_LABEL: Record<StatutDonnee, string> = {
  REEL: "Réel (mesuré / facturé)",
  ESTIME: "Estimé",
};

export const STATUT_REPARTITION_LABEL: Record<StatutRepartition, string> = {
  A_REPARTIR: "À répartir",
  REPARTIE: "Répartie",
  PARTIELLE: "Partiellement répartie",
  NON_REPARTIE: "Non répartie",
};

export const NIVEAU_REPARTITION_LABEL: Record<NiveauRepartition, string> = {
  ACTIVITE: "Activité",
  OF: "Ordre de fabrication",
  PRODUIT: "Produit / format",
  ARTICLE: "Produit (stockage / distribution)",
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
  SEUIL_ALERTE: "Stock sous le seuil d'alerte",
  MANUEL: "Saisi manuellement",
};

export const TYPE_ANOMALIE_LABEL: Record<TypeAnomalie, string> = {
  ECART_STOCK: "Écart de stock",
  ECART_CAISSE: "Écart de caisse",
  DEPASSEMENT_MATIERE: "Dépassement matière",
  LOT_NON_LIBERE_VENDU: "Lot non libéré vendu",
  COMMANDE_CLIENT_BLOQUE: "Commande d’un client bloqué",
  IMPAYE: "Facture échue impayée",
  STOCK_SOUS_MINIMUM: "Stock sous le minimum",
  LOT_PERIME: "Lot périmé ou proche de la péremption",
  SESSION_NON_CLOTUREE: "Session de caisse non clôturée",
  DECAISSEMENT_EN_ATTENTE: "Décaissement en attente d'autorisation",
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
