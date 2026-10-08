/** Types alignés sur les sérialiseurs Django (fields = "__all__", FK = id entier). */

export type Profil =
  | "RESPONSABLE_PRODUCTION"
  | "AGENT_PRODUCTION"
  | "MAGASINIER"
  | "RESPONSABLE_QUALITE"
  | "RESPONSABLE_ACHATS"
  | "COMMERCIAL"
  | "CAISSIER"
  | "RESPONSABLE_DISTRIBUTION"
  | "CHAUFFEUR"
  | "COMPTABILITE_DAF"
  | "DIRECTION"
  | "ADMIN_SI";

/** Alias historique : le « rôle » UI est le profil backend. */
export type Role = Profil;

export type ModuleMetier =
  | "ACCUEIL"
  | "REFERENTIEL"
  | "ACHATS"
  | "STOCKS"
  | "PRODUCTION"
  | "QUALITE"
  | "COMMERCIAL"
  | "CAISSE"
  | "DISTRIBUTION"
  | "COUTS"
  | "COMPTABILITE"
  | "ADMINISTRATION";

/** Catégories du Guide du paramétrage (§6). Emballage, consommable et fluide de process
 * entrent dans les compositions ; seuls MP, emballage et consommable ne se fabriquent jamais. */
export type TypeArticle =
  | "MATIERE_PREMIERE"
  | "PRODUIT_INTERMEDIAIRE"
  | "PRODUIT_FINI"
  | "EMBALLAGE"
  | "CONSOMMABLE"
  | "FLUIDE_PROCESS";
export type UniteMesure =
  | "KG"
  | "G"
  | "L"
  | "CL"
  | "M3"
  | "UNITE"
  | "BOUTEILLE"
  | "POT"
  | "PACK"
  | "CARTON"
  | "SAC"
  | "PALETTE"
  | "M";
export type ModeApprovisionnement = "ACHETE" | "FABRIQUE" | "PROCESS";
/** Brouillon -> (En test) -> Validée -> Remplacée / archivée. */
export type StatutFicheTechnique = "BROUILLON" | "EN_TEST" | "VALIDEE" | "ARCHIVEE";
/** Unité de référence d'une recette (« pour 1 000 L », « par unité de stock »...). */
export type UniteReference = "UNITE_STOCK" | "L" | "KG";
/** Ce à quoi la quantité d'un composant se rapporte. */
export type BaseCalcul = "REFERENCE" | "UNITE" | "PACK";
export type Priorite = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";
export type StatutPlan = "PREVISION" | "A_CONVERTIR_EN_OF" | "CONVERTIE" | "ANNULEE";
export type StatutOF =
  | "BROUILLON"
  | "A_PREPARER"
  | "MATIERES_EN_PREPARATION"
  | "PRET"
  | "EN_PRODUCTION"
  | "PRODUCTION_TERMINEE"
  | "EN_CONTROLE"
  | "CLOTURE"
  | "ANNULE";
export type TypeSortie = "NORMALE" | "COMPLEMENTAIRE";
/** Code d'une étape du paramétrage industriel (EtapeStandard : CAPTAGE, PREPARATION,
 * REMPLISSAGE...). Liste paramétrable côté backend : ce n'est plus une énumération figée. */
export type Etape = string;
export type NaturePerte =
  | "PREFORMES_REJETEES"
  | "SUR_REMPLISSAGE"
  | "REBUT_REMPLISSAGE"
  | "ETIQUETTES"
  | "FILM"
  | "PACKS_NON_CONFORMES"
  | "CONCENTRE_REJETE"
  | "EAU"
  | "PRODUIT_DEMARRAGE"
  | "CASSE_STOCKAGE"
  | "AUTRE";
export type MotifPerte =
  | "CASSE"
  | "MAUVAIS_REGLAGE"
  | "FUITE"
  | "DEFAUT_MATIERE"
  | "DEFAUT_BOUTEILLE"
  | "CONTROLE_QUALITE"
  | "ARRET_MACHINE"
  | "NETTOYAGE"
  | "ERREUR_OPERATEUR"
  | "AUTRE";
export type StatutLot = "EN_ATTENTE" | "CONFORME" | "NON_CONFORME" | "BLOQUE" | "LIBERE";
export type ResultatControle = "CONFORME" | "NON_CONFORME";
export type TypeMouvement = "ENTREE" | "SORTIE" | "TRANSFERT" | "AJUSTEMENT" | "RETOUR";
export type StatutInventaire = "EN_COURS" | "CLOTURE";
export type OrigineBesoin = "AUTO_PRODUCTION" | "SEUIL_ALERTE" | "MANUEL";
export type StatutDemandeAchat = "EN_ATTENTE" | "APPROUVEE" | "REJETEE" | "TRANSFORMEE";
export type StatutCommandeFournisseur = "BROUILLON" | "ENVOYEE" | "PARTIELLEMENT_RECUE" | "RECUE" | "ANNULEE";
export type MotifRetour = "NON_CONFORME" | "ENDOMMAGE" | "QUANTITE_EXCEDENTAIRE" | "ERREUR_REFERENCE" | "AUTRE";
export type StatutContratFournisseur = "ACTIF" | "EXPIRE" | "RESILIE" | "BROUILLON";
export type TypeClient = "PARTICULIER" | "SOCIETE" | "CONTRAT";
export type TypeCommande = "COMPTANT" | "CONTRAT";
export type StatutCommande = "BROUILLON" | "VALIDEE" | "EN_PREPARATION" | "LIVREE" | "FACTUREE" | "ANNULEE";
export type StatutFacture = "EMISE" | "PAYEE" | "PARTIELLEMENT_PAYEE" | "ANNULEE";
export type ModePaiement = "ESPECES" | "MOBILE_MONEY" | "VIREMENT" | "CHEQUE";
export type StatutSession = "OUVERTE" | "CLOTUREE";
/** Circuit du décaissement : demande (caissier) -> autorisation (Direction/
 * Comptabilité) -> sortie d'argent (caissier). Refusé et Effectué sont finaux. */
export type StatutDecaissement = "EN_ATTENTE" | "AUTORISE" | "REFUSE" | "EFFECTUE";
export type StatutPreparation = "A_PREPARER" | "EN_PREPARATION" | "PRETE" | "SORTIE_MAGASIN";
export type StatutBL = "EN_LIVRAISON" | "LIVREE" | "PARTIELLEMENT_LIVREE" | "RETOURNEE";
export type TypeAnomalie =
  | "ECART_STOCK"
  | "ECART_CAISSE"
  | "DEPASSEMENT_MATIERE"
  | "LOT_NON_LIBERE_VENDU"
  | "COMMANDE_CLIENT_BLOQUE"
  | "IMPAYE"
  | "STOCK_SOUS_MINIMUM"
  | "LOT_PERIME"
  | "SESSION_NON_CLOTUREE"
  | "DECAISSEMENT_EN_ATTENTE"
  | "AUTRE";
export type StatutAnomalie = "DETECTEE" | "EN_TRAITEMENT" | "TRAITEE" | "IGNOREE";
export type TypeExport = "VENTES" | "ENCAISSEMENTS" | "ACHATS" | "JOURNAL";
export type FormatExport = "CSV_GENERIQUE" | "XLSX" | "JSON" | "SAGE_CSV";
export type StatutDevis = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "PARTIELLEMENT_ACCEPTE" | "REFUSE" | "EXPIRE";
export type SensCompte = "VENTE" | "ACHAT";
export type TypeEvenement = "CUVE" | "NETTOYAGE" | "ARRET_REDEMARRAGE";
export type StatutPalette = "EN_STOCK" | "EN_TRANSIT" | "EXPEDIEE";
export type TypeCloture = "MENSUELLE" | "ANNUELLE";
export type TypeEnergie = "ELECTRICITE" | "EAU_CAPTAGE";

export type StatutDemandeMatiere =
  | "A_PREPARER"
  | "PARTIELLEMENT_PREPAREE"
  | "PREPAREE"
  | "LIVREE_A_LA_PRODUCTION"
  | "ANNULEE";
export type StatutDemandeComplementaire = "EN_ATTENTE" | "APPROUVEE_ET_LIVREE" | "REJETEE";
export type MomentControle = "APRES_TRAITEMENT" | "AVANT_LIBERATION" | "FIN_DE_LIGNE" | "RECEPTION" | "AUTRE";
export type StatutAvoir = "EMIS" | "UTILISE" | "ANNULE";
export type TypeProbleme =
  | "PRODUIT_DEFECTUEUX"
  | "PRODUIT_MANQUANT"
  | "ERREUR_REFERENCE"
  | "EMBALLAGE_ENDOMMAGE"
  | "PRODUIT_PERIME"
  | "AUTRE";
export type StatutReclamation = "OUVERTE" | "EN_COURS" | "CLOTUREE";
export type StatutRetourPhysique = "EN_QUARANTAINE" | "CONTROLE_EFFECTUE";
export type ResultatControleRetour =
  | "RECUPERABLE_DIRECT"
  | "RECUPERABLE_AVEC_INTERVENTION"
  | "NON_RECUPERABLE";
export type StatutReconditionnement = "EN_ATTENTE" | "TERMINE";
export type TypeSolution = "REMPLACEMENT" | "AVOIR" | "REMBOURSEMENT";
export type PeriodeRapport = "JOURNALIER" | "MENSUEL";

