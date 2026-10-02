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

export type TypeArticle = "MATIERE_PREMIERE" | "PRODUIT_INTERMEDIAIRE" | "PRODUIT_FINI";
export type UniteMesure = "KG" | "L" | "UNITE" | "CARTON" | "PALETTE" | "M";
export type StatutFicheTechnique = "BROUILLON" | "VALIDEE" | "ARCHIVEE";
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
export type Etape =
  | "CAPTAGE"
  | "TRAITEMENT"
  | "SOUFFLAGE"
  | "EMBOUTEILLAGE"
  | "ETIQUETAGE"
  | "CONDITIONNEMENT";
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
}

/** Un article pouvant entrer dans une composition (matière première ou
 * produit intermédiaire actif, pas encore présent dans la fiche) — renvoyé
 * par GET .../fiches-techniques/{id}/elements_disponibles/. */
export interface ElementComposition {
  id: number;
  code: string;
  designation: string;
  type_article: TypeArticle;
  unite_mesure: UniteMesure;
}

export interface FamilleArticle {
  id: number;
  nom: string;
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
}

export interface CompositionFicheTechnique {
  id: number;
  fiche_technique: number;
  matiere: number;
  quantite_necessaire: string;
  matiere_code?: string;
  matiere_designation?: string;
  matiere_type?: TypeArticle;
  unite_mesure?: UniteMesure;
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
}

export interface ReceptionAchat {
  id: number;
  commande: number;
  receptionne_par: number;
  conforme: boolean;
  observations: string;
  date_reception: string;
}

export interface LigneReceptionAchat {
  id: number;
  reception: number;
  ligne_commande: number;
  quantite_recue: string;
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
  nom: string;
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
}

export interface OrdreFabrication {
  id: number;
  numero: string;
  plan_production: number | null;
  article: number;
  quantite_a_produire: string;
  equipe: string;
  statut: StatutOF;
  motif_annulation: string;
  responsable: number;
  agents_affectes: number[];
  date_debut_production: string | null;
  date_fin: string | null;
  date_creation: string;
}

export interface BesoinMatierePrevu {
  id: number;
  ordre_fabrication: number;
  matiere: number;
  quantite_theorique: string;
  /** Enrichissement API list (§5.5), non stocké en base. */
  stock_disponible?: string | number;
  manquant?: string | number;
  situation?: string;
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
  etape: Etape;
  agent: number;
  quantite_produite: string | null;
  date_debut: string | null;
  date_fin: string | null;
  observations: string;
}

export interface PerteProduction {
  id: number;
  ordre_fabrication: number;
  etape: number | null;
  quantite_perte: string;
  taux_perte?: string | null;
  motif: MotifPerte;
  observations: string;
  date_constat: string;
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
  date_creation: string;
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
}

export interface Commande {
  id: number;
  numero: string;
  client: number;
  type_commande: TypeCommande;
  statut: StatutCommande;
  cree_par: number;
  date_commande: string;
}

export interface LigneCommande {
  id: number;
  commande: number;
  article: number;
  quantite: string;
  prix_unitaire: string;
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
}

export interface PreparationLivraison {
  id: number;
  commande: number;
  statut: StatutPreparation;
  lancee_par: number;
  preparee_par: number | null;
  date_lancement: string;
  date_confirmation_sortie: string | null;
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
}

export interface ControleRetour {
  id: number;
  retour_physique: number;
  resultat: ResultatControleRetour;
  observations: string;
  controle_par: number;
  date_controle: string;
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
  lastError: string | null;
  loading: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
