import { api, apiUpload, listAll, ouvrirPdf } from "./client";
import type {
  Activite,
  BonSortieOF,
  ChangementSerie,
  Charge,
  Circuit,
  ConsommationLotMatiere,
  ConsommationReelleOF,
  ControleDoubleCompte,
  ControleRealise,
  ConversionUnite,
  CoutEauTraitee,
  CoutRevientPeriode,
  EtapeCircuit,
  EtapeStandard,
  Equipement,
  IndicateursQualite,
  Instrument,
  LigneProduction,
  LigneTransfert,
  LotMatiere,
  NatureCout,
  NonConformite,
  ParametreEntreprise,
  ParametreProduction,
  ParametreQualite,
  PieceJointeQualite,
  PointControle,
  Poste,
  RepartitionCout,
  ResultatCalculCascade,
  TracabiliteLot,
  TracabiliteLotMatiere,
  TransfertStock,
  Usine,
  VerificationStockOF,
  Amortissement,
  AnnuaireEntry,
  AppNotification,
  HistoriqueLigne,
  AnomalieDetectee,
  Article,
  ArticleFournisseur,
  Avoir,
  BesoinApprovisionnement,
  BesoinMatierePrevu,
  BonLivraison,
  Caisse,
  Chauffeur,
  Client,
  Cloture,
  CompteParametre,
  ParametreControle,
  EcritureComptable,
  ValorisationStock,
  CodeFiscal,
  FamilleArticle,
  FamilleFiscale,
  FormatArticle,
  Parfum,
  UniteVenteArticle,
  Commande,
  CommandeFournisseur,
  CompositionFicheTechnique,
  ContratClient,
  ContratFournisseur,
  ControleQualite,
  ControleQualiteRequis,
  ControleRetour,
  CoutEnergie,
  CoutMatiere,
  CoutMainOeuvre,
  CoutReel,
  CoutRetourPerte,
  CoutStandard,
  Decaissement,
  DemandeAchat,
  DemandeComplementaire,
  DemandeMatiere,
  Depot,
  DepotDistribution,
  EcartCaisse,
  ElementComposition,
  Encaissement,
  EtapeProduction,
  ExportComptable,
  Facture,
  FicheConditionnement,
  FicheTechnique,
  Fournisseur,
  Inventaire,
  JournalAction,
  LigneCommande,
  LigneCommandeFournisseur,
  LigneFacture,
  LigneInventaire,
  LigneReceptionAchat,
  Lot,
  MouvementStock,
  OrdreFabrication,
  PerteProduction,
  PlanProduction,
  PreparationLivraison,
  Profil,
  Prospect,
  RapportGenere,
  ReceptionAchat,
  ReclamationClient,
  Reconditionnement,
  RetourFournisseur,
  RetourMatiere,
  RetourPhysique,
  SessionCaisse,
  SolutionClient,
  SortieMatiere,
  StockArticle,
  SuiviEau,
  SuiviProduction,
  Tarif,
  Tournee,
  TransfertDepot,
  Utilisateur,
  Vehicule,
} from "../types";

