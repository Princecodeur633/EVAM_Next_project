import type { Profil } from "./types";

export const FLOW_STEPS = [
  { id: "planifier", label: "Planifier" },
  { id: "fabriquer", label: "Fabriquer" },
  { id: "controler", label: "Contrôler" },
  { id: "stocker", label: "Stocker" },
  { id: "vendre", label: "Vendre" },
  { id: "encaisser", label: "Encaisser" },
  { id: "livrer", label: "Livrer" },
  { id: "couter", label: "Coûter" },
  { id: "comptabiliser", label: "Comptabiliser" },
] as const;

export type FlowId = (typeof FLOW_STEPS)[number]["id"];

export type RoleProfile = {
  role: Profil;
  label: string;
  station: string;
  mission: string;
  posture: string;
  owns: string[];
  never: string[];
  rules: string[];
  flow: FlowId[];
  accent: "navy" | "teal" | "amber" | "green" | "red" | "slate";
  icon: "shield" | "bar" | "factory" | "wrench" | "check" | "boxes" | "cart" | "handshake" | "banknote" | "package" | "truck" | "ledger";
  homeHint: string;
  /** Chemins référentiel en écriture (création / modification). */
  paramAllow: string[];
  /** Chemins référentiel en lecture seule (optionnel). */
  paramRead?: string[];
};

