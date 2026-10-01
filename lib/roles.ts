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
    station: "Magasin",
    mission: "Sorties matières, mouvements, inventaires, réceptions et préparations.",
    posture: "Chaque mouvement a une origine. Disponible = physique − bloquée − réservée.",
    owns: ["Stock", "Mouvements", "Inventaires", "Sorties matières", "Réceptions", "Préparations"],
    never: ["Modifier un prix de vente", "Encaisser"],
    rules: ["Un mouvement met à jour le stock immédiatement.", "Confirmez la préparation puis la sortie magasin."],
    flow: ["stocker", "livrer"],
    accent: "amber",
    icon: "boxes",
    homeHint: "Servir les sorties matières et confirmer les préparations.",
    paramAllow: ["/parametrage/depots"],
    paramRead: ["/parametrage/fiches-techniques"],
  },
  RESPONSABLE_ACHATS: {
    role: "RESPONSABLE_ACHATS",
    label: "Responsable Achat",
    station: "Approvisionnement",
    mission: "Fournisseurs, demandes, commandes et réceptions.",
    posture: "Le stock matières suit le reçu, pas le commandé.",
    owns: ["Fournisseurs", "Demandes d’achat", "Commandes fournisseurs", "Réceptions"],
    never: ["Lancer un OF", "Modifier une fiche client"],
    rules: ["Approuver ou rejeter une demande est réservé à ce poste.", "Envoyer une commande la transmet au fournisseur."],
    flow: ["stocker"],
    accent: "teal",
    icon: "cart",
    homeHint: "Traiter les demandes en attente puis envoyer les commandes.",
    paramAllow: ["/parametrage/produits", "/parametrage/matieres", "/parametrage/fournisseurs"],
  },
  COMMERCIAL: {
    role: "COMMERCIAL",
    label: "Commercial",
    station: "Vente",
    mission: "Clients, tarifs, commandes et factures. Consultez le stock, ne le modifiez pas.",
    posture: "Vous ne forcez pas le stock. Les lots non libérés ne sont pas vendables.",
    owns: ["Clients", "Commandes", "Lignes", "Factures", "Tarifs"],
    never: ["Encaisser", "Modifier le stock", "Livrer"],
    rules: ["Un client bloqué ne peut plus commander.", "La commande passe de brouillon à facturée selon le circuit."],
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
    mission: "Ouvrez une session, encaissez les factures, clôturez. Justifiez un écart, ne le supprimez jamais.",
    posture: "Le caissier ne modifie ni commande, ni prix, ni stock.",
    owns: ["Sessions de caisse", "Encaissements", "Écarts (justification)"],
    never: ["Supprimer un écart", "Valider un BL", "Exporter la comptabilité"],
    rules: ["La clôture compare le solde théorique et le solde compté.", "Un écart doit être justifié."],
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
    mission: "Véhicules, chauffeurs, tournées, préparations et livraisons.",
    posture: "Circuit : commande → préparation → sortie magasin → bon de livraison → signature client.",
    owns: ["Tournées", "Véhicules", "Chauffeurs", "Préparations", "Bons de livraison"],
    never: ["Encaisser", "Modifier le stock hors transfert"],
    rules: ["Confirmer une livraison enregistre la signature du client."],
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
    mission: "Consultez uniquement vos tournées et bons de livraison.",
    posture: "Vous voyez uniquement votre tournée du jour.",
    owns: ["Mes tournées", "Mes BL"],
    never: ["Créer une tournée", "Confirmer une livraison (réservé au responsable)"],
    rules: ["Seules vos tournées apparaissent dans le menu."],
    flow: ["livrer"],
    accent: "amber",
    icon: "package",
    homeHint: "Voir les bons de livraison de votre tournée du jour.",
    paramAllow: [],
  },
  COMPTABILITE_DAF: {
    role: "COMPTABILITE_DAF",
    label: "Comptabilité / DAF",
    station: "Finance",
    mission: "Coûts, anomalies, exports comptables et clôtures.",
    posture: "Pas de saisie d’écriture libre : vous contrôlez et exportez.",
    owns: ["Coûts", "Anomalies", "Exports", "Clôtures", "Journal"],
    never: ["Saisir un mouvement de stock", "Lancer un OF"],
    rules: ["Recalculez un coût réel avant d’exporter.", "Exports : ventes, encaissements, achats, journal."],
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