// --- Socle industriel ---
export type PhaseEtape = "AMONT" | "PREPARATION" | "CONDITIONNEMENT" | "APRES_PRODUCTION";
export type TypeEquipement =
  | "FORAGE"
  | "POMPE"
  | "TRAITEMENT"
  | "CUVE"
  | "MELANGEUR"
  | "PASTEURISATEUR"
  | "SOUFFLEUSE"
  | "REMPLISSEUSE"
  | "BOUCHEUSE"
  | "ETIQUETEUSE"
  | "FARDELEUSE"
  | "PALETTISEUR"
  | "LABORATOIRE"
  | "AUTRE";
export type StatutCircuit = "BROUILLON" | "VALIDE" | "ARCHIVE";

// --- Lieux de stockage, lots matières, transferts ---
export type TypeLieu = "MAGASIN_MATIERES" | "STOCK_USINE" | "DEPOT_EXTERIEUR" | "QUARANTAINE";
export type StatutLotMatiere = "A_CONTROLER" | "LIBERE" | "BLOQUE" | "EPUISE";
export type StatutTransfert = "BROUILLON" | "EXPEDIE" | "RECU" | "ANNULE";

// --- Module contrôle qualité ---
export type FamilleParametre =
  | "PHYSICO_CHIMIQUE"
  | "MICROBIOLOGIQUE"
  | "ORGANOLEPTIQUE"
  | "PROCESS"
  | "CONDITIONNEMENT"
  | "MATIERE"
  | "DOCUMENTAIRE";
export type TypeResultat = "NUMERIQUE" | "QUALITATIF";
export type Laboratoire = "LIGNE" | "INTERNE" | "EXTERNE";
export type Declencheur =
  | "PAR_QUANTITE"
  | "CHAQUE_CUVE"
  | "APRES_NETTOYAGE"
  | "APRES_ARRET"
  | "RECEPTION"
  | "DEMARRAGE"
  | "CHAQUE_OF"
  | "CHAQUE_LOT"
  | "PERIODIQUE"
  | "CHANGEMENT_SERIE"
  | "PONCTUEL";
export type StatutPointControle = "BROUILLON" | "ACTIF" | "INACTIF";
export type StatutControleRealise = "A_REALISER" | "EN_ATTENTE_VALIDATION" | "CONFORME" | "NON_CONFORME" | "ANNULE";
export type StatutNC = "OUVERTE" | "EN_COURS" | "CLOTUREE";
export type ActionImmediate =
  | "ALERTE"
  | "ARRET"
  | "BLOCAGE_LOT"
  | "NOUVEAU_CONTROLE"
  | "CONTRE_ANALYSE"
  | "REGLAGE"
  | "NETTOYAGE"
  | "CORRECTION_FORMULATION"
  | "QUARANTAINE";
export type DecisionNC = "LIBERATION" | "REPRISE" | "REJET" | "QUARANTAINE";

// --- Coûts en cascade ---
export type Inducteur =
  | "VOLUME_EAU_M3"
  | "BOUTEILLES"
  | "PACKS"
  | "PALETTES"
  | "LITRES_PRODUITS"
  | "HEURES_MACHINE"
  | "HEURES_MO"
  | "KWH"
  | "ANALYSES_PONDEREES"
  | "PALETTES_JOURS"
  | "KM"
  | "QUANTITE_LIVREE"
  | "TEMPS_CHANGEMENT_SERIE"
  | "PALETTES_LIVREES"
  | "LITRES_LIVRES"
  | "AUCUN";
export type CategorieCout = "PRODUCTION" | "STOCKAGE" | "DISTRIBUTION" | "HORS_COUT";
export type Traitement = "DIRECT" | "INDIRECT";
export type CategorieEconomique =
  | "ENERGIE"
  | "MAINTENANCE"
  | "PIECES"
  | "MAIN_OEUVRE"
  | "AMORTISSEMENT"
  | "PRODUITS_TRAITEMENT"
  | "ANALYSES"
  | "EMBALLAGES"
  | "LOCATION"
  | "CARBURANT"
  | "SOUS_TRAITANCE"
  | "AUTRE";
export type StatutDonnee = "REEL" | "ESTIME";
export type StatutRepartition = "A_REPARTIR" | "REPARTIE" | "PARTIELLE" | "NON_REPARTIE";
export type NiveauRepartition = "ACTIVITE" | "OF" | "PRODUIT" | "ARTICLE";

export interface Utilisateur {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profil: Profil;
  telephone: string;
  /** Lecture seule : dérivé de is_active côté backend. Pour changer l'état, utiliser
   * les actions POST .../activer/ et .../desactiver/, pas un PATCH sur ce champ. */
  actif: boolean;
  date_creation: string;
  desactive_par: number | null;
  date_desactivation: string | null;
}

export interface JournalAction {
  id: number;
  utilisateur: number;
  module: ModuleMetier;
  action: string;
  document_type: string;
  document_id: string;
  ancienne_valeur: string;
  nouvelle_valeur: string;
  motif: string;
  date_action: string;
}

export interface Article {
  id: number;
  /** Généré automatiquement côté serveur (MP-000001 / PI-000001 / PF-000001) : jamais saisi. */
  code: string;
  designation: string;
  type_article: TypeArticle;
  unite_mesure: UniteMesure;
  /** FK vers FamilleArticle (liste déroulante). */
  famille: number | null;
  sous_famille?: string;
  marque?: string;
  /** FK vers FormatArticle. */
  format?: number | null;
  /** FK vers Parfum. */
  parfum?: number | null;
  /** FK vers UniteVenteArticle. */
  unite_vente?: number | null;
  code_fiscal?: number | null;
  suivi_par_lot?: boolean;
  duree_conservation_jours?: number | null;
  stock_minimum?: string;
  stock_alerte?: string;
  emplacement_stockage?: string;
  compte_vente?: string;
  activite_analytique?: string;
  centre_cout?: string;
  actif: boolean;
  date_creation: string;
  /** Id de la fiche technique brouillon créée automatiquement pour un produit fini (ou null). */
  fiche_technique_brouillon?: number | null;
  /** Id de la fiche technique validée en vigueur (ou null). */
  fiche_technique_validee?: number | null;
  /** Vrai dès que l'article figure dans un document (commande, stock, OF, lot...) :
   * type, famille, parfum, format et unité de vente sont alors figés. */
  est_verrouille?: boolean;
  // --- Socle industriel (Guide du paramétrage §6 à §8) ---
  /** Produit fini : déduite de la famille (Eau -> EAU) si vide. Figée dès que l'article est utilisé. */
  activite?: number | null;
  /** Un même article (ex. sucre) sert plusieurs activités ; vide = toutes. */
  activites_autorisees?: number[];
  /** Déduit du type si vide (acheté / fabriqué / produit par le process). */
  mode_approvisionnement?: ModeApprovisionnement | "";
  unite_achat?: UniteMesure | "";
  unite_consommation?: UniteMesure | "";
  /** Contenu d'une bouteille / d'un pot (0,7 L ; 0,125 kg), déduit du format si vide. */
  contenance?: string | null;
  unite_contenance?: "L" | "KG" | "";
  unites_par_pack?: number | null;
  unites_par_unite_stock?: number | null;
  packs_par_palette?: number | null;
  type_emballage?: string;
}

/** Un article pouvant entrer dans une composition (matière première, emballage,
 * consommable, fluide de process ou produit intermédiaire actif, pas encore présent
 * dans la fiche) — renvoyé par GET .../fiches-techniques/{id}/elements_disponibles/. */
export interface ElementComposition {
  id: number;
  code: string;
  designation: string;
  type_article: TypeArticle;
  unite_mesure: UniteMesure;
  unite_consommation?: UniteMesure | "";
}

export interface FamilleArticle {
  id: number;
  nom: string;
  /** Activité industrielle de la famille (Eau -> EAU) : rattachement automatique par le nom. */
  activite?: number | null;
  actif: boolean;
}

export interface FormatArticle {
  id: number;
  valeur: string;
  actif: boolean;
}

export interface Parfum {
  id: number;
  nom: string;
  actif: boolean;
}

export interface UniteVenteArticle {
  id: number;
  nom: string;
  actif: boolean;
}

export interface FamilleFiscale {
  id: number;
  nom: string;
  actif: boolean;
}

export interface ControleQualiteRequis {
  id: number;
  article: number;
  type_controle: string;
  norme_ou_seuil: string;
  moment: MomentControle;
  obligatoire: boolean;
}

export interface CodeFiscal {
  id: number;
  /** Généré automatiquement (EV-FISC-{famille}-{taux}) : jamais saisi. */
  code: string;
  /** FK vers FamilleFiscale (liste déroulante). */
  famille_fiscale: number;
  exonere: boolean;
  taux_tva: string;
  taux_centimes_additionnels: string;
  taux_accise: string;
  sfec_actif: boolean;
  situation: string;
  actif: boolean;
  date_creation: string;
}

export interface FicheTechnique {
  id: number;
  article: number;
  version: number;
  statut: StatutFicheTechnique;
  cree_par: number;
  valide_par: number | null;
  date_creation: string;
  date_validation: string | null;
  /** Composition imbriquée en lecture seule — plus besoin d'un appel séparé pour l'afficher. */
  composition: CompositionFicheTechnique[];
  /** Coût matières d'UNE unité de stock du produit (unité de référence, rendement et pertes
   * compris) ; null si la recette est en litres sans contenance connue. */
  cout_matieres_par_unite?: string | number | null;
  // --- Recette (Guide §13) : figée en test et une fois validée ---
  /** La composition est donnée pour cette quantité (ex. 1 000 pour « pour 1 000 L »). */
  quantite_reference?: string;
  unite_reference?: UniteReference;
  /** Ex. 98 : les besoins « référence » sont majorés de 100/98. */
  rendement_theorique_pct?: string | null;
  parametres_process?: string;
  /** Autres formats (produits finis) qui partagent cette recette. Modifiables en brouillon. */
  formats_associes?: number[];
  date_debut_validite?: string | null;
  date_fin_validite?: string | null;
  document_reference?: string;
}

