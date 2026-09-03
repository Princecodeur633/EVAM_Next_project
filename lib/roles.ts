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
    station: "Administration",
    mission: "Gérez les comptes, les accès et le journal d’activité.",
    posture: "Vous configurez EVAM. L’atelier, la caisse et les ventes restent aux métiers.",
    owns: ["Utilisateurs", "Droits d’accès", "Journal d’audit", "Référentiel"],
    never: ["Saisir un OF, une commande ou un encaissement au quotidien"],
    rules: ["Un compte inactif ne peut plus se connecter.", "Chaque utilisateur a un profil métier unique."],
    flow: [],
    accent: "navy",
    icon: "shield",
    homeHint: "Vérifier les utilisateurs et le journal.",
    paramAllow: ["*"],
  },
  DIRECTION: {
    role: "DIRECTION",
    label: "PDG / Direction",
    station: "Pilotage",
    mission: "Suivez la santé de l’usine : stocks, commandes, production et coûts.",
    posture: "Consultation. Les équipes métier saisissent, vous pilotez.",
    owns: ["Tableau de bord", "Suivi des files", "Coûts"],
    never: ["Valider une clôture caisse ou un OF"],
    rules: ["Seuls les lots libérés peuvent être vendus.", "Les coûts se consultent dans le module dédié."],
    flow: ["planifier", "fabriquer", "controler", "stocker", "vendre", "encaisser", "livrer", "couter", "comptabiliser"],
    accent: "navy",
    icon: "bar",
    homeHint: "Surveiller les OF ouverts et les lots en attente.",
    paramAllow: [],
  },
  RESPONSABLE_PRODUCTION: {
    role: "RESPONSABLE_PRODUCTION",
    label: "Responsable Production",
    station: "Atelier — planification",
    mission: "Planifiez la journée, lancez les OF et validez les fiches techniques.",
    posture: "Vous orchestrez l’atelier. Le stock vendable n’existe qu’après libération qualité.",
    owns: ["Plans", "Ordres de fabrication", "Fiches techniques", "Besoins matières"],
    never: ["Libérer un lot", "Encaisser", "Accéder aux coûts"],
    rules: ["Un OF se lance seulement avec une fiche technique validée.", "Les besoins matières sont calculés au lancement."],
    flow: ["planifier", "fabriquer"],
    accent: "teal",
    icon: "factory",
    homeHint: "Créer le plan du jour puis lancer les OF.",
    paramAllow: ["/parametrage/produits", "/parametrage/matieres", "/parametrage/fiches-techniques", "/parametrage/conditionnements"],
  },
  AGENT_PRODUCTION: {
    role: "AGENT_PRODUCTION",
    label: "Agent Production",
    station: "Ligne / atelier",
    mission: "Saisissez les étapes, les quantités et les pertes sur vos OF.",
    posture: "Écran d’atelier : actions courtes. Le responsable avance le statut de l’OF.",
    owns: ["Étapes de production", "Pertes", "Consultation des OF affectés"],
    never: ["Avancer le statut d’un OF", "Modifier une fiche technique", "Créer une commande"],
    rules: ["Vous ne voyez que les OF auxquels vous êtes affecté.", "Les motifs de pertes sont une liste fixe."],
    flow: ["fabriquer"],
    accent: "amber",
    icon: "wrench",
    homeHint: "Enregistrer les étapes des OF qui vous sont affectés.",
    paramAllow: [],
  },
  RESPONSABLE_QUALITE: {
    role: "RESPONSABLE_QUALITE",
    label: "Responsable Qualité",
    station: "Laboratoire / lots",
    mission: "Contrôlez les lots. Seuls les lots libérés peuvent être vendus.",
    posture: "Contrôle conforme ou non conforme, puis libération ou blocage.",
    owns: ["Lots", "Contrôles qualité", "Libération / blocage"],
    never: ["Modifier le planning", "Vendre un lot encore en attente"],
    rules: ["Un contrôle met à jour le statut du lot.", "On ne libère un lot que s’il est conforme."],
    flow: ["controler"],
    accent: "green",
    icon: "check",
    homeHint: "Traiter les lots en attente puis libérer les conformes.",
    paramAllow: [],
    paramRead: ["/parametrage/fiches-techniques"],
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
    paramAllow: [],
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