export const endpoints = {
  utilisateurs: "/comptes/utilisateurs/",
  journal: "/comptes/journal/",
  articles: "/referentiel/articles/",
  controlesQualiteRequis: "/referentiel/controles-qualite-requis/",
  codesFiscaux: "/fiscalite/codes-fiscaux/",
  famillesFiscales: "/fiscalite/familles-fiscales/",
  famillesArticle: "/referentiel/familles/",
  formatsArticle: "/referentiel/formats/",
  parfums: "/referentiel/parfums/",
  unitesVente: "/referentiel/unites-vente/",
  fichesTechniques: "/referentiel/fiches-techniques/",
  compositions: "/referentiel/compositions/",
  fichesConditionnement: "/referentiel/fiches-conditionnement/",
  fournisseurs: "/achats/fournisseurs/",
  contratsFournisseurs: "/achats/contrats-fournisseurs/",
  catalogueFournisseurs: "/achats/catalogue-fournisseurs/",
  besoinsAchat: "/achats/besoins/",
  demandesAchat: "/achats/demandes/",
  commandesFournisseur: "/achats/commandes/",
  lignesCommandeFournisseur: "/achats/lignes-commande/",
  receptions: "/achats/receptions/",
  lignesReception: "/achats/lignes-reception/",
  retoursFournisseur: "/achats/retours/",
  depots: "/stocks/depots/",
  stock: "/stocks/stock-articles/",
  mouvements: "/stocks/mouvements/",
  inventaires: "/stocks/inventaires/",
  lignesInventaire: "/stocks/lignes-inventaire/",
  plans: "/production/plans/",
  ofList: "/production/ordres-fabrication/",
  besoinsMatieres: "/production/besoins-matieres/",
  demandesMatieres: "/production/demandes-matieres/",
  demandesComplementaires: "/production/demandes-complementaires/",
  sortiesMatieres: "/production/sorties-matieres/",
  retoursMatieres: "/production/retours-matieres/",
  suivisProduction: "/production/suivis-production/",
  suivisEau: "/production/suivis-eau/",
  etapes: "/production/etapes/",
  pertes: "/production/pertes/",
  lots: "/qualite/lots/",
  controles: "/qualite/controles/",
  clients: "/commercial/clients/",
  prospects: "/commercial/prospects/",
  contratsClients: "/commercial/contrats/",
  tarifs: "/commercial/tarifs/",
  commandes: "/commercial/commandes/",
  lignesCommande: "/commercial/lignes-commande/",
  factures: "/commercial/factures/",
  lignesFacture: "/commercial/lignes-facture/",
  avoirs: "/commercial/avoirs/",
  caisses: "/caisse/caisses/",
  sessionsCaisse: "/caisse/sessions/",
  encaissements: "/caisse/encaissements/",
  decaissements: "/caisse/decaissements/",
  ecartsCaisse: "/caisse/ecarts/",
  vehicules: "/distribution/vehicules/",
  chauffeurs: "/distribution/chauffeurs/",
  depotsDistribution: "/distribution/depots/",
  tournees: "/distribution/tournees/",
  preparations: "/distribution/preparations/",
  bonsLivraison: "/distribution/bons-livraison/",
  transferts: "/distribution/transferts/",
  reclamations: "/reclamations/reclamations/",
  retoursPhysiques: "/reclamations/retours-physiques/",
  controlesRetour: "/reclamations/controles/",
  reconditionnements: "/reclamations/reconditionnements/",
  coutsRetours: "/reclamations/couts-retours/",
  solutionsReclamation: "/reclamations/solutions/",
  coutsMatieres: "/couts/couts-matieres/",
  coutsEnergie: "/couts/couts-energie/",
  coutsMainOeuvre: "/couts/couts-main-oeuvre/",
  amortissements: "/couts/amortissements/",
  coutsStandards: "/couts/couts-standards/",
  coutsReels: "/couts/couts-reels/",
  anomalies: "/comptabilite/anomalies/",
  exportsComptables: "/comptabilite/exports/",
  clotures: "/comptabilite/clotures/",
  comptesParametres: "/comptabilite/comptes/",
  seuilsControles: "/comptabilite/seuils-controles/",
  ecrituresComptables: "/comptabilite/ecritures/",
  rapports: "/reporting/rapports/",
  // Socle industriel
  activites: "/industriel/activites/",
  usines: "/industriel/usines/",
  etapesStandard: "/industriel/etapes/",
  lignesProduction: "/industriel/lignes/",
  postes: "/industriel/postes/",
  equipements: "/industriel/equipements/",
  circuits: "/industriel/circuits/",
  etapesCircuit: "/industriel/etapes-circuit/",
  // Production
  changementsSerie: "/production/changements-serie/",
  parametresProduction: "/production/parametres/",
  // Stocks
  lotsMatieres: "/stocks/lots-matieres/",
  transfertsStock: "/stocks/transferts/",
  lignesTransfert: "/stocks/lignes-transfert/",
  conversions: "/referentiel/conversions/",
  // Contrôle qualité
  parametresQualite: "/qualite/parametres/",
  instruments: "/qualite/instruments/",
  planControle: "/qualite/plan-controle/",
  controlesRealises: "/qualite/controles-realises/",
  nonConformites: "/qualite/non-conformites/",
  piecesJointesQualite: "/qualite/pieces-jointes/",
  // Coûts en cascade
  naturesCout: "/couts/natures/",
  charges: "/couts/charges/",
  repartitionsCout: "/couts/repartitions/",
} as const;

export type EndpointKey = keyof typeof endpoints;