export interface CompositionFicheTechnique {
  id: number;
  fiche_technique: number;
  matiere: number;
  /** Pour la quantité de référence de la recette, ou par bouteille/pot, ou par pack (selon base_calcul). */
  quantite_necessaire: string;
  /** Prix d'une unité de la matière ; sert au chiffrage des besoins de chaque OF. Obligatoire à la création. */
  prix_unitaire: string;
  /** Coût de cet élément pour une unité produite (quantite_necessaire x prix_unitaire), calculé par le serveur. */
  montant_par_unite?: string | number;
  matiere_code?: string;
  matiere_designation?: string;
  matiere_type?: TypeArticle;
  unite_mesure?: UniteMesure;
  base_calcul?: BaseCalcul;
  /** Recette partagée : ligne propre à un format (préforme 1,5 L...). Vide = tous les formats. */
  article_format?: number | null;
  ordre_incorporation?: number;
  role?: string;
  /** Étape où l'élément est consommé (FK EtapeStandard) : sert au coût par étape. */
  etape?: number | null;
  perte_theorique_pct?: string | null;
  /** Unité de la quantité (ex. G pour 20 g) ; les besoins de l'OF sont convertis en unité de stock. */
  unite?: UniteMesure | "";
}

export interface FicheConditionnement {
  id: number;
  article: number;
  nombre_unites_par_carton: number;
  type_emballage: string;
  poids_carton_kg: string | null;
  nombre_cartons_par_palette: number | null;
}

export interface Fournisseur {
  id: number;
  /** Généré automatiquement (FRS-000001...) : jamais saisi. */
  code: string;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  /** Identifiant fiscal (imprimé sur les bons de commande). */
  ifu?: string;
  gere_par: number | null;
  actif: boolean;
  date_creation: string;
}

export interface ContratFournisseur {
  id: number;
  numero: string;
  fournisseur: number;
  date_debut: string;
  date_fin: string | null;
  conditions: string;
  statut: StatutContratFournisseur;
  gere_par: number;
  date_creation: string;
}

export interface ArticleFournisseur {
  id: number;
  fournisseur: number;
  article: number;
  contrat: number | null;
  prix_unitaire: string;
  delai_livraison_jours: number | null;
  reference_fournisseur: string;
}

export interface BesoinApprovisionnement {
  id: number;
  article: number;
  quantite_besoin: string;
  origine: OrigineBesoin;
  satisfait: boolean;
  date_creation: string;
}

export interface DemandeAchat {
  id: number;
  besoin: number | null;
  article: number;
  quantite_demandee: string;
  motif: string;
  demandeur: number;
  statut: StatutDemandeAchat;
  approuve_par: number | null;
  date_creation: string;
  date_traitement: string | null;
}

export interface CommandeFournisseur {
  id: number;
  numero: string;
  fournisseur: number;
  demande_achat: number | null;
  statut: StatutCommandeFournisseur;
  cree_par: number;
  date_commande: string;
}

export interface LigneCommandeFournisseur {
  id: number;
  commande: number;
  article: number;
  quantite_commandee: string;
  prix_unitaire: string;
  quantite_recue: string;
  /** Unité de commande (ex. SAC) ; vide = unité d'achat de l'article, sinon son unité de stock. */
  unite?: UniteMesure | "";
}

export interface ReceptionAchat {
  id: number;
  commande: number;
  receptionne_par: number;
  /** Non conforme : les lots matières créés sont bloqués. */
  conforme: boolean;
  /** Lieu de réception (FK Depot) ; vide = « Magasin principal ». */
  depot?: number | null;
  observations: string;
  date_reception: string;
}

export interface LigneReceptionAchat {
  id: number;
  reception: number;
  ligne_commande: number;
  quantite_recue: string;
  /** Traçabilité amont : un lot matière est créé à la réception d'un article suivi par lot. */
  lot_fournisseur?: string;
  date_peremption?: string | null;
}

export interface RetourFournisseur {
  id: number;
  reception: number;
  article: number;
  quantite_retournee: string;
  motif: MotifRetour;
  observations: string;
  traite_par: number;
  date_retour: string;
}

export interface Depot {
  id: number;
  /** Généré automatiquement (MAG-001, ST-001, DEP-001, QUA-001) : jamais saisi. */
  code?: string | null;
  nom: string;
  /** Le stock usine reste distinct du stock des dépôts extérieurs (Guide §5). */
  type_lieu?: TypeLieu;
  /** Obligatoire pour un magasin matières ou un stock usine (hors dépôts système). */
  usine?: number | null;
  /** Vide = toutes activités. */
  activite?: number | null;
  /** Vide = tous les articles. */
  articles_autorises?: number[];
  gestion_lots?: boolean;
  adresse: string;
  actif: boolean;
  /** Dépôt utilisé automatiquement par le code (mouvements générés par la
   * production, la qualité, les achats...) : nom/actif ne devraient plus être
   * modifiés librement depuis l'écran Dépôts, la suppression y est masquée. */
  est_systeme: boolean;
  /** Rôle du dépôt système (ex. "Produits finis libérés"), vide si non-système. */
  role: string;
}

export interface StockArticle {
  id: number;
  article: number;
  depot: number;
  quantite_physique: string;
  quantite_bloquee: string;
  quantite_reservee: string;
}

export interface MouvementStock {
  id: number;
  numero: string;
  article: number;
  depot: number;
  type_mouvement: TypeMouvement;
  quantite: string;
  motif: string;
  document_origine: string;
  utilisateur: number;
  date_mouvement: string;
}

export interface Inventaire {
  id: number;
  depot: number;
  date_inventaire: string;
  statut: StatutInventaire;
  cree_par: number;
}

export interface LigneInventaire {
  id: number;
  inventaire: number;
  article: number;
  quantite_theorique: string;
  quantite_comptee: string;
}

export interface PlanProduction {
  id: number;
  article: number;
  date_prevue: string;
  quantite_prevue: string;
  priorite: Priorite;
  commentaire: string;
  statut: StatutPlan;
  cree_par: number;
  date_creation: string;
  /** Ligne prévue (facultative). */
  ligne?: number | null;
}

export interface OrdreFabrication {
  id: number;
  numero: string;
  plan_production: number | null;
  article: number;
  quantite_a_produire: string;
  equipe: string;
  /** Ligne compatible avec le format : détermine l'usine (magasin matières, stock produits finis). */
  ligne?: number | null;
  /** Associé automatiquement par le backend (circuit validé le plus précis). */
  circuit?: number | null;
  /** Recette appliquée (lecture seule). */
  fiche_technique?: number | null;
  date_prevue?: string | null;
  statut: StatutOF;
  motif_annulation: string;
  responsable: number;
  agents_affectes: number[];
  date_debut_production: string | null;
  date_fin: string | null;
  date_creation: string;
  /** Somme des montants chiffrés des besoins matières de l'OF. Absent pour l'Agent Production
   * (aucune donnée financière ne lui est jamais transmise). */
  montant_total_matieres?: string | number;
  activite_code?: string | null;
  usine_code?: string | null;
  ligne_code?: string | null;
  circuit_code?: string | null;
  /** Étapes du circuit avec l'avancement saisi (vide sans circuit). */
  etapes_prevues?: EtapePrevueOF[];
  /** Produit porté par l'OF (l'Agent Production ne lit pas les articles). */
  article_code?: string;
  article_designation?: string;
  /** Planning par ligne : deux OF ne se chevauchent pas sur une même ligne. */
  date_debut_prevue?: string | null;
  /** Calculée depuis la cadence de la ligne si elle n'est pas saisie. */
  date_fin_prevue?: string | null;
  /** OF multi-format : formats produits en plus du format principal. */
  formats_supplementaires?: FormatOF[];
  /** Fiche d'un OF brouillon sans ligne : seule ligne compatible, retenue au lancement. */
  ligne_proposee?: string | null;
}

/** Une étape du circuit d'un OF (OrdreFabricationSerializer.etapes_prevues). */
export interface EtapePrevueOF {
  ordre: number;
  code: string;
  libelle: string;
  obligatoire: boolean;
  poste: string | null;
  machine: string | null;
  saisies: number;
  quantite_produite: string | number | null;
}

export interface BesoinMatierePrevu {
  id: number;
  ordre_fabrication: number;
  matiere: number;
  quantite_theorique: string;
  /** Prix de la fiche technique au moment de la création de l'OF (figé) ; montant = théorique x prix.
   * Absents pour l'Agent Production. */
  prix_unitaire?: string | number;
  montant?: string | number;
  /** Enrichissement API list (§5.5), non stocké en base. */
  stock_disponible?: string | number;
  manquant?: string | number;
  situation?: string;
  of_numero?: string;
  matiere_code?: string;
  matiere_designation?: string;
}

export interface DemandeMatiere {
  id: number;
  numero: string;
  /** OF, matière et quantité sont générés en bloc par
   * .../ordres-fabrication/{id}/demander_matieres/ (toute la composition de
   * l'OF en une fois) : plus de création manuelle ligne par ligne. */
  ordre_fabrication: number;
  matiere: number;
  quantite_demandee: string;
  /** Repris du besoin chiffré de l'OF au moment de la demande. Absents pour l'Agent Production. */
  prix_unitaire?: string | number;
  montant?: string | number;
  /** Renseignée par le backend au moment de /livrer/ ; en lecture seule. */
  quantite_livree: string | null;
  demandeur: number;
  statut: StatutDemandeMatiere;
  date_creation: string;
}