export const ROLE_PROFILES: Record<Profil, RoleProfile> = {
  ADMIN_SI: {
    role: "ADMIN_SI",
    label: "Administrateur SI",
    station: "Configuration",
    mission: "Créez les comptes et les caisses, validez les fiches techniques et tenez le référentiel à jour.",
    posture: "Vous configurez EVAM. L’atelier, la caisse et les ventes restent aux métiers.",
    owns: ["Comptes", "Caisses", "Fiches techniques", "Référentiel"],
    never: [
      "Modifier les dépôts système",
      "Voir les commandes, factures, encaissements ou tarifs",
    ],
    rules: [
      "Un compte inactif ne peut plus se connecter.",
      "Chaque utilisateur a un profil métier unique.",
      "Vous créez, modifiez et désactivez les comptes ; vous validez les fiches techniques.",
    ],
    flow: [],
    accent: "navy",
    icon: "shield",
    homeHint: "Vérifier les utilisateurs et le journal.",
    // Tout le référentiel sauf les tarifs (⛔ Admin SI).
    paramAllow: [
      "/parametrage/produits",
      "/parametrage/matieres",
      "/parametrage/conditionnements",
      "/parametrage/fiches-techniques",
      "/parametrage/depots",
      "/parametrage/clients",
      "/parametrage/fournisseurs",
      "/parametrage/fiscalite",
      "/parametrage/causes-pertes",
      "/parametrage/motifs-suspension",
      "/parametrage/motifs-reclamation",
      "/parametrage/numerotation",
      "/parametrage/general",
      "/parametrage/seuils",
      "/parametrage/sage",
    ],
  },
  DIRECTION: {
    role: "DIRECTION",
    label: "PDG / Direction",
    station: "Pilotage",
    mission: "Autorisez les décaissements, surveillez les alertes et lisez les marges et le rendement.",
    posture: "Tout en lecture : les équipes métier saisissent, vous pilotez.",
    owns: ["Autoriser / refuser les décaissements", "Générer le rapport", "Supervision en lecture"],
    never: ["Valider un OF ou une clôture", "Créer quoi que ce soit", "Accéder au référentiel"],
    rules: [
      "1. Autoriser ou refuser les décaissements en attente.",
      "2. Surveiller les alertes : ruptures, écarts de caisse, anomalies.",
      "3. Lire les marges et le rendement.",
    ],
    flow: ["planifier", "fabriquer", "controler", "stocker", "vendre", "encaisser", "livrer", "couter", "comptabiliser"],
    accent: "navy",
    icon: "bar",
    homeHint: "Autoriser les décaissements puis surveiller les alertes.",
    paramAllow: [],
  },
  RESPONSABLE_PRODUCTION: {
    role: "RESPONSABLE_PRODUCTION",
    label: "Responsable Production",
    station: "Planifier et piloter",
    mission: "Planifiez, lancez les OF, demandez les matières et menez chaque OF jusqu’à la clôture.",
    posture: "Vous orchestrez l’atelier. Le stock vendable n’existe qu’après libération qualité.",
    owns: ["Plans", "Ordres de fabrication", "Demandes de matières", "Compléments"],
    never: ["Libérer un lot", "Encaisser", "Accéder aux coûts", "Modifier une fiche technique"],
    rules: [
      "1. Créer le plan.",
      "2. Le convertir en OF, avec ses agents.",
      "3. Demander les matières au magasin.",
      "4. Avancer le statut quand les matières sont livrées.",
      "5. Clôturer.",
    ],
    flow: ["planifier", "fabriquer"],
    accent: "teal",
    icon: "factory",
    homeHint: "Créer le plan du jour puis lancer les OF.",
    // Les fiches techniques (composition) sont désormais réservées à
    // l'Admin SI : le Responsable Production les consulte seulement.
    paramAllow: ["/parametrage/produits", "/parametrage/matieres", "/parametrage/conditionnements"],
    paramRead: ["/parametrage/fiches-techniques"],
  },
  AGENT_PRODUCTION: {
    role: "AGENT_PRODUCTION",
    label: "Agent Production",
    station: "Saisie atelier",
    mission: "Choisissez l’OF en production, saisissez la quantité produite par étape et déclarez les pertes.",
    posture: "Écran mobile : actions courtes. Le responsable avance le statut de l’OF.",
    owns: ["Étapes", "Pertes", "Suivi eau", "Sessions de production"],
    never: ["Avancer un OF", "Modifier une fiche technique", "Créer une commande"],
    rules: [
      "1. Choisir l’OF en production.",
      "2. Saisir la quantité produite par étape.",
      "3. Déclarer les pertes.",
    ],
    flow: ["fabriquer"],
    accent: "amber",
    icon: "wrench",
    homeHint: "Enregistrer les étapes des OF qui vous sont affectés.",
    paramAllow: [],
  },
  RESPONSABLE_QUALITE: {
    role: "RESPONSABLE_QUALITE",
    label: "Responsable Qualité",
    station: "Contrôle et libération",
    mission: "Transformez chaque OF terminé en lot, contrôlez-le, puis libérez-le ou bloquez-le. Seuls les lots libérés se vendent.",
    posture: "Contrôle conforme ou non conforme, puis libération ou blocage.",
    owns: ["Lots", "Contrôles qualité", "Libération / blocage", "Contrôle des retours"],
    never: ["Modifier le planning", "Vendre un lot encore en attente"],
    rules: [
      "1. Transformer chaque OF terminé en lot.",
      "2. Contrôler : conforme ou non conforme.",
      "3. Libérer ou bloquer.",
      "4. Traiter les retours clients.",
    ],
    flow: ["controler"],
    accent: "green",
    icon: "check",
    homeHint: "Créer les lots des OF reçus, puis contrôler et libérer.",
    paramAllow: [],
    paramRead: ["/parametrage/fiches-techniques", "/parametrage/produits"],
  },
  MAGASINIER: {
    role: "MAGASINIER",
    label: "Magasinier",
    station: "Magasin et quai",
    mission: "Livrez les matières à l’atelier, sortez les commandes préparées, réceptionnez les fournisseurs et tenez les inventaires.",
    posture: "Chaque mouvement a une origine. Disponible = physique − bloquée − réservée.",
    owns: ["Livraisons matières", "Sorties magasin", "Réceptions", "Inventaires", "Dépôts"],
    never: ["Modifier un prix", "Encaisser"],
    rules: [
      "1. Livrer les matières à l’atelier (livraison partielle possible).",
      "2. Confirmer la préparation, puis la sortie magasin.",
      "3. Réceptionner les livraisons fournisseurs.",
      "4. Tenir les inventaires.",
    ],
    flow: ["stocker", "livrer"],
    accent: "amber",
    icon: "boxes",
    homeHint: "Servir l’atelier, sortir les préparations, réceptionner.",
    paramAllow: ["/parametrage/depots"],
    paramRead: ["/parametrage/fiches-techniques"],
  },
  RESPONSABLE_ACHATS: {
    role: "RESPONSABLE_ACHATS",
    label: "Responsable Achat",
    station: "Approvisionnement",
    mission: "Couvrez les besoins, traitez les demandes d’achat, envoyez les commandes et suivez les réceptions.",
    posture: "Le stock matières suit le reçu, pas le commandé.",
    owns: ["Fournisseurs", "Demandes d’achat (approuver / rejeter)", "Commandes fournisseurs", "Réceptions"],
    never: ["Lancer un OF", "Modifier une fiche client"],
    rules: [
      "1. Couvrir les besoins sous seuil.",
      "2. Approuver ou rejeter les demandes d’achat.",
      "3. Créer et envoyer les commandes.",
      "4. Suivre les réceptions.",
    ],
    flow: ["stocker"],
    accent: "teal",
    icon: "cart",
    homeHint: "Couvrir les besoins, traiter les demandes, envoyer les commandes.",
    paramAllow: ["/parametrage/produits", "/parametrage/matieres", "/parametrage/fournisseurs"],
  },
  COMMERCIAL: {
    role: "COMMERCIAL",
    label: "Commercial",
    station: "Vente",
    mission: "Créez les commandes, validez-les, facturez, puis suivez les impayés et les clients bloqués.",
    posture: "Vous ne forcez pas le stock. Les lots non libérés ne sont pas vendables.",
    owns: ["Clients", "Tarifs", "Commandes", "Factures", "Avoirs", "Réclamations"],
    never: ["Encaisser", "Modifier le stock", "Livrer"],
    rules: [
      "1. Créer la commande.",
      "2. Ajouter les lignes.",
      "3. Valider.",
      "4. Facturer.",
      "5. Suivre les impayés et les clients bloqués.",
    ],
    flow: ["vendre"],
    accent: "navy",
    icon: "handshake",
    homeHint: "Créer une commande client puis ses lignes.",
    paramAllow: ["/parametrage/clients", "/parametrage/tarifs"],
    paramRead: ["/parametrage/produits"],
  },
  CAISSIER: {
    role: "CAISSIER",
    label: "Caissier",
    station: "Caisse",
    mission: "Ouvrez votre session, encaissez les factures, demandez un décaissement si besoin, puis clôturez en justifiant l’écart.",
    posture: "Le caissier ne modifie ni commande, ni prix, ni stock.",
    owns: ["Encaissements", "Demandes de décaissement", "Clôture de session"],
    never: ["Supprimer un écart", "Valider un BL", "Exporter la comptabilité"],
    rules: [
      "1. Ouvrir la session.",
      "2. Encaisser les factures.",
      "3. Demander un décaissement si besoin.",
      "4. Clôturer et justifier l’écart.",
    ],
    flow: ["encaisser"],
    accent: "green",
    icon: "banknote",
    homeHint: "Encaisser les factures émises sur la session ouverte.",
    paramAllow: [],
  },
  RESPONSABLE_DISTRIBUTION: {
    role: "RESPONSABLE_DISTRIBUTION",
    label: "Responsable Distribution",
    station: "Logistique",
    mission: "Lancez la préparation des commandes validées, créez les BL, affectez-les aux tournées et confirmez les livraisons.",
    posture: "Circuit : commande → préparation → sortie magasin → bon de livraison → livraison confirmée.",
    owns: ["Préparations", "Bons de livraison", "Tournées", "Véhicules", "Chauffeurs"],
    never: ["Encaisser", "Modifier le stock hors transfert"],
    rules: [
      "1. Lancer la préparation des commandes validées.",
      "2. Créer le BL et l’affecter à une tournée.",
      "3. Confirmer la livraison une fois le paiement soldé.",
    ],
    flow: ["livrer"],
    accent: "teal",
    icon: "truck",
    homeHint: "Lancer les préparations et confirmer les livraisons.",
    paramAllow: [],
  },
  CHAUFFEUR: {
    role: "CHAUFFEUR",
    label: "Chauffeur / Livreur",
    station: "Tournée",
    mission: "Suivez l’ordre de passage, faites signer chaque client et signalez tout incident.",
    posture: "Vous voyez uniquement votre tournée du jour. La confirmation finale revient au responsable.",
    owns: ["Remise au client (signature)", "Signalement d’incident"],
    never: ["Créer une tournée", "Confirmer une livraison (réservé au responsable)"],
    rules: [
      "1. Suivre l’ordre de passage.",
      "2. Marquer remis avec la signature du client.",
      "3. Signaler tout incident.",
    ],
    flow: ["livrer"],
    accent: "amber",
    icon: "package",
    homeHint: "Livrer les BL de la tournée du jour dans l’ordre.",
    paramAllow: [],
  },
  COMPTABILITE_DAF: {
    role: "COMPTABILITE_DAF",
    label: "Comptabilité / DAF",
    station: "Finance",
    mission: "Fixez la fiscalité, traitez anomalies et écarts, recalculez les coûts, exportez puis clôturez la période.",
    posture: "Pas de saisie d’écriture libre : vous contrôlez, exportez et clôturez.",
    owns: ["Fiscalité", "Anomalies", "Exports", "Clôtures", "Coûts", "Autorisation des décaissements"],
    never: ["Saisir un mouvement de stock", "Lancer un OF", "Saisir une écriture"],
    rules: [
      "0. Fixer la fiscalité (codes fiscaux des articles).",
      "1. Traiter les anomalies et les écarts de caisse.",
      "2. Recalculer les coûts.",
      "3. Exporter.",
      "4. Clôturer la période.",
      "5. Autoriser les décaissements.",
    ],
    flow: ["couter", "comptabiliser"],
    accent: "slate",
    icon: "ledger",
    homeHint: "Contrôler les anomalies puis générer un export.",
    paramAllow: ["/parametrage/fiscalite"],
  },
};

export const ROLE_LABEL: Record<Profil, string> = Object.fromEntries(
  Object.values(ROLE_PROFILES).map((p) => [p.role, p.label]),
) as Record<Profil, string>;

export function canEditParam(role: Profil | null, href: string) {
  if (!role) return false;
  const allow = ROLE_PROFILES[role].paramAllow;
  if (allow.includes("*")) return true;
  return allow.some((p) => href === p || href.startsWith(p + "/"));
}

export function canReadParam(role: Profil | null, href: string) {
  if (!role) return false;
  if (canEditParam(role, href)) return true;
  const read = ROLE_PROFILES[role].paramRead ?? [];
  if (read.includes("*")) return true;
  return read.some((p) => href === p || href.startsWith(p + "/"));
}