export const catalog = {
  utilisateurs: () => listAll<Utilisateur>(endpoints.utilisateurs),
  journal: () => listAll<JournalAction>(endpoints.journal),
  articles: () => listAll<Article>(endpoints.articles),
  controlesQualiteRequis: () => listAll<ControleQualiteRequis>(endpoints.controlesQualiteRequis),
  codesFiscaux: () => listAll<CodeFiscal>(endpoints.codesFiscaux),
  famillesFiscales: () => listAll<FamilleFiscale>(endpoints.famillesFiscales),
  famillesArticle: () => listAll<FamilleArticle>(endpoints.famillesArticle),
  formatsArticle: () => listAll<FormatArticle>(endpoints.formatsArticle),
  parfums: () => listAll<Parfum>(endpoints.parfums),
  unitesVente: () => listAll<UniteVenteArticle>(endpoints.unitesVente),
  fichesTechniques: () => listAll<FicheTechnique>(endpoints.fichesTechniques),
  compositions: () => listAll<CompositionFicheTechnique>(endpoints.compositions),
  fichesConditionnement: () => listAll<FicheConditionnement>(endpoints.fichesConditionnement),
  fournisseurs: () => listAll<Fournisseur>(endpoints.fournisseurs),
  contratsFournisseurs: () => listAll<ContratFournisseur>(endpoints.contratsFournisseurs),
  catalogueFournisseurs: () => listAll<ArticleFournisseur>(endpoints.catalogueFournisseurs),
  besoinsAchat: () => listAll<BesoinApprovisionnement>(endpoints.besoinsAchat),
  demandesAchat: () => listAll<DemandeAchat>(endpoints.demandesAchat),
  commandesFournisseur: () => listAll<CommandeFournisseur>(endpoints.commandesFournisseur),
  lignesCommandeFournisseur: () => listAll<LigneCommandeFournisseur>(endpoints.lignesCommandeFournisseur),
  receptions: () => listAll<ReceptionAchat>(endpoints.receptions),
  lignesReception: () => listAll<LigneReceptionAchat>(endpoints.lignesReception),
  retoursFournisseur: () => listAll<RetourFournisseur>(endpoints.retoursFournisseur),
  depots: () => listAll<Depot>(endpoints.depots),
  stock: () => listAll<StockArticle>(endpoints.stock),
  mouvements: () => listAll<MouvementStock>(endpoints.mouvements),
  inventaires: () => listAll<Inventaire>(endpoints.inventaires),
  lignesInventaire: () => listAll<LigneInventaire>(endpoints.lignesInventaire),
  plans: () => listAll<PlanProduction>(endpoints.plans),
  ofList: () => listAll<OrdreFabrication>(endpoints.ofList),
  besoinsMatieres: () => listAll<BesoinMatierePrevu>(endpoints.besoinsMatieres),
  demandesMatieres: () => listAll<DemandeMatiere>(endpoints.demandesMatieres),
  demandesComplementaires: () => listAll<DemandeComplementaire>(endpoints.demandesComplementaires),
  sortiesMatieres: () => listAll<SortieMatiere>(endpoints.sortiesMatieres),
  retoursMatieres: () => listAll<RetourMatiere>(endpoints.retoursMatieres),
  suivisProduction: () => listAll<SuiviProduction>(endpoints.suivisProduction),
  suivisEau: () => listAll<SuiviEau>(endpoints.suivisEau),
  etapes: () => listAll<EtapeProduction>(endpoints.etapes),
  pertes: () => listAll<PerteProduction>(endpoints.pertes),
  lots: () => listAll<Lot>(endpoints.lots),
  controles: () => listAll<ControleQualite>(endpoints.controles),
  clients: () => listAll<Client>(endpoints.clients),
  prospects: () => listAll<Prospect>(endpoints.prospects),
  contratsClients: () => listAll<ContratClient>(endpoints.contratsClients),
  tarifs: () => listAll<Tarif>(endpoints.tarifs),
  commandes: () => listAll<Commande>(endpoints.commandes),
  lignesCommande: () => listAll<LigneCommande>(endpoints.lignesCommande),
  factures: () => listAll<Facture>(endpoints.factures),
  lignesFacture: () => listAll<LigneFacture>(endpoints.lignesFacture),
  avoirs: () => listAll<Avoir>(endpoints.avoirs),
  caisses: () => listAll<Caisse>(endpoints.caisses),
  sessionsCaisse: () => listAll<SessionCaisse>(endpoints.sessionsCaisse),
  encaissements: () => listAll<Encaissement>(endpoints.encaissements),
  decaissements: () => listAll<Decaissement>(endpoints.decaissements),
  ecartsCaisse: () => listAll<EcartCaisse>(endpoints.ecartsCaisse),
  vehicules: () => listAll<Vehicule>(endpoints.vehicules),
  chauffeurs: () => listAll<Chauffeur>(endpoints.chauffeurs),
  depotsDistribution: () => listAll<DepotDistribution>(endpoints.depotsDistribution),
  tournees: () => listAll<Tournee>(endpoints.tournees),
  preparations: () => listAll<PreparationLivraison>(endpoints.preparations),
  bonsLivraison: () => listAll<BonLivraison>(endpoints.bonsLivraison),
  transferts: () => listAll<TransfertDepot>(endpoints.transferts),
  reclamations: () => listAll<ReclamationClient>(endpoints.reclamations),
  retoursPhysiques: () => listAll<RetourPhysique>(endpoints.retoursPhysiques),
  controlesRetour: () => listAll<ControleRetour>(endpoints.controlesRetour),
  reconditionnements: () => listAll<Reconditionnement>(endpoints.reconditionnements),
  coutsRetours: () => listAll<CoutRetourPerte>(endpoints.coutsRetours),
  solutionsReclamation: () => listAll<SolutionClient>(endpoints.solutionsReclamation),
  coutsMatieres: () => listAll<CoutMatiere>(endpoints.coutsMatieres),
  coutsEnergie: () => listAll<CoutEnergie>(endpoints.coutsEnergie),
  coutsMainOeuvre: () => listAll<CoutMainOeuvre>(endpoints.coutsMainOeuvre),
  amortissements: () => listAll<Amortissement>(endpoints.amortissements),
  coutsStandards: () => listAll<CoutStandard>(endpoints.coutsStandards),
  coutsReels: () => listAll<CoutReel>(endpoints.coutsReels),
  anomalies: () => listAll<AnomalieDetectee>(endpoints.anomalies),
  exportsComptables: () => listAll<ExportComptable>(endpoints.exportsComptables),
  clotures: () => listAll<Cloture>(endpoints.clotures),
  comptesParametres: () => listAll<CompteParametre>(endpoints.comptesParametres),
  seuilsControles: () => listAll<ParametreControle>(endpoints.seuilsControles),
  ecrituresComptables: () => listAll<EcritureComptable>(endpoints.ecrituresComptables),
  rapports: () => listAll<RapportGenere>(endpoints.rapports),
  activites: () => listAll<Activite>(endpoints.activites),
  usines: () => listAll<Usine>(endpoints.usines),
  etapesStandard: () => listAll<EtapeStandard>(endpoints.etapesStandard),
  lignesProduction: () => listAll<LigneProduction>(endpoints.lignesProduction),
  postes: () => listAll<Poste>(endpoints.postes),
  equipements: () => listAll<Equipement>(endpoints.equipements),
  circuits: () => listAll<Circuit>(endpoints.circuits),
  changementsSerie: () => listAll<ChangementSerie>(endpoints.changementsSerie),
  lotsMatieres: () => listAll<LotMatiere>(endpoints.lotsMatieres),
  transfertsStock: () => listAll<TransfertStock>(endpoints.transfertsStock),
  conversions: () => listAll<ConversionUnite>(endpoints.conversions),
  parametresQualite: () => listAll<ParametreQualite>(endpoints.parametresQualite),
  instruments: () => listAll<Instrument>(endpoints.instruments),
  planControle: () => listAll<PointControle>(endpoints.planControle),
  controlesRealises: () => listAll<ControleRealise>(endpoints.controlesRealises),
  nonConformites: () => listAll<NonConformite>(endpoints.nonConformites),
  naturesCout: () => listAll<NatureCout>(endpoints.naturesCout),
  charges: () => listAll<Charge>(endpoints.charges),
};

export type CatalogKey = keyof typeof catalog;