export interface DemandeComplementaire {
  id: number;
  numero: string;
  ordre_fabrication: number;
  matiere: number;
  quantite: string;
  motif: string;
  demandeur: number;
  statut: StatutDemandeComplementaire;
  date_creation: string;
}

export interface SortieMatiere {
  id: number;
  ordre_fabrication: number;
  matiere: number;
  quantite_sortie: string;
  type_sortie: TypeSortie;
  motif: string;
  valide_par: number | null;
  /** Lot imposé ; vide = lots consommés automatiquement (DLC la plus proche d'abord). */
  lot_matiere?: number | null;
  date_sortie: string;
}

export interface RetourMatiere {
  id: number;
  ordre_fabrication: number;
  matiere: number;
  quantite_retournee: string;
  motif?: string;
  date_retour: string;
}

export interface SuiviProduction {
  id: number;
  ordre_fabrication: number;
  date: string;
  heure_debut: string;
  heure_fin: string | null;
  equipe: string;
  quantite_entree: string;
  quantite_produite: string | null;
  quantite_conforme: string | null;
  quantite_rejetee: string | null;
  arrets: string;
  incidents: string;
  observations: string;
}

export interface SuiviEau {
  id: number;
  ordre_fabrication: number;
  volume_capte_l: string;
  volume_envoye_traitement_l: string | null;
  volume_obtenu_traitement_l: string;
  volume_envoye_embouteillage_l: string;
  bouteilles_produites: number;
  bouteilles_conformes: number;
  bouteilles_rejetees: number;
  nombre_packs: number | null;
}

export interface EtapeProduction {
  id: number;
  ordre_fabrication: number;
  /** Code EtapeStandard ; si l'OF a un circuit, une étape de ce circuit. */
  etape: Etape;
  agent: number;
  poste?: number | null;
  equipement?: number | null;
  quantite_entree?: string | null;
  quantite_produite: string | null;
  quantite_rejetee?: string | null;
  date_debut: string | null;
  date_fin: string | null;
  duree_arret_min?: string | null;
  /** Compteur d'heures ; vide = durée début -> fin moins les arrêts. */
  heures_machine?: string | null;
  heures_machine_effectives?: string | null;
  energie_kwh?: string | null;
  /** Décoché = valeur estimée (jamais présentée comme une mesure). */
  energie_mesuree?: boolean;
  observations: string;
}

export interface PerteProduction {
  id: number;
  ordre_fabrication: number;
  etape: number | null;
  quantite_perte: string;
  taux_perte?: string | null;
  motif: MotifPerte;
  /** Les pertes sont des coûts identifiés : on les isole par nature. */
  nature?: NaturePerte;
  etape_code?: string;
  /** Matière / emballage perdu : permet la valorisation au CMUP. */
  matiere?: number | null;
  /** Calculée par le serveur (quantité x CMUP) ; absente pour l'Agent Production. */
  valeur?: string | null;
  observations: string;
  date_constat: string;
  /** Perte réellement comptée ou estimée. */
  type_quantite?: "REELLE" | "ESTIMEE";
}

export interface Lot {
  id: number;
  numero_lot: string;
  article: number;
  ordre_fabrication: number | null;
  quantite: string;
  statut: StatutLot;
  date_production: string;
  date_peremption: string | null;
  /** Stock produits finis où le lot entre à sa libération (celui de l'usine de l'OF). */
  depot?: number | null;
  date_creation: string;
  article_code?: string;
  article_designation?: string;
}

export interface ControleQualite {
  id: number;
  lot: number;
  controleur: number;
  resultat: ResultatControle;
  observations: string;
  date_controle: string;
}

export interface Client {
  id: number;
  /** Généré automatiquement (CLI-000001...) : jamais saisi. */
  code: string;
  nom: string;
  type_client: TypeClient;
  adresse: string;
  telephone: string;
  /** Identifiant fiscal du client (imprimé sur ses factures). */
  ifu?: string;
  encours_autorise: string;
  delai_paiement_jours: number;
  bloque: boolean;
}

export interface Prospect {
  id: number;
  nom: string;
  contact: string;
  statut: string;
  date_creation: string;
}

export interface ContratClient {
  id: number;
  client: number;
  date_debut: string;
  date_fin: string | null;
  conditions: string;
}

export interface Tarif {
  id: number;
  article: number;
  client: number | null;
  prix_unitaire: string;
  date_debut_validite: string;
  date_fin_validite: string | null;
  /** Tarif négocié dans un contrat (prioritaire sur le tarif client et le tarif public). */
  contrat?: number | null;
}

export interface Commande {
  id: number;
  numero: string;
  client: number;
  type_commande: TypeCommande;
  statut: StatutCommande;
  cree_par: number;
  date_commande: string;
  /** Nom du client, envoyé par le backend (utile aux profils qui ne lisent pas les clients). */
  client_nom?: string;
  /** Devis d'origine (lecture seule). */
  devis?: number | null;
}

export interface LigneCommande {
  id: number;
  commande: number;
  article: number;
  quantite: string;
  prix_unitaire: string;
  /** Envoyés par le backend : utiles aux profils qui ne lisent pas les articles. */
  article_code?: string;
  article_designation?: string;
  /** Tarif en vigueur appliqué (contrat > client > public) et son prix : le prix est imposé. */
  tarif?: number | null;
  prix_tarif?: string | null;
  /** Dérogation (client sous contrat) : motif et autorisation par la Direction ou la DAF. */
  motif_derogation?: string;
  derogation_autorisee_par?: number | null;
  stock_disponible?: string | number;
}

export interface Facture {
  id: number;
  numero: string;
  commande: number;
  client: number;
  montant_ht_total: string;
  montant_taxes_total: string;
  montant_total: string;
  statut: StatutFacture;
  date_emission: string;
  date_echeance: string | null;
  client_nom?: string;
  commande_numero?: string;
  /** Facture normalisée SFEC : statut de certification et données reçues. */
  sfec_statut?: "EN_ATTENTE" | "CERTIFIEE" | "ERREUR";
  sfec_code?: string;
  sfec_qr?: string;
  sfec_compteurs?: string;
  sfec_nim?: string;
  sfec_date?: string | null;
  sfec_message?: string;
}

export interface LigneFacture {
  id: number;
  facture: number;
  article: number;
  quantite: string;
  prix_unitaire_ht: string;
  code_fiscal: number;
  taux_tva_applique: string;
  taux_accise_applique: string;
  taux_centimes_applique: string;
  montant_ht: string;
  montant_accise: string;
  montant_tva: string;
  montant_centimes: string;
  montant_ttc: string;
  article_code?: string;
  article_designation?: string;
}

export interface Avoir {
  id: number;
  numero: string;
  client: number;
  facture_origine: number | null;
  montant: string;
  motif: string;
  statut: StatutAvoir;
  facture_utilisation: number | null;
  cree_par: number;
  date_creation: string;
  date_utilisation: string | null;
}

export interface Caisse {
  id: number;
  nom: string;
  emplacement: string;
  actif: boolean;
  /** Caisse de consolidation unique, créée par le système (non supprimable,
   * aucun caissier affecté, aucune session ne s'y ouvre). */
  est_principale: boolean;
  /** Le caissier qui ouvre/clôture ses sessions sur cette caisse (une caisse = un caissier). */
  caissier: number | null;
  caissier_nom: string | null;
  /** Solde actuel : pour la principale, le total de toutes les caisses ; sinon le solde propre. */
  solde_actuel: string;
  /** Id de la session ouverte sur cette caisse, ou null. */
  session_ouverte: number | null;
}

export interface SessionCaisse {
  id: number;
  caisse: number;
  caissier: number;
  /** Automatique : 0 à la première ouverture, sinon le solde compté de la clôture précédente. */
  solde_ouverture: string;
  solde_theorique_cloture: string | null;
  solde_compte_cloture: string | null;
  /** Pendant que la session est ouverte : calculé en direct (ouverture + encaissements − décaissements). */
  solde_theorique_actuel: string;
  /** solde_compte_cloture − solde_theorique_cloture, une fois clôturée. */
  ecart: string | null;
  statut: StatutSession;
  date_ouverture: string;
  date_cloture: string | null;
}

export interface Encaissement {
  id: number;
  numero: string;
  session_caisse: number;
  facture: number;
  /** Toujours l'utilisateur connecté au moment de l'encaissement (renseigné par le serveur). */
  encaisse_par: number | null;
  montant: string;
  mode_paiement: ModePaiement;
  date_encaissement: string;
}

export interface Decaissement {
  id: number;
  numero: string;
  session_caisse: number;
  montant: string;
  motif: string;
  beneficiaire: string;
  statut: StatutDecaissement;
  /** Renseigné par l'action Autoriser / Refuser — jamais choisi à la demande. */
  autorise_par: number | null;
  autorise_par_nom?: string | null;
  effectue_par: number;
  effectue_par_nom?: string;
  caisse_nom?: string;
  motif_refus: string;
  date_decaissement: string;
  date_autorisation: string | null;
  date_execution: string | null;
}

/** Une personne pouvant autoriser un décaissement (Direction ou
 * Comptabilité/DAF, comptes actifs) — GET .../decaissements/autorisateurs/. */
export interface Autorisateur {
  id: number;
  username: string;
  nom: string;
  profil: Profil;
  profil_libelle: string;
}

export interface EcartCaisse {
  id: number;
  session_caisse: number;
  montant_ecart: string;
  justification: string;
  valide_par: number | null;
  date_creation: string;
}

