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
export type StatutPlan = "PREVU" | "EN_COURS" | "REALISE" | "ANNULE";
export type StatutOF =
  | "BROUILLON"
  | "PLANIFIE"
  | "LANCE"
  | "EN_PRODUCTION"
  | "TERMINE"
  | "CONTROLE_QUALITE"
  | "LIBERE"
  | "CLOTURE";
export type TypeSortie = "NORMALE" | "COMPLEMENTAIRE";
export type Etape =
  | "CAPTAGE"
  | "TRAITEMENT"
  | "SOUFFLAGE"
  | "EMBOUTEILLAGE"
  | "ETIQUETAGE"
  | "CONDITIONNEMENT";
export type MotifPerte = "CASSE" | "NON_CONFORMITE" | "PANNE_MACHINE" | "ERREUR_MANIPULATION" | "AUTRE";
export type StatutLot = "EN_ATTENTE" | "CONFORME" | "NON_CONFORME" | "BLOQUE" | "LIBERE";
export type ResultatControle = "CONFORME" | "NON_CONFORME";
export type TypeMouvement = "ENTREE" | "SORTIE" | "TRANSFERT" | "AJUSTEMENT" | "RETOUR";
export type StatutInventaire = "EN_COURS" | "CLOTURE";
export type OrigineBesoin = "AUTO_PRODUCTION" | "MANUEL";
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
export type StatutPreparation = "A_PREPARER" | "EN_PREPARATION" | "PRETE" | "SORTIE_MAGASIN";
export type StatutBL = "EN_LIVRAISON" | "LIVREE" | "PARTIELLEMENT_LIVREE" | "RETOURNEE";
export type TypeAnomalie =
  | "ECART_STOCK"
  | "ECART_CAISSE"
  | "DEPASSEMENT_MATIERE"
  | "LOT_NON_LIBERE_VENDU"
  | "COMMANDE_CLIENT_BLOQUE"
  | "AUTRE";
export type StatutAnomalie = "DETECTEE" | "EN_TRAITEMENT" | "TRAITEE" | "IGNOREE";
export type TypeExport = "VENTES" | "ENCAISSEMENTS" | "ACHATS" | "JOURNAL";
export type TypeCloture = "MENSUELLE" | "ANNUELLE";
export type TypeEnergie = "ELECTRICITE" | "EAU_CAPTAGE";

export interface Utilisateur {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  profil: Profil;
  telephone: string;
  actif: boolean;
  date_creation: string;
}

export interface MatriceDroit {
  id: number;
  profil: Profil;
  module: ModuleMetier;
  peut_consulter: boolean;
  peut_creer: boolean;
  peut_modifier: boolean;
  peut_valider: boolean;
  peut_annuler: boolean;
  peut_exporter: boolean;
  peut_parametrer: boolean;
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
  code: string;
  designation: string;
  type_article: TypeArticle;
  unite_mesure: UniteMesure;
  famille: string;
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
}

export interface CompositionFicheTechnique {
  id: number;
  fiche_technique: number;
  matiere: number;
  quantite_necessaire: string;
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
  statut: StatutOF;
  responsable: number;
  agents_affectes: number[];
  date_lancement: string | null;
  date_fin: string | null;
  date_creation: string;
}

export interface BesoinMatierePrevu {
  id: number;
  ordre_fabrication: number;
  matiere: number;
  quantite_theorique: string;
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
  date_retour: string;
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
  code: string;
  nom: string;
  type_client: TypeClient;
  adresse: string;
  telephone: string;
  encours_autorise: string;
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
  montant_total: string;
  statut: StatutFacture;
  date_emission: string;
}

export interface Caisse {
  id: number;
  nom: string;
  emplacement: string;
  actif: boolean;
}

export interface SessionCaisse {
  id: number;
  caisse: number;
  caissier: number;
  solde_ouverture: string;
  solde_theorique_cloture: string | null;
  solde_compte_cloture: string | null;
  statut: StatutSession;
  date_ouverture: string;
  date_cloture: string | null;
}

export interface Encaissement {
  id: number;
  numero: string;
  session_caisse: number;
  facture: number;
  montant: string;
  mode_paiement: ModePaiement;
  date_encaissement: string;
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
  confirme_par: number | null;
  date_generation: string;
  date_livraison: string | null;
}

export interface TransfertDepot {
  id: number;
  depot_source: number;
  depot_destination: number;
  date_transfert: string;
  statut: string;
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
  date_detection: string;
  date_traitement: string | null;
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

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: Profil;
  active: boolean;
}

export interface AppState {
  currentUserId: number | null;
  depotId: number | null;
  utilisateurs: Utilisateur[];
  droits: MatriceDroit[];
  journal: JournalAction[];
  articles: Article[];
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
  sortiesMatieres: SortieMatiere[];
  retoursMatieres: RetourMatiere[];
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
  caisses: Caisse[];
  sessionsCaisse: SessionCaisse[];
  encaissements: Encaissement[];
  ecartsCaisse: EcartCaisse[];
  vehicules: Vehicule[];
  chauffeurs: Chauffeur[];
  depotsDistribution: DepotDistribution[];
  tournees: Tournee[];
  preparations: PreparationLivraison[];
  bonsLivraison: BonLivraison[];
  transferts: TransfertDepot[];
  coutsMatieres: CoutMatiere[];
  coutsEnergie: CoutEnergie[];
  coutsMainOeuvre: CoutMainOeuvre[];
  amortissements: Amortissement[];
  coutsStandards: CoutStandard[];
  coutsReels: CoutReel[];
  anomalies: AnomalieDetectee[];
  exportsComptables: ExportComptable[];
  clotures: Cloture[];
  lastError: string | null;
  loading: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