const SHARED_CATALOG: CatalogKey[] = ["articles", "stock", "lots"];

/** Socle industriel : lu par les métiers qui s'en servent, écrit par l'Admin SI et la Direction. */
const INDUSTRIEL: CatalogKey[] = ["activites", "usines", "etapesStandard", "lignesProduction", "postes", "equipements", "circuits"];

const CATALOG_BY_ROLE: Record<Profil, CatalogKey[]> = {
  // Admin SI : tout sauf commandes, factures, encaissements et tarifs (⛔ cahier des charges).
  ADMIN_SI: (Object.keys(catalog) as CatalogKey[]).filter(
    (k) => !["tarifs", "commandes", "lignesCommande", "factures", "lignesFacture", "encaissements"].includes(k),
  ),
  DIRECTION: [
    "articles",
    "stock",
    "lots",
    "journal",
    "ofList",
    "plans",
    "besoinsMatieres",
    "demandesMatieres",
    "controles",
    "depots",
    "mouvements",
    "inventaires",
    "lignesInventaire",
    "clients",
    "tarifs",
    "commandes",
    "lignesCommande",
    "factures",
    "lignesFacture",
    "fournisseurs",
    "besoinsAchat",
    "demandesAchat",
    "commandesFournisseur",
    "lignesCommandeFournisseur",
    "receptions",
    "lignesReception",
    "preparations",
    "bonsLivraison",
    "tournees",
    "utilisateurs",
    "encaissements",
    "caisses",
    "sessionsCaisse",
    "decaissements",
    "ecartsCaisse",
    "coutsMatieres",
    "coutsEnergie",
    "coutsMainOeuvre",
    "amortissements",
    "coutsStandards",
    "coutsReels",
    "anomalies",
    "ecrituresComptables",
    "exportsComptables",
    "clotures",
    "rapports",
    // Socle industriel (écriture), production, qualité et coûts en lecture
    ...INDUSTRIEL,
    "changementsSerie",
    "lotsMatieres",
    "transfertsStock",
    "conversions",
    "parametresQualite",
    "instruments",
    "planControle",
    "controlesRealises",
    "nonConformites",
    "naturesCout",
    "charges",
  ],
  RESPONSABLE_PRODUCTION: [
    "utilisateurs",
    "codesFiscaux",
    "famillesFiscales",
    "famillesArticle",
    "formatsArticle",
    "parfums",
    "unitesVente",
    "articles",
    "fichesTechniques",
    "compositions",
    "fichesConditionnement",
    "plans",
    "ofList",
    "besoinsMatieres",
    "demandesMatieres",
    "demandesComplementaires",
    "sortiesMatieres",
    "retoursMatieres",
    "suivisProduction",
    "suivisEau",
    "etapes",
    "pertes",
    "stock",
    "lots",
    "depots",
    "demandesAchat",
    "besoinsAchat",
    ...INDUSTRIEL,
    "changementsSerie",
    "lotsMatieres",
    "conversions",
    "parametresQualite",
    "instruments",
    "planControle",
    "controlesRealises",
    "nonConformites",
  ],
  AGENT_PRODUCTION: [
    "utilisateurs",
    "famillesArticle",
    "articles",
    "ofList",
    "besoinsMatieres",
    "demandesMatieres",
    "demandesComplementaires",
    "suivisProduction",
    "suivisEau",
    "etapes",
    "pertes",
    "stock",
    "lots",
    // Étapes, postes et machines pour la saisie atelier ; contrôles de ses OF.
    "etapesStandard",
    "lignesProduction",
    "postes",
    "equipements",
    "circuits",
    "changementsSerie",
    "conversions",
    "instruments",
    "planControle",
    "controlesRealises",
  ],
  RESPONSABLE_QUALITE: [
    "utilisateurs",
    "codesFiscaux",
    "famillesFiscales",
    "famillesArticle",
    "formatsArticle",
    "parfums",
    "unitesVente",
    "articles",
    "lots",
    "controles",
    "controlesQualiteRequis",
    "controlesRetour",
    "retoursPhysiques",
    "stock",
    "fichesTechniques",
    "compositions",
    "ofList",
    "depots",
    ...INDUSTRIEL,
    "changementsSerie",
    "lotsMatieres",
    "conversions",
    "parametresQualite",
    "instruments",
    "planControle",
    "controlesRealises",
    "nonConformites",
  ],
  MAGASINIER: [
    "utilisateurs",
    "clients",
    "articles",
    "depots",
    "stock",
    "mouvements",
    "inventaires",
    "lignesInventaire",
    "sortiesMatieres",
    "retoursMatieres",
    "besoinsMatieres",
    "demandesMatieres",
    "demandesComplementaires",
    "receptions",
    "lignesReception",
    "demandesAchat",
    "commandesFournisseur",
    "lignesCommandeFournisseur",
    "preparations",
    "commandes",
    "lots",
    "transferts",
    "fournisseurs",
    "activites",
    "usines",
    "lotsMatieres",
    "transfertsStock",
    "conversions",
    "parametresQualite",
    "instruments",
    "planControle",
    "controlesRealises",
    "nonConformites",
  ],
  RESPONSABLE_ACHATS: [
    "utilisateurs",
    "codesFiscaux",
    "famillesFiscales",
    "famillesArticle",
    "formatsArticle",
    "parfums",
    "unitesVente",
    "articles",
    "fournisseurs",
    "contratsFournisseurs",
    "catalogueFournisseurs",
    "besoinsAchat",
    "demandesAchat",
    "commandesFournisseur",
    "lignesCommandeFournisseur",
    "receptions",
    "lignesReception",
    "stock",
    "lots",
    "depots",
    "activites",
    "lotsMatieres",
    "conversions",
    "nonConformites",
  ],
  COMMERCIAL: [
    "utilisateurs",
    "famillesFiscales",
    "famillesArticle",
    "formatsArticle",
    "parfums",
    "unitesVente",
    "articles",
    "codesFiscaux",
    "stock",
    "lots",
    "clients",
    "prospects",
    "contratsClients",
    "tarifs",
    "commandes",
    "lignesCommande",
    "factures",
    "lignesFacture",
    "avoirs",
    "reclamations",
    "activites",
    "depots",
    "transfertsStock",
    "conversions",
  ],
  CAISSIER: [
    "utilisateurs",
    "articles",
    "commandes",
    "factures",
    "caisses",
    "sessionsCaisse",
    "encaissements",
    "decaissements",
    "ecartsCaisse",
    "clients",
  ],
  RESPONSABLE_DISTRIBUTION: [
    "utilisateurs",
    "clients",
    "articles",
    "stock",
    "lots",
    "vehicules",
    "chauffeurs",
    "depotsDistribution",
    "tournees",
    "preparations",
    "bonsLivraison",
    "commandes",
    "lignesCommande",
    "factures",
    "lignesFacture",
    "reclamations",
    // Lieu de sortie des préparations et transferts vers les dépôts extérieurs.
    "depots",
    "activites",
    "transfertsStock",
  ],
  CHAUFFEUR: ["utilisateurs", "articles", "chauffeurs", "tournees", "bonsLivraison"],
  COMPTABILITE_DAF: [
    "utilisateurs",
    "famillesFiscales",
    "famillesArticle",
    "articles",
    "stock",
    "clients",
    "factures",
    "caisses",
    "sessionsCaisse",
    "encaissements",
    "journal",
    "anomalies",
    "exportsComptables",
    "clotures",
    "comptesParametres",
    "seuilsControles",
    "ecrituresComptables",
    "codesFiscaux",
    "coutsRetours",
    "rapports",
    "coutsMatieres",
    "coutsEnergie",
    "coutsMainOeuvre",
    "amortissements",
    "coutsStandards",
    "coutsReels",
    "mouvements",
    "decaissements",
    "ecartsCaisse",
    "depots",
    ...INDUSTRIEL,
    "changementsSerie",
    "transfertsStock",
    "conversions",
    "parametresQualite",
    "instruments",
    "planControle",
    "controlesRealises",
    "naturesCout",
    "charges",
  ],
};