export interface Vehicule {
  id: number;
  immatriculation: string;
  type_vehicule: string;
  actif: boolean;
}

export interface Chauffeur {
  id: number;
  utilisateur: number;
  permis_numero: string;
}

export interface DepotDistribution {
  id: number;
  nom: string;
}

export interface Tournee {
  id: number;
  numero: string;
  chauffeur: number;
  vehicule: number;
  date_tournee: string;
  /** Relevés du compteur (clé « km » du coût de distribution). */
  kilometrage_depart?: number | null;
  kilometrage_retour?: number | null;
}

export interface PreparationLivraison {
  id: number;
  commande: number;
  statut: StatutPreparation;
  lancee_par: number;
  preparee_par: number | null;
  /** Lieu de sortie (stock usine ou dépôt extérieur) ; vide = « Dépôt produits finis ». */
  depot?: number | null;
  date_lancement: string;
  date_confirmation_sortie: string | null;
  /** Envoyés par le backend : le Magasinier ne lit pas les commandes. */
  commande_numero?: string;
  client_nom?: string;
  depot_nom?: string | null;
  lignes?: { article: number; code: string; designation: string; quantite: string }[];
}

export interface BonLivraison {
  id: number;
  numero: string;
  commande: number;
  tournee: number | null;
  statut: StatutBL;
  signature_client: boolean;
  /** Renseignée quand le chauffeur indique la remise au client (avant confirmation finale). */
  date_signature: string | null;
  /** Motif renseigné par le chauffeur en cas de problème de livraison. */
  incident_livraison: string;
  confirme_par: number | null;
  date_generation: string;
  date_livraison: string | null;
  /** Enrichissements du serializer (lecture) : utiles au chauffeur, qui ne lit ni commandes ni clients. */
  commande_numero?: string;
  client_nom?: string;
  client_adresse?: string;
  articles?: { code: string; designation: string; quantite: string }[];
  statut_paiement?: string;
}

export interface TransfertDepot {
  id: number;
  depot_source: number;
  depot_destination: number;
  date_transfert: string;
  statut: string;
}

export interface ReclamationClient {
  id: number;
  numero: string;
  bon_livraison: number | null;
  client: number;
  facture: number | null;
  article: number;
  quantite: string;
  prix_unitaire: string | null;
  type_probleme: TypeProbleme;
  description: string;
  produit_retourne: boolean;
  statut: StatutReclamation;
  cree_par: number;
  date_creation: string;
  date_cloture: string | null;
}

export interface RetourPhysique {
  id: number;
  reclamation: number;
  lot: number | null;
  quantite_retournee: string;
  statut: StatutRetourPhysique;
  receptionne_par: number;
  date_reception: string;
  reclamation_numero?: string;
  client_nom?: string;
  article_code?: string;
  article_designation?: string;
  lot_numero?: string | null;
}

export interface ControleRetour {
  id: number;
  retour_physique: number;
  resultat: ResultatControleRetour;
  observations: string;
  controle_par: number;
  date_controle: string;
  reclamation_numero?: string;
  client_nom?: string;
  article_code?: string;
}

export interface Reconditionnement {
  id: number;
  controle_retour: number;
  description: string;
  quantite_reconditionnee: string | null;
  statut: StatutReconditionnement;
  traite_par: number | null;
  date_creation: string;
  date_traitement: string | null;
}

export interface CoutRetourPerte {
  id: number;
  reclamation: number;
  quantite_detruite: string | null;
  cout_produit_detruit: string | null;
  cout_reconditionnement: string | null;
  date_enregistrement: string;
}

export interface SolutionClient {
  id: number;
  reclamation: number;
  type_solution: TypeSolution;
  nouvelle_commande: number | null;
  montant_avoir: string | null;
  montant_rembourse: string | null;
  reference_sortie_caisse: string;
  autorise_par: number;
  date_creation: string;
}

export interface CoutMatiere {
  id: number;
  article: number;
  cout_unitaire: string;
  date_valorisation: string;
}

export interface CoutEnergie {
  id: number;
  type_energie: TypeEnergie;
  periode: string;
  montant: string;
  cle_repartition: string;
}

export interface CoutMainOeuvre {
  id: number;
  ordre_fabrication: number;
  heures: string;
  cout_horaire: string;
}

export interface Amortissement {
  id: number;
  immobilisation: string;
  valeur: string;
  duree_amortissement_mois: number;
  date_debut: string;
}

export interface CoutStandard {
  id: number;
  article: number;
  cout_standard_unitaire: string;
  date_debut_validite: string;
}

export interface CoutReel {
  id: number;
  ordre_fabrication: number;
  cout_matiere_total: string;
  cout_main_oeuvre_total: string;
  cout_energie_total: string;
  cout_amortissement_total: string;
  /** Charges de production réparties par la cascade jusqu'à cet OF. */
  cout_charges_reparties?: string;
  date_calcul: string;
}

export interface AnomalieDetectee {
  id: number;
  type_anomalie: TypeAnomalie;
  module_source: string;
  description: string;
  statut: StatutAnomalie;
  traite_par: number | null;
  traite_par_nom?: string | null;
  date_detection: string;
  date_traitement: string | null;
  commentaire_traitement: string;
  type_document: string;
  document_id: number | null;
  reference: string;
}

export interface ExportComptable {
  id: number;
  type_export: TypeExport;
  periode_debut: string;
  periode_fin: string;
  fichier: string | null;
  genere_par: number;
  date_generation: string;
  format_fichier?: FormatExport;
}

export interface Cloture {
  id: number;
  periode: string;
  type_cloture: TypeCloture;
  valide_par: number;
  date_cloture: string;
}

/** Rôle d'un compte général utilisé par les écritures automatiques (plan SYSCOHADA par défaut). */
export type CleCompte =
  | "CLIENTS" | "FOURNISSEURS" | "VENTES_PRODUITS_FINIS" | "TVA_COLLECTEE" | "ACCISES"
  | "CENTIMES_ADDITIONNELS" | "RABAIS_ACCORDES" | "ACHATS_MATIERES" | "CAISSE" | "BANQUE"
  | "MOBILE_MONEY" | "CHARGES_DIVERSES";

export interface CompteParametre {
  id: number;
  cle: CleCompte;
  role: string;
  numero: string;
}

export type CleControle = "TOLERANCE_DEPASSEMENT_MATIERE" | "DELAI_ALERTE_PEREMPTION_JOURS" | "DELAI_DECAISSEMENT_EN_ATTENTE_JOURS";

export interface ParametreControle {
  id: number;
  cle: CleControle;
  libelle: string;
  valeur: string;
  minimum: number;
  maximum: number;
  modifie_par_nom: string | null;
  date_modification: string;
}

export type Journal = "VT" | "AC" | "CA" | "OD";

export interface LigneEcriture {
  compte: string;
  compte_tiers: string;
  libelle: string;
  debit: string;
  credit: string;
}

/** Une ligne de GET /stocks/valorisation/ : valeur du stock au coût moyen pondéré (CMUP). */
export interface LigneValorisation {
  article: string;
  designation: string;
  type_article: TypeArticle;
  depot: string;
  quantite: string;
  cout_unitaire_moyen: string;
  valeur: string;
}

export interface ValorisationStock {
  valeur_totale: string;
  lignes: LigneValorisation[];
}

export interface EcritureComptable {
  id: number;
  numero: string;
  journal: Journal;
  journal_libelle: string;
  date: string;
  piece: string;
  libelle: string;
  exportee_le: string | null;
  lignes: LigneEcriture[];
}

export interface RapportGenere {
  id: number;
  periode: PeriodeRapport;
  date_rapport: string;
  contenu: Record<string, unknown>;
  genere_par: number;
  date_generation: string;
}

// =====================================================================
// Socle industriel (GET /api/industriel/...) — paramétré par l'Admin SI
// et la Direction, lu par les métiers qui s'en servent au quotidien.
// =====================================================================

export interface Activite {
  id: number;
  /** Généré depuis la désignation (EAU, JUS, YAOURT). */
  code: string;
  designation: string;
  regles_specifiques: string;
  actif: boolean;
}

export interface Usine {
  id: number;
  /** Généré (US-EAU, US-JY). */
  code: string;
  nom: string;
  localisation: string;
  activites: number[];
  activites_codes?: string[];
  /** Magasin matières de l'usine (sinon « Magasin principal »). */
  magasin_matieres: number | null;
  /** Stock produits finis de l'usine (sinon « Dépôt produits finis »). */
  stock_produits_finis: number | null;
  actif: boolean;
}

export interface EtapeStandard {
  id: number;
  code: string;
  libelle: string;
  phase: PhaseEtape;
  ordre_reference: number;
  sous_etape_de: number | null;
  description: string;
  actif: boolean;
  /** Stockage produit fini et distribution : hors coût de production. */
  hors_cout_production?: boolean;
}

export interface LigneProduction {
  id: number;
  code: string;
  designation: string;
  usine: number;
  activite: number;
  usine_code?: string;
  activite_code?: string;
  cadence_nominale: string | null;
  unite_cadence: string;
  /** Vide = tous les formats de l'activité. */
  formats_compatibles: number[];
  actif: boolean;
}

export interface Poste {
  id: number;
  code: string;
  designation: string;
  ligne: number;
  etape: number;
  ligne_code?: string;
  etape_code?: string;
  ordre: number;
  formats_compatibles: number[];
  actif: boolean;
}

export interface Equipement {
  id: number;
  code: string;
  designation: string;
  type_equipement: TypeEquipement;
  usine: number;
  poste: number | null;
  /** Vide = équipement commun à plusieurs activités (charges réparties). */
  activite: number | null;
  cadence_nominale: string | null;
  unite_cadence: string;
  formats_compatibles: number[];
  compteur_energie: boolean;
  compteur_heures: boolean;
  compteur_pieces: boolean;
  compteur_volume: boolean;
  valeur_acquisition: string | null;
  duree_amortissement_mois: number | null;
  date_mise_en_service: string | null;
  actif: boolean;
  est_commun?: boolean;
  amortissement_mensuel?: string | null;
  /** Machine combinée (ex. remplissage + bouchage) : autres postes réalisés. */
  postes_supplementaires?: number[];
  /** Clé d'imputation de l'amortissement ; vide = volume d'eau en amont, heures machine ailleurs. */
  inducteur_amortissement?: Inducteur | "";
}

export interface EtapeCircuit {
  id: number;
  circuit: number;
  etape: number;
  etape_code?: string;
  etape_libelle?: string;
  ordre: number;
  obligatoire: boolean;
  poste: number | null;
  equipement: number | null;
  temps_theorique_min: string | null;
  perte_theorique_pct: string | null;
}

export interface Circuit {
  id: number;
  code: string;
  designation: string;
  activite: number;
  activite_code?: string;
  /** Vide = tous les formats de l'activité. */
  article: number | null;
  ligne: number | null;
  version: number;
  statut: StatutCircuit;
  valide_par: number | null;
  date_validation: string | null;
  observations: string;
  etapes: EtapeCircuit[];
}

// =====================================================================
// Production : changements de série, paramètres, traçabilité des lots
// =====================================================================

export interface ChangementSerie {
  id: number;
  ordre_fabrication: number;
  article_precedent: number | null;
  ligne: number | null;
  date_debut: string;
  date_fin: string | null;
  duree_arret_min: string;
  duree_nettoyage_min: string;
  duree_reglage_min: string;
  quantite_essais: string;
  rebuts_demarrage: string;
  /** Absent pour l'Agent Production. */
  cout_nettoyage?: string | null;
  observations: string;
  saisi_par: number | null;
}

/** Règles de production (une seule fiche) — GET /production/parametres/. */
export interface ParametreProduction {
  bloquer_lancement_stock_insuffisant: boolean;
  controle_qualite_bloque_cloture: boolean;
  /** Capacité journalière d'une ligne pour le planning (8, 16 en 2 équipes, 24). */
  heures_ouvrees_par_jour?: string;
}

export interface ConsommationLotMatiere {
  id: number;
  sortie: number;
  lot: number;
  lot_numero: string;
  lot_fournisseur: string;
  matiere: string;
  of: string;
  quantite: string;
  quantite_retournee: string;
}

/** GET .../ordres-fabrication/{id}/verifier_stock/ : contrôle avant lancement. */
export interface VerificationStockOF {
  magasin: string;
  lancement_possible: boolean;
  blocage_actif: boolean;
  manques: { matiere: string; designation: string; besoin: string; disponible: string; manquant: string }[];
}

/** GET .../ordres-fabrication/{id}/bon_de_sortie/ : données du bon de sortie matières. */
export interface BonSortieOF {
  of: string;
  article: string;
  designation: string;
  quantite_a_produire: string;
  magasin: string;
  ligne: string | null;
  recette: string | null;
  lignes: { matiere: string; designation: string; unite: string; quantite: string; deja_sorti: string | number }[];
}

/** GET .../ordres-fabrication/{id}/consommation_reelle/ (synthèse matières, eau, pertes, qualité). */
export interface ConsommationReelleOF {
  numero: string;
  statut: StatutOF;
  quantite_prevue: string;
  consommation_matieres: Record<string, unknown>[];
  suivi_eau: SuiviEau | null;
  volume_eau: { litres: string | number | null; statut: "MESURE" | "CALCULE" | null };
  pertes: PerteProduction[];
  changements_serie: ChangementSerie[];
  /** Ce qui empêche la clôture de l'OF (contrôles bloquants, NC ouvertes). */
  blocages_qualite: string[];
}

// =====================================================================
// Stocks : lots matières et bons de transfert
// =====================================================================

export interface LotMatiere {
  id: number;
  numero: string;
  article: number;
  article_code?: string;
  depot: number;
  depot_nom?: string;
  lot_fournisseur: string;
  fournisseur: number | null;
  ligne_reception: number | null;
  date_reception: string;
  date_peremption: string | null;
  quantite_initiale: string;
  quantite_restante: string;
  /** Évolue par /liberer/, /bloquer/ et les contrôles de réception. */
  statut: StatutLotMatiere;
  observations: string;
  date_creation: string;
  est_perime?: boolean;
  article_designation?: string;
  /** La Qualité ne lit pas les fournisseurs : le nom est porté par le lot. */
  fournisseur_nom?: string | null;
}

export interface LigneTransfert {
  id: number;
  transfert: number;
  article: number;
  article_code?: string;
  /** Lot de produit fini (libéré uniquement). */
  lot: number | null;
  quantite: string;
  cout_unitaire: string | null;
  /** Palette entière : article, lot et quantité sont repris de la palette. */
  palette?: number | null;
}

export interface TransfertStock {
  id: number;
  numero: string;
  depot_source: number;
  depot_destination: number;
  depot_source_nom?: string;
  depot_destination_nom?: string;
  statut: StatutTransfert;
  observations: string;
  cree_par: number;
  expedie_par: number | null;
  recu_par: number | null;
  date_creation: string;
  date_expedition: string | null;
  date_reception: string | null;
  lignes: LigneTransfert[];
}

/** Traçabilité amont d'un lot de produit fini — GET /qualite/lots/{id}/tracabilite/. */
export interface TracabiliteLot {
  lot: string;
  article: string;
  quantite: string;
  statut: string;
  date_production: string;
  date_peremption: string | null;
  stock: string;
  of: null | {
    numero: string;
    ligne: string | null;
    usine: string | null;
    circuit: string | null;
    recette: string | null;
    date_debut: string | null;
    date_fin: string | null;
  };
  matieres: {
    lot: string;
    article: string;
    lot_fournisseur: string;
    fournisseur: string | null;
    date_peremption: string | null;
    quantite: string;
  }[];
  controles: ControleRealise[];
  non_conformites: NonConformite[];
  transferts: { bon: string; vers: string; quantite: string; statut: string }[];
  stock_restant?: { lieu: string; quantite: string }[];
  clients?: ClientLivreLot[];
  palettes?: { numero: string; quantite: string; statut: string; lieu: string; emplacement: string | null }[];
}

/** Traçabilité aval d'un lot matière (rappel) — GET /stocks/lots-matieres/{id}/tracabilite/. */
export interface TracabiliteLotMatiere {
  lot: string;
  article: string;
  lot_fournisseur: string;
  fournisseur: string | null;
  date_reception: string;
  date_peremption: string | null;
  quantite_initiale: string;
  quantite_restante: string;
  statut: string;
  ordres_fabrication: {
    of: string;
    article: string;
    statut: string;
    quantite_consommee: string | number;
    lots_produits_finis: { lot: string; quantite: string; statut: string }[];
  }[];
  controles: { numero: string; controle: string; statut: string; valeur: string | null }[];
}

// =====================================================================
// Module contrôle qualité
// =====================================================================

export interface ParametreQualite {
  id: number;
  code: string;
  libelle: string;
  famille: FamilleParametre;
  type_resultat: TypeResultat;
  unite: string;
  methode: string;
  poids_analyse: string;
  actif: boolean;
}

export interface Instrument {
  id: number;
  code: string;
  designation: string;
  numero_serie: string;
  laboratoire: Laboratoire;
  date_dernier_etalonnage: string | null;
  /** Vide = pas d'étalonnage suivi. */
  periodicite_etalonnage_jours: number | null;
  actif: boolean;
  prochaine_echeance?: string | null;
  etalonnage_valide?: boolean;
  type_instrument?: string;
  grandeur_mesuree?: string;
  unite?: string;
  /** Vide = commun à toutes les activités. */
  activite?: number | null;
}

/** Une ligne du plan de contrôle. */
export interface PointControle {
  id: number;
  code: string;
  designation: string;
  parametre: number;
  parametre_libelle?: string;
  unite?: string;
  activite: number | null;
  activite_code?: string | null;
  article: number | null;
  fiche_technique: number | null;
  etape: number | null;
  etape_libelle?: string | null;
  poste: number | null;
  equipement: number | null;
  point_prelevement: string;
  valeur_cible: string | null;
  valeur_min: string | null;
  valeur_max: string | null;
  tolerance: string | null;
  bloquant: boolean;
  declencheur: Declencheur;
  frequence_minutes: number | null;
  type_echantillon: string;
  quantite_echantillon: string;
  nombre_echantillons: number;
  echantillon_conserve: boolean;
  methode: string;
  instrument: number | null;
  laboratoire: Laboratoire;
  actions_si_non_conforme: string;
  document_reference: string;
  version: number;
  statut: StatutPointControle;
  date_debut: string | null;
  date_fin: string | null;
  /** Modèle de la bibliothèque dont les valeurs ont été reprises à la création. */
  modele?: number | null;
  /** Tant qu'il n'est pas réalisé, le lot ne peut pas être libéré (ni l'OF clôturé). */
  obligatoire?: boolean;
  /** Contrôle « par quantité » : toutes les X unités / litres / m³ produits à l'étape. */
  frequence_quantite?: string | null;
}

export interface PieceJointeQualite {
  id: number;
  resultat: number | null;
  non_conformite: number | null;
  /** Adresse protégée du fichier (/api/qualite/pieces-jointes/{id}/fichier/) : à lire avec le jeton. */
  url: string;
  nom_fichier: string;
  type_contenu: string;
  taille: number;
  description: string;
  ajoute_par: number | null;
  date_ajout: string;
}