export function catalogKeysForRole(profil: Profil): CatalogKey[] {
  return [...new Set([...(CATALOG_BY_ROLE[profil] ?? SHARED_CATALOG)])];
}

export function detail(path: string, id: number) {
  return `${path}${id}/`;
}

export const actions = {
  validerFiche: (id: number) => api.post<FicheTechnique>(`${endpoints.fichesTechniques}${id}/valider/`),
  convertirPlanEnOf: (id: number, agents_affectes?: number[]) =>
    api.post<OrdreFabrication>(`${endpoints.plans}${id}/convertir_en_of/`, agents_affectes?.length ? { agents_affectes } : {}),
  /** Comptes Agent Production actifs, pour les sélecteurs « Agents affectés ». */
  agentsDisponibles: () => api.get<{ id: number; username: string; nom: string }[]>(`${endpoints.ofList}agents_disponibles/`),
  affecterAgentsOF: (id: number, agents: number[]) =>
    api.post<OrdreFabrication>(`${endpoints.ofList}${id}/affecter_agents/`, { agents }),
  avancerOf: (id: number) => api.post<{ statut: string; of: OrdreFabrication }>(`${endpoints.ofList}${id}/avancer_statut/`),
  annulerOf: (id: number, motif: string) => api.post<OrdreFabrication>(`${endpoints.ofList}${id}/annuler/`, { motif }),
  /** Demande d'un coup toute la composition de l'OF au magasin (une DemandeMatiere par matière). */
  demanderMatieres: (id: number) => api.post<DemandeMatiere[]>(`${endpoints.ofList}${id}/demander_matieres/`),
  elementsDisponibles: (ficheId: number, typeArticle?: string) =>
    api.get<ElementComposition[]>(
      `${endpoints.fichesTechniques}${ficheId}/elements_disponibles/${typeArticle ? `?type_article=${typeArticle}` : ""}`,
    ),
  ajouterElementsComposition: (
    ficheId: number,
    elements: { matiere: number; quantite_necessaire: number | string; prix_unitaire: number | string }[],
  ) => api.post<FicheTechnique>(`${endpoints.fichesTechniques}${ficheId}/ajouter_elements/`, { elements }),
  livrerDemandeMatiere: (id: number, quantite_livree?: string | number) =>
    api.post<DemandeMatiere>(
      `${endpoints.demandesMatieres}${id}/livrer/`,
      quantite_livree !== undefined ? { quantite_livree } : {},
    ),
  approuverComplement: (id: number) =>
    api.post<DemandeComplementaire>(`${endpoints.demandesComplementaires}${id}/approuver/`),
  rejeterComplement: (id: number) =>
    api.post<DemandeComplementaire>(`${endpoints.demandesComplementaires}${id}/rejeter/`),
  /** Reprend l'article et la quantité du besoin — rien à ressaisir. */
  creerDemandeDepuisBesoin: (id: number) => api.post<DemandeAchat>(`${endpoints.besoinsAchat}${id}/creer_demande/`),
  approuverDemande: (id: number) => api.post<DemandeAchat>(`${endpoints.demandesAchat}${id}/approuver/`),
  rejeterDemande: (id: number) => api.post<DemandeAchat>(`${endpoints.demandesAchat}${id}/rejeter/`),
  envoyerCommandeFournisseur: (id: number) => api.post<CommandeFournisseur>(`${endpoints.commandesFournisseur}${id}/envoyer/`),
  libererLot: (id: number) => api.post<Lot>(`${endpoints.lots}${id}/liberer/`),
  bloquerLot: (id: number, motif?: string) => api.post<Lot>(`${endpoints.lots}${id}/bloquer/`, motif ? { motif } : {}),
  genererLignesFacture: (id: number) => api.post<Facture>(`${endpoints.factures}${id}/generer_lignes/`),
  utiliserAvoir: (id: number, facture: number) =>
    api.post<Avoir>(`${endpoints.avoirs}${id}/utiliser/`, { facture }),
  /**
   * Circuit du décaissement : le caissier fait la demande (CREATE_DECAISSEMENT,
   * sans autorise_par) ; la Direction ou la Comptabilité/DAF autorise ou
   * refuse ; puis le caissier effectue la sortie d'argent.
   */
  decaissementsAAutoriser: () => api.get<Decaissement[]>(`${endpoints.decaissements}a_autoriser/`),
  autoriserDecaissement: (id: number) => api.post<Decaissement>(`${endpoints.decaissements}${id}/autoriser/`),
  refuserDecaissement: (id: number, motif: string) => api.post<Decaissement>(`${endpoints.decaissements}${id}/refuser/`, { motif }),
  effectuerDecaissement: (id: number) => api.post<Decaissement>(`${endpoints.decaissements}${id}/effectuer/`),
  /** Annuaire léger (id, nom, profil) de tous les comptes — ouvert à tout utilisateur authentifié. */
  annuaire: () => api.get<AnnuaireEntry[]>("/comptes/annuaire/"),
  /** Mes notifications « à faire » : générées automatiquement par le backend à chaque
   * événement métier qui me concerne (voir apps/core/notifications.py). */
  notifications: (nonLuesSeulement = false) => listAll<AppNotification>("/notifications/", nonLuesSeulement ? { lue: false } : undefined),
  notificationsNonLues: () => api.get<{ non_lues: number }>("/notifications/non_lues/"),
  marquerNotificationLue: (id: number) => api.post<AppNotification>(`/notifications/${id}/lire/`),
  marquerToutesNotificationsLues: () => api.post<{ marquees: number }>("/notifications/tout_lire/"),
  /** Valeur du stock au coût moyen pondéré (CMUP), article par article — Comptabilité/DAF, Direction, Admin SI. */
  valorisationStock: (params?: { depot?: number; type_article?: string }) => {
    const q = new URLSearchParams();
    if (params?.depot) q.set("depot", String(params.depot));
    if (params?.type_article) q.set("type_article", params.type_article);
    const suffixe = q.toString() ? `?${q}` : "";
    return api.get<ValorisationStock>(`/stocks/valorisation/${suffixe}`);
  },
  /** Historique (création, changements de statut) d'un document — endpoint = base de collection (endpoints.xxx). */
  historique: (endpoint: string, id: number) => api.get<HistoriqueLigne[]>(`${endpoint}${id}/historique/`),
  /** Les anomalies sont détectées par le système : plus de PATCH direct, seulement ces actions. */
  prendreEnChargeAnomalie: (id: number) => api.post<AnomalieDetectee>(`${endpoints.anomalies}${id}/prendre_en_charge/`),
  resoudreAnomalie: (id: number, commentaire: string) => api.post<AnomalieDetectee>(`${endpoints.anomalies}${id}/resoudre/`, { commentaire }),
  ignorerAnomalie: (id: number, commentaire: string) => api.post<AnomalieDetectee>(`${endpoints.anomalies}${id}/ignorer/`, { commentaire }),
  detecterAnomalies: () => api.post<{ detectees: number; resolues_automatiquement: number }>(`${endpoints.anomalies}detecter/`),
  /**
   * Le CSV Sage exige le jeton d'authentification (un lien <a> brut ne
   * l'enverrait pas) : on le récupère en texte, puis on déclenche le
   * téléchargement nous-mêmes.
   */
  telechargerExport: async (id: number, nomFichier: string) => {
    const csv = await api.get<string>(`${endpoints.exportsComptables}${id}/telecharger/`);
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(lien.href);
  },
  cloturerSession: (id: number, solde_compte: string, justification?: string) =>
    api.post<{ session: SessionCaisse }>(`${endpoints.sessionsCaisse}${id}/cloturer/`, {
      solde_compte,
      ...(justification ? { justification } : {}),
    }),
  confirmerPreparation: (id: number) => api.post<PreparationLivraison>(`${endpoints.preparations}${id}/confirmer_preparation/`),
  confirmerSortie: (id: number) => api.post<PreparationLivraison>(`${endpoints.preparations}${id}/confirmer_sortie/`),
  confirmerLivraison: (id: number) => api.post<BonLivraison>(`${endpoints.bonsLivraison}${id}/confirmer_livraison/`),
  /** Le chauffeur indique la remise au client ; la confirmation finale reste au Responsable Distribution. */
  livrerBL: (id: number) => api.post<BonLivraison>(`${endpoints.bonsLivraison}${id}/livre/`),
  signalerProblemeBL: (id: number, motif: string) => api.post<BonLivraison>(`${endpoints.bonsLivraison}${id}/probleme/`, { motif }),
  terminerReconditionnement: (id: number, quantite_reconditionnee: string | number, cout?: string | number) =>
    api.post<Reconditionnement>(`${endpoints.reconditionnements}${id}/terminer/`, {
      quantite_reconditionnee,
      ...(cout !== undefined ? { cout } : {}),
    }),
  recalculerCout: (id: number) => api.post<CoutReel>(`${endpoints.coutsReels}${id}/recalculer/`),
  genererRapport: (periode: "JOURNALIER" | "MENSUEL") =>
    api.post<RapportGenere>(`${endpoints.rapports}generer_aujourd_hui/`, { periode }),

  // ---------- Fiches techniques : essai et simulation ----------
  /** Brouillon -> En test : la composition est figée pendant l'essai. */
  mettreFicheEnTest: (id: number) => api.post<FicheTechnique>(`${endpoints.fichesTechniques}${id}/mettre_en_test/`),
  /** En test -> Brouillon : ajustement de la composition après essai. */
  repasserFicheEnBrouillon: (id: number) => api.post<FicheTechnique>(`${endpoints.fichesTechniques}${id}/repasser_en_brouillon/`),
  /** Besoins que générerait un OF (unité de référence, rendement, pertes, lignes propres au format). */
  simulerBesoins: (id: number, quantite: number | string, article?: number) =>
    api.get<SimulationBesoins>(
      `${endpoints.fichesTechniques}${id}/simuler_besoins/?quantite=${encodeURIComponent(String(quantite))}${article ? `&article=${article}` : ""}`,
    ),
  convertirUnites: (quantite: number | string, de: string, vers: string, article?: number) =>
    api.get<{ quantite: string; de: string; vers: string; resultat: string }>(
      `${endpoints.conversions}convertir/?quantite=${encodeURIComponent(String(quantite))}&de=${de}&vers=${vers}${article ? `&article=${article}` : ""}`,
    ),

  // ---------- OF : lancement, sortie matières, traçabilité ----------
  /** Lignes actives pouvant produire ce format (choix à la création d'un OF). */
  lignesCompatibles: (article: number) => api.get<LigneProduction[]>(`${endpoints.lignesProduction}compatibles/?article=${article}`),
  /** Circuit validé que recevrait un OF (le plus précis : format + ligne > format > activité). */
  circuitApplicable: (article: number, ligne?: number | null) =>
    api.get<Circuit | null>(`${endpoints.circuits}applicable/?article=${article}${ligne ? `&ligne=${ligne}` : ""}`),
  verifierStockOf: (id: number) => api.get<VerificationStockOF>(`${endpoints.ofList}${id}/verifier_stock/`),
  bonDeSortieOf: (id: number) => api.get<BonSortieOF>(`${endpoints.ofList}${id}/bon_de_sortie/`),
  lotsConsommesOf: (id: number) => api.get<ConsommationLotMatiere[]>(`${endpoints.ofList}${id}/lots_consommes/`),
  consommationReelleOf: (id: number) => api.get<ConsommationReelleOF>(`${endpoints.ofList}${id}/consommation_reelle/`),
  parametresProduction: () => api.get<ParametreProduction>(endpoints.parametresProduction),
  modifierParametresProduction: (champs: Partial<ParametreProduction>) =>
    api.patch<ParametreProduction>(`${endpoints.parametresProduction}modifier/`, champs),

  // ---------- Socle industriel ----------
  validerCircuit: (id: number) => api.post<Circuit>(`${endpoints.circuits}${id}/valider/`),
  nouvelleVersionCircuit: (id: number) => api.post<Circuit>(`${endpoints.circuits}${id}/nouvelle_version/`),
  ajouterEtapeCircuit: (corps: Partial<EtapeCircuit> & { circuit: number; etape: number; ordre: number }) =>
    api.post<EtapeCircuit>(endpoints.etapesCircuit, corps),
  supprimerEtapeCircuit: (id: number) => api.del(`${endpoints.etapesCircuit}${id}/`),

  // ---------- Lots matières et transferts ----------
  libererLotMatiere: (id: number) => api.post<LotMatiere>(`${endpoints.lotsMatieres}${id}/liberer/`),
  bloquerLotMatiere: (id: number) => api.post<LotMatiere>(`${endpoints.lotsMatieres}${id}/bloquer/`),
  tracabiliteLotMatiere: (id: number) => api.get<TracabiliteLotMatiere>(`${endpoints.lotsMatieres}${id}/tracabilite/`),
  tracabiliteLot: (id: number) => api.get<TracabiliteLot>(`${endpoints.lots}${id}/tracabilite/`),
  expedierTransfert: (id: number) => api.post<TransfertStock>(`${endpoints.transfertsStock}${id}/expedier/`),
  receptionnerTransfert: (id: number) => api.post<TransfertStock>(`${endpoints.transfertsStock}${id}/receptionner/`),
  annulerTransfert: (id: number) => api.post<TransfertStock>(`${endpoints.transfertsStock}${id}/annuler/`),
  ajouterLigneTransfert: (corps: { transfert: number; article: number; quantite: number; lot?: number | null }) =>
    api.post<LigneTransfert>(endpoints.lignesTransfert, corps),
  supprimerLigneTransfert: (id: number) => api.del(`${endpoints.lignesTransfert}${id}/`),

  // ---------- Contrôle qualité ----------
  activerPointControle: (id: number) => api.post<PointControle>(`${endpoints.planControle}${id}/activer/`),
  desactiverPointControle: (id: number) => api.post<PointControle>(`${endpoints.planControle}${id}/desactiver/`),
  nouvelleVersionPointControle: (id: number) => api.post<PointControle>(`${endpoints.planControle}${id}/nouvelle_version/`),
  instrumentsAEtalonner: () => api.get<Instrument[]>(`${endpoints.instruments}a_etalonner/`),
  /** Saisie du résultat : conformité calculée selon le plan ; non conforme -> NC automatique. */
  enregistrerControle: (
    id: number,
    corps: {
      valeur?: number | string;
      resultat_qualitatif?: "CONFORME" | "NON_CONFORME";
      instrument?: number | null;
      commentaire?: string;
      reference_echantillon?: string;
    },
  ) => api.post<ControleRealise>(`${endpoints.controlesRealises}${id}/enregistrer/`, corps),
  envoyerAuLaboratoire: (id: number, reference_echantillon: string) =>
    api.post<ControleRealise>(`${endpoints.controlesRealises}${id}/envoyer_au_laboratoire/`, { reference_echantillon }),
  annulerControle: (id: number, motif: string) => api.post<ControleRealise>(`${endpoints.controlesRealises}${id}/annuler/`, { motif }),
  repriseControle: (id: number) => api.post<ControleRealise>(`${endpoints.controlesRealises}${id}/reprise/`),
  prendreEnChargeNC: (id: number) => api.post<NonConformite>(`${endpoints.nonConformites}${id}/prendre_en_charge/`),
  cloturerNC: (id: number, decision: string, action_corrective: string) =>
    api.post<NonConformite>(`${endpoints.nonConformites}${id}/cloturer/`, { decision, action_corrective }),
  /** Photo ou bulletin d'analyse joint à un contrôle ou à une NC (multipart, champ « fichier »). */
  joindrePieceQualite: (cible: { resultat?: number; non_conformite?: number }, fichier: File, description = "") => {
    const form = new FormData();
    form.append("fichier", fichier);
    if (description) form.append("description", description);
    if (cible.resultat) form.append("resultat", String(cible.resultat));
    if (cible.non_conformite) form.append("non_conformite", String(cible.non_conformite));
    return apiUpload<PieceJointeQualite>(endpoints.piecesJointesQualite, form);
  },
  indicateursQualite: (params?: { du?: string; au?: string; activite?: number }) => {
    const q = new URLSearchParams();
    if (params?.du) q.set("du", params.du);
    if (params?.au) q.set("au", params.au);
    if (params?.activite) q.set("activite", String(params.activite));
    return api.get<IndicateursQualite>(`/qualite/indicateurs/${q.toString() ? `?${q}` : ""}`);
  },

  // ---------- Coûts en cascade (période AAAA-MM) ----------
  calculerCascade: (periode: string) => api.post<ResultatCalculCascade>("/couts/cascade/calculer/", { periode }),
  genererAmortissements: (periode: string) => api.post<Charge[]>("/couts/cascade/amortissements/", { periode }),
  coutRevient: (periode: string) => api.get<CoutRevientPeriode>(`/couts/cascade/cout-revient/?periode=${periode}`),
  coutEauTraitee: (periode: string) => api.get<CoutEauTraitee[]>(`/couts/cascade/eau-traitee/?periode=${periode}`),
  controleDoubleCompte: (periode: string) => api.get<ControleDoubleCompte>(`/couts/cascade/controle/?periode=${periode}`),
  cascadeCharge: (id: number) => api.get<{ charge: Charge; repartitions: RepartitionCout[] }>(`${endpoints.charges}${id}/cascade/`),

  // ---------- Documents imprimés (PDF générés par le backend) ----------
  entreprise: () => api.get<ParametreEntreprise>("/documents/entreprise/"),
  modifierEntreprise: (champs: Partial<ParametreEntreprise>) => api.patch<ParametreEntreprise>("/documents/entreprise/", champs),
  envoyerLogo: (fichier: File) => {
    const form = new FormData();
    form.append("logo", fichier);
    return apiUpload<ParametreEntreprise>("/documents/entreprise/logo/", form);
  },
  supprimerLogo: () => api.del("/documents/entreprise/logo/"),
  /** Ouvre (ou télécharge) un PDF généré par le backend. */
  pdf: (quoi: DocumentPdf, id: number | null, numero: string, telecharger = false) =>
    ouvrirPdf(cheminPdf(quoi, id), `${PREFIXE_PDF[quoi]}-${numero}`, telecharger),
};