/** Un contrôle à réaliser puis réalisé (GET /qualite/controles-realises/). */
export interface ControleRealise {
  id: number;
  numero: string;
  point: number;
  ordre_fabrication: number | null;
  lot: number | null;
  lot_matiere: number | null;
  article: number | null;
  ligne: number | null;
  etape: number | null;
  poste: number | null;
  equipement: number | null;
  statut: StatutControleRealise;
  date_prevue: string | null;
  date_realisation: string | null;
  valeur: string | null;
  resultat_qualitatif: "CONFORME" | "NON_CONFORME" | "";
  conforme: boolean | null;
  instrument: number | null;
  reference_echantillon: string;
  operateur: number | null;
  valide_par: number | null;
  commentaire: string;
  est_reprise: boolean;
  controle_origine: number | null;
  date_creation: string;
  // Enrichissements de lecture
  controle?: string;
  parametre?: string;
  unite?: string;
  type_resultat?: TypeResultat;
  critere?: string | null;
  bloquant?: boolean;
  of_numero?: string | null;
  lot_numero?: string | null;
  lot_matiere_numero?: string | null;
  operateur_nom?: string | null;
  en_retard?: boolean;
  pieces_jointes?: PieceJointeQualite[];
}

export interface NonConformite {
  id: number;
  numero: string;
  resultat: number | null;
  ordre_fabrication: number | null;
  lot: number | null;
  lot_matiere: number | null;
  description: string;
  bloquante: boolean;
  cause: string;
  action_immediate: ActionImmediate | "";
  action_corrective: string;
  responsable: number | null;
  echeance: string | null;
  statut: StatutNC;
  decision: DecisionNC | "";
  ouverte_par: number | null;
  cloturee_par: number | null;
  date_ouverture: string;
  date_cloture: string | null;
  controle_numero?: string | null;
  of_numero?: string | null;
  lot_numero?: string | null;
  pieces_jointes?: PieceJointeQualite[];
}

export interface RepartitionQualite {
  cle: string;
  controles: number;
  non_conformes: number;
  taux_conformite: number;
}

/** GET /qualite/indicateurs/?du=&au=&activite= */
export interface IndicateursQualite {
  controles_realises: number;
  conformes: number;
  taux_conformite: number | null;
  par_produit: RepartitionQualite[];
  par_etape: RepartitionQualite[];
  par_ligne: RepartitionQualite[];
  par_machine: RepartitionQualite[];
  par_parametre: RepartitionQualite[];
  non_conformites: { total: number; ouvertes: number; bloquantes_ouvertes: number; par_decision: Record<string, number> };
  controles_en_retard: number;
  controles_en_retard_bloquants: number;
  instruments_a_etalonner: string[];
}

// =====================================================================
// Référentiel : conversions d'unités
// =====================================================================

/** 1 unite_source = facteur unite_cible (ex. 1 SAC = 25 KG). Sans article : conversion générale. */
export interface ConversionUnite {
  id: number;
  article: number | null;
  article_code?: string | null;
  unite_source: UniteMesure;
  facteur: string;
  unite_cible: UniteMesure;
}

// =====================================================================
// Coûts en cascade (charge -> étape -> activité -> OF -> produit)
// =====================================================================

export interface NatureCout {
  id: number;
  code: string;
  libelle: string;
  etape: number | null;
  etape_libelle?: string | null;
  categorie: CategorieCout;
  categorie_economique: CategorieEconomique;
  traitement: Traitement;
  inducteur: Inducteur;
  justification: string;
  date_debut: string | null;
  date_fin: string | null;
  actif: boolean;
}

export interface Charge {
  id: number;
  numero: string;
  nature: number;
  nature_libelle?: string;
  categorie?: CategorieCout;
  etape?: string | null;
  inducteur?: Inducteur;
  /** AAAA-MM */
  periode: string;
  montant: string;
  activite: number | null;
  equipement: number | null;
  ordre_fabrication: number | null;
  tournee: number | null;
  statut_donnee: StatutDonnee;
  source: string;
  observations: string;
  statut_repartition: StatutRepartition;
  motif_non_repartition: string;
  saisi_par: number | null;
  date_saisie: string;
}

export interface RepartitionCout {
  id: number;
  charge: number;
  parent: number | null;
  niveau: NiveauRepartition;
  activite: number | null;
  ordre_fabrication: number | null;
  article: number | null;
  etape: number | null;
  inducteur: Inducteur;
  unite_cle: string;
  valeur_cle_totale: string | null;
  valeur_cle_part: string | null;
  quote_part: string;
  montant: string;
  quantite_produite: string | null;
  cout_par_pack: string | null;
  cout_par_unite: string | null;
  statut: "REEL" | "ESTIME" | "REPARTI";
  source: string;
  justification: string;
  date_calcul: string;
  charge_numero?: string;
  activite_code?: string | null;
  of_numero?: string | null;
  article_code?: string | null;
  etape_libelle?: string | null;
}

/** POST /couts/cascade/calculer/ */
export interface ResultatCalculCascade {
  periode: string;
  charges: number;
  repartie: number;
  partielle: number;
  non_repartie: number;
  ofs_recalcules: number;
  /** Liste vide = aucune double imputation. */
  anomalies_double_compte: string[];
}

type Montant = string | number;

/** GET /couts/cascade/cout-revient/?periode= */
export interface CoutRevientPeriode {
  periode: string;
  ofs: {
    of: string;
    article: string;
    quantite_produite: Montant;
    unites: Montant;
    packs: Montant;
    matieres: Montant;
    main_oeuvre: Montant;
    charges_reparties: Montant;
    charges_par_etape: Record<string, Montant>;
    energie_et_amortissement_anciens: Montant;
    cout_production: Montant;
    cout_par_unite: Montant | null;
    cout_par_pack: Montant | null;
  }[];
  produits: {
    article: string;
    designation: string;
    unites: Montant;
    production: Montant;
    stockage: Montant;
    distribution: Montant;
    production_par_unite: Montant | null;
    stockage_par_unite: Montant | null;
    distribution_par_unite: Montant | null;
    cout_revient_complet: Montant;
    cout_revient_complet_par_unite: Montant | null;
  }[];
  charges_non_reparties: { charge: string; nature: string; montant: Montant; statut: StatutRepartition; motif: string }[];
  etapes: string[];
}

/** GET /couts/cascade/eau-traitee/?periode= : une ligne par activité. */
export interface CoutEauTraitee {
  activite: string;
  charges_amont: Montant;
  litres: Montant;
  cout_par_litre: Montant | null;
  cout_par_m3: Montant | null;
}

/** GET /couts/cascade/controle/?periode= */
export interface ControleDoubleCompte {
  periode: string;
  conforme: boolean;
  anomalies: string[];
}

// =====================================================================
// Documents imprimés : identité de l'entreprise
// =====================================================================

/** GET/PATCH /documents/entreprise/ — imprimée sur tous les PDF. */
export interface ParametreEntreprise {
  raison_sociale: string;
  forme_juridique: string;
  capital: string;
  activite: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  site_web: string;
  ifu: string;
  rccm: string;
  regime_fiscal: string;
  centre_impots: string;
  banque: string;
  conditions_paiement: string;
  mentions_pied_de_page: string;
  /** #RRGGBB */
  couleur: string;
  a_un_logo: boolean;
  /** Facture normalisée SFEC : à activer quand l'accès est en place (jeton côté serveur). */
  sfec_actif?: boolean;
  sfec_url?: string;
  sfec_nim?: string;
}

// =====================================================================
// Mise à jour backend PR #6 à #8 : devis, comptes, OF multi-format,
// planning, palettes, rappel de lot, bibliothèque de contrôles
// =====================================================================

export interface LigneDevis {
  id: number;
  devis: number;
  article: number;
  article_code?: string;
  article_designation?: string;
  quantite: string;
  /** Repris du tarif en vigueur ; dérogation possible pour un client sous contrat (Direction / DAF). */
  prix_unitaire: string;
  tarif?: number | null;
  prix_tarif?: string | null;
  motif_derogation: string;
  derogation_autorisee_par: number | null;
  quantite_acceptee: string | null;
  montant_ht?: string;
}

export interface Devis {
  id: number;
  numero: string;
  client: number;
  client_nom?: string;
  type_commande: TypeCommande;
  date_validite: string;
  statut: StatutDevis;
  conditions: string;
  motif_refus: string;
  cree_par: number;
  date_creation: string;
  date_envoi: string | null;
  date_reponse: string | null;
  lignes: LigneDevis[];
  totaux?: Record<string, string | number>;
  /** Numéros des commandes créées à l'acceptation. */
  commandes?: string[];
}

/** Correspondance article / activité / catégorie / format -> compte (702x, 60x). */
export interface RegleCompte {
  id: number;
  sens: SensCompte;
  compte: string;
  libelle: string;
  article: number | null;
  activite: number | null;
  type_article: string;
  format: number | null;
  unite_vente: number | null;
  actif: boolean;
}

/** Cuve préparée, nettoyage, arrêt puis redémarrage : déclenchent les contrôles prévus au plan. */
export interface EvenementProduction {
  id: number;
  ordre_fabrication: number;
  of_numero?: string;
  type_evenement: TypeEvenement;
  equipement: number | null;
  numero_cuve: string;
  volume: string | null;
  duree_min: string | null;
  date: string;
  observations: string;
  saisi_par: number | null;
}

export interface FormatOF {
  id: number;
  ordre_fabrication: number;
  article: number;
  article_code?: string;
  quantite_a_produire: string;
}