/** Documents imprimables générés par le backend (apps/core/documents.py). */
export type DocumentPdf =
  | "facture"
  | "avoir"
  | "commandeFournisseur"
  | "recuCaisse"
  | "bonLivraison"
  | "bonTransfert"
  | "bonSortie"
  | "apercu";

const PREFIXE_PDF: Record<DocumentPdf, string> = {
  facture: "facture",
  avoir: "avoir",
  commandeFournisseur: "bon-commande",
  recuCaisse: "recu",
  bonLivraison: "bon-livraison",
  bonTransfert: "bon-transfert",
  bonSortie: "bon-sortie",
  apercu: "apercu-document",
};

function cheminPdf(quoi: DocumentPdf, id: number | null) {
  switch (quoi) {
    case "facture":
      return `${endpoints.factures}${id}/pdf/`;
    case "avoir":
      return `${endpoints.avoirs}${id}/pdf/`;
    case "commandeFournisseur":
      return `${endpoints.commandesFournisseur}${id}/pdf/`;
    case "recuCaisse":
      return `${endpoints.encaissements}${id}/pdf/`;
    case "bonLivraison":
      return `${endpoints.bonsLivraison}${id}/pdf/`;
    case "bonTransfert":
      return `${endpoints.transfertsStock}${id}/pdf/`;
    case "bonSortie":
      return `${endpoints.ofList}${id}/bon-de-sortie-pdf/`;
    case "apercu":
      return "/documents/apercu/";
  }
}

/** GET .../fiches-techniques/{id}/simuler_besoins/ */
export type SimulationBesoins = {
  article: string;
  quantite: string;
  besoins: { matiere: string; designation: string; unite: string; base_calcul: string; quantite: string; montant: string }[];
};