/** Matière réservée par un OF lancé (libérée à la sortie, à la clôture ou à l'annulation). */
export interface ReservationMatiere {
  id: number;
  ordre_fabrication: number;
  matiere: number;
  matiere_code?: string;
  depot: number;
  depot_nom?: string;
  quantite_reservee: string;
  quantite_restante: string;
  date: string;
}

export type ChampEtape =
  | "quantite_entree"
  | "quantite_produite"
  | "quantite_rejetee"
  | "date_debut"
  | "date_fin"
  | "duree_arret_min"
  | "heures_machine"
  | "energie_kwh"
  | "poste"
  | "equipement";

/** Donnée à saisir à une étape, obligatoire ou facultative. */
export interface DonneeObligatoireEtape {
  id: number;
  etape: number;
  etape_code?: string;
  champ: ChampEtape;
  obligatoire: boolean;
}

/** GET /production/planning/ : charge par ligne et par jour face à la capacité. */
export interface PlanningProduction {
  du: string;
  au: string;
  lignes: {
    ligne: string;
    designation: string;
    usine: string;
    activite: string;
    cadence: string | null;
    unite_cadence: string;
    ordres_fabrication: { id: number; numero: string; article: string; quantite: string; statut: string; debut: string; fin: string }[];
    jours: { date: string; heures_planifiees: string | number; capacite_heures: string | number; taux_charge: number | null; surcharge: boolean }[];
  }[];
  of_non_planifies: { id: number; numero: string; article: string; quantite: string; ligne: string | null; statut: string }[];
}

/** Modèle réutilisable de la bibliothèque de contrôles. */
export interface ModeleControle {
  id: number;
  code: string;
  designation: string;
  parametre: number;
  parametre_libelle?: string;
  instrument: number | null;
  methode: string;
  laboratoire: Laboratoire;
  type_echantillon: string;
  quantite_echantillon: string;
  nombre_echantillons: number;
  obligatoire: boolean;
  bloquant: boolean;
  actions_si_non_conforme: string;
  actif: boolean;
}

export interface Emplacement {
  id: number;
  code: string;
  depot: number;
  depot_nom?: string;
  designation: string;
  capacite_palettes: number | null;
  actif: boolean;
  palettes_en_stock?: number;
}

export interface Palette {
  id: number;
  numero: string;
  lot: number;
  lot_numero?: string;
  article_code?: string;
  depot: number;
  depot_nom?: string;
  emplacement: number | null;
  emplacement_code?: string | null;
  quantite: string;
  statut: StatutPalette;
  cree_par: number | null;
  date_creation: string;
}

/** Entrée (+) ou sortie (-) d'un lot de produit fini dans un lieu. */
export interface MouvementLot {
  id: number;
  lot: number;
  lot_numero?: string;
  depot: number;
  depot_nom?: string;
  quantite: string;
  motif: string;
  document_origine: string;
  ligne_commande: number | null;
  ligne_transfert: number | null;
  date: string;
}

/** Client livré d'un lot (traçabilité aval, rappel). */
export interface ClientLivreLot {
  client: string;
  code: string;
  telephone: string;
  adresse: string;
  quantite: string | number;
  livraisons: { commande: string; bon_livraison: string | null; date: string; quantite: string | number }[];
}

/** GET /qualite/lots/{id}/rappel/ */
export interface RappelLot {
  lot: string;
  article: string;
  statut: string;
  quantite_produite: string;
  clients: ClientLivreLot[];
  stock_restant: { lieu: string; quantite: string }[];
  palettes_en_stock: string[];
}

/** Réclamation à réceptionner (vue réduite pour le Magasinier et la Qualité). */
export interface ReclamationAReceptionner {
  id: number;
  numero: string;
  client: number;
  client_nom: string;
  article: number;
  article_code: string;
  article_designation: string;
  quantite: string;
  bon_livraison_numero: string | null;
  statut: StatutReclamation;
  date_creation: string;
}

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: Profil;
  active: boolean;
}

/** Annuaire léger de tous les comptes (GET /comptes/annuaire/), ouvert à tout
 * utilisateur authentifié — sert à résoudre un nom sans les droits d'ADMIN_SI
 * qu'exige UtilisateurViewSet. */
export interface AnnuaireEntry {
  id: number;
  username: string;
  nom: string;
  profil: Profil;
  profil_libelle: string;
  actif: boolean;
}

/** Une notification « à faire » (GET /notifications/) : générée automatiquement
 * à la création ou au changement de statut d'un document qui vous concerne. */
export interface AppNotification {
  id: number;
  titre: string;
  message: string;
  type_document: string;
  document_id: number | null;
  reference: string;
  lue: boolean;
  date: string;
}

/** Une ligne de l'historique d'un document (GET .../{id}/historique/) :
 * création ou changement de statut, qui et quand. */
export interface HistoriqueLigne {
  date: string;
  action: string;
  ancien_statut: string;
  nouveau_statut: string;
  par: string;
}

export interface AppState {
  currentUserId: number | null;
  depotId: number | null;
  annuaire: AnnuaireEntry[];
  utilisateurs: Utilisateur[];
  journal: JournalAction[];
  articles: Article[];
  controlesQualiteRequis: ControleQualiteRequis[];
  codesFiscaux: CodeFiscal[];
  famillesFiscales: FamilleFiscale[];
  famillesArticle: FamilleArticle[];
  formatsArticle: FormatArticle[];
  parfums: Parfum[];
  unitesVente: UniteVenteArticle[];
  fichesTechniques: FicheTechnique[];
  compositions: CompositionFicheTechnique[];
  fichesConditionnement: FicheConditionnement[];
  fournisseurs: Fournisseur[];
  contratsFournisseurs: ContratFournisseur[];
  catalogueFournisseurs: ArticleFournisseur[];
  besoinsAchat: BesoinApprovisionnement[];
  demandesAchat: DemandeAchat[];
  commandesFournisseur: CommandeFournisseur[];
  lignesCommandeFournisseur: LigneCommandeFournisseur[];
  receptions: ReceptionAchat[];
  lignesReception: LigneReceptionAchat[];
  retoursFournisseur: RetourFournisseur[];
  depots: Depot[];
  stock: StockArticle[];
  mouvements: MouvementStock[];
  inventaires: Inventaire[];
  lignesInventaire: LigneInventaire[];
  plans: PlanProduction[];
  ofList: OrdreFabrication[];
  besoinsMatieres: BesoinMatierePrevu[];
  demandesMatieres: DemandeMatiere[];
  demandesComplementaires: DemandeComplementaire[];
  sortiesMatieres: SortieMatiere[];
  retoursMatieres: RetourMatiere[];
  suivisProduction: SuiviProduction[];
  suivisEau: SuiviEau[];
  etapes: EtapeProduction[];
  pertes: PerteProduction[];
  lots: Lot[];
  controles: ControleQualite[];
  clients: Client[];
  prospects: Prospect[];
  contratsClients: ContratClient[];
  tarifs: Tarif[];
  commandes: Commande[];
  lignesCommande: LigneCommande[];
  factures: Facture[];
  lignesFacture: LigneFacture[];
  avoirs: Avoir[];
  caisses: Caisse[];
  sessionsCaisse: SessionCaisse[];
  encaissements: Encaissement[];
  decaissements: Decaissement[];
  ecartsCaisse: EcartCaisse[];
  vehicules: Vehicule[];
  chauffeurs: Chauffeur[];
  depotsDistribution: DepotDistribution[];
  tournees: Tournee[];
  preparations: PreparationLivraison[];
  bonsLivraison: BonLivraison[];
  transferts: TransfertDepot[];
  reclamations: ReclamationClient[];
  retoursPhysiques: RetourPhysique[];
  controlesRetour: ControleRetour[];
  reconditionnements: Reconditionnement[];
  coutsRetours: CoutRetourPerte[];
  solutionsReclamation: SolutionClient[];
  coutsMatieres: CoutMatiere[];
  coutsEnergie: CoutEnergie[];
  coutsMainOeuvre: CoutMainOeuvre[];
  amortissements: Amortissement[];
  coutsStandards: CoutStandard[];
  coutsReels: CoutReel[];
  anomalies: AnomalieDetectee[];
  exportsComptables: ExportComptable[];
  clotures: Cloture[];
  comptesParametres: CompteParametre[];
  seuilsControles: ParametreControle[];
  ecrituresComptables: EcritureComptable[];
  rapports: RapportGenere[];
  // Socle industriel
  activites: Activite[];
  usines: Usine[];
  etapesStandard: EtapeStandard[];
  lignesProduction: LigneProduction[];
  postes: Poste[];
  equipements: Equipement[];
  circuits: Circuit[];
  // Production / stocks
  changementsSerie: ChangementSerie[];
  lotsMatieres: LotMatiere[];
  transfertsStock: TransfertStock[];
  conversions: ConversionUnite[];
  // Contrôle qualité
  parametresQualite: ParametreQualite[];
  instruments: Instrument[];
  planControle: PointControle[];
  controlesRealises: ControleRealise[];
  nonConformites: NonConformite[];
  // Coûts en cascade
  naturesCout: NatureCout[];
  charges: Charge[];
  // Mise à jour backend PR #6 à #8
  devis: Devis[];
  reglesComptes: RegleCompte[];
  evenementsProduction: EvenementProduction[];
  reservations: ReservationMatiere[];
  donneesEtapes: DonneeObligatoireEtape[];
  modelesControle: ModeleControle[];
  emplacements: Emplacement[];
  palettes: Palette[];
  lastError: string | null;
  loading: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
