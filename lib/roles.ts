import type { Role } from "./types";

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
  role: Role;
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
  paramAllow: string[];
};

export const ROLE_PROFILES: Record<Role, RoleProfile> = {
  administrateur: {
    role: "administrateur",
    label: "Administrateur système",
    station: "Gouvernance",
    mission: "Ouvrir le bon périmètre à chacun : utilisateurs, profils, droits, paramètres. Vous ne saisissez pas l’opérationnel.",
    posture: "Vous configurez le système. Vous n’êtes pas un opérateur d’atelier.",
    owns: ["Utilisateurs et activation", "Matrice des droits", "Paramètres généraux", "Journal d’audit"],
    never: ["Saisir un OF, une commande ou un encaissement au quotidien"],
    rules: ["Un compte inactif ne se connecte pas.", "Les droits pilotent le menu — rien n’est seulement grisé."],
    flow: [],
    accent: "navy",
    icon: "shield",
    homeHint: "Vérifier les profils et l’audit avant le go-live.",
    paramAllow: ["*"],
  },
  direction: {
    role: "direction",
    label: "Direction",
    station: "Pilotage",
    mission: "Lire la santé de l’usine en 5 indicateurs : stock vendable, CA encaissé, OF ouverts, factures suspendues, seuils matières.",
    posture: "Consultation. Vous descendez dans un module, vous ne forcez aucune règle.",
    owns: ["Tableau de bord", "Lecture des files métier"],
    never: ["Valider une clôture, un paiement ou un export Sage"],
    rules: ["Les indicateurs vitaux suffisent en V1.", "Une facture suspendue n’est jamais du CA."],
    flow: ["planifier", "fabriquer", "controler", "stocker", "vendre", "encaisser", "livrer", "couter", "comptabiliser"],
    accent: "navy",
    icon: "bar",
    homeHint: "Surveiller les blocages : qualité en attente et factures suspendues.",
    paramAllow: [],
  },
  responsable_production: {
    role: "responsable_production",
    label: "Responsable Production",
    station: "Atelier — planification",
    mission: "Un plan = un produit, une date, une quantité. Le plan génère l’OF. Vous validez la fin de production — pas l’entrée en stock.",
    posture: "Vous orchestrez l’atelier. Le stock PF n’existe qu’après la qualité.",
    owns: ["Planning et génération d’OF", "Besoins matières", "Validation fin de production", "Fiches techniques"],
    never: ["Faire entrer un lot en stock PF", "Encaisser une commande"],
    rules: ["La production n’est pas déclenchée par la commande client.", "Fin de production ≠ lot vendable."],
    flow: ["planifier", "fabriquer", "couter"],
    accent: "teal",
    icon: "factory",
    homeHint: "Lancer le plan du jour et clôturer les OF en production.",
    paramAllow: ["/parametrage/produits", "/parametrage/fiches-techniques", "/parametrage/causes-pertes", "/parametrage/seuils"],
  },
  agent_production: {
    role: "agent_production",
    label: "Agent de production",
    station: "Ligne / atelier",
    mission: "Saisir le réel : quantités, incidents, pertes, compteurs eau. Pas de paramétrage, pas de vente.",
    posture: "Écran dense, actions courtes, une ligne à la fois.",
    owns: ["Suivi atelier", "Suivi eau", "Pertes et rebuts", "Consultation OF"],
    never: ["Modifier une fiche technique", "Créer une commande client", "Clôturer la qualité"],
    rules: ["Le réel alimente le rendement et le coût à la clôture.", "Les causes de pertes sont une liste fermée."],
    flow: ["fabriquer"],
    accent: "amber",
    icon: "wrench",
    homeHint: "Enregistrer le réel des OF en cours avant la fin de poste.",
    paramAllow: [],
  },
  controleur_qualite: {
    role: "controleur_qualite",
    label: "Contrôleur Qualité",
    station: "Laboratoire / lots",
    mission: "Vous êtes le verrou du stock vendable. Sans votre clôture, le lot n’existe pas à la vente.",
    posture: "Décision binaire : conforme → stock PF. Non conforme → blocage, pas d’entrée.",
    owns: ["File des lots", "Contrôle selon la fiche technique", "Clôture ou blocage", "Réclamations qualité"],
    never: ["Modifier le planning", "Vendre un lot en attente"],
    rules: ["Double validation : fin de production puis vous.", "Un lot bloqué part en quarantaine, jamais en PF."],
    flow: ["controler"],
    accent: "green",
    icon: "check",
    homeHint: "Le yaourt OF-2026-00042 attend votre clôture.",
    paramAllow: ["/parametrage/fiches-techniques", "/parametrage/causes-pertes"],
  },
  magasinier: {
    role: "magasinier",
    label: "Magasinier",
    station: "Magasin",
    mission: "Servir les demandes matières, tracer chaque mouvement, compter l’inventaire. Le CMUP se lit, il ne se saisit pas.",
    posture: "Vous exécutez des mouvements dont l’origine est toujours un document amont.",
    owns: ["Demandes matières atelier", "Entrées / sorties / transferts", "Inventaires", "Alertes de seuil"],
    never: ["Modifier un prix de vente", "Encaisser"],
    rules: ["Deux origines d’entrée : clôture OF (PF) ou réception fournisseur (matières).", "Disponible = physique − réservé."],
    flow: ["stocker"],
    accent: "amber",
    icon: "boxes",
    homeHint: "Servir la demande matières de l’OF jus planifié.",
    paramAllow: [],
  },
  responsable_achats: {
    role: "responsable_achats",
    label: "Responsable Achats",
    station: "Approvisionnement",
    mission: "Transformer un seuil ou un besoin OF en DA, puis commande, puis réception. L’écart commandé/reçu entre en stock réel.",
    posture: "Vous achetez pour l’usine, pas pour un tableur parallèle.",
    owns: ["Besoins auto", "Demandes d’achat", "Commandes fournisseurs", "Réceptions", "Fournisseurs"],
    never: ["Lancer un OF", "Modifier une fiche client"],
    rules: ["La réception mesure l’écart. Le stock matières suit le reçu, pas le commandé."],
    flow: ["stocker"],
    accent: "teal",
    icon: "cart",
    homeHint: "Valider la DA lait et traiter l’écart de réception concentré.",
    paramAllow: ["/parametrage/matieres", "/parametrage/conditionnements", "/parametrage/fournisseurs", "/parametrage/seuils"],
  },
  commercial: {
    role: "commercial",
    label: "Commercial",
    station: "Vente",
    mission: "Prendre commande seulement si le stock disponible (hors réservé) couvre les lignes. Sinon le système refuse — vous n’avez pas de dérogation.",
    posture: "Vous ne forcez pas le stock. Le refus explique et oriente vers le planning.",
    owns: ["Commandes", "Fiches clients (lecture / création selon droit)", "Suivi préparation / BL"],
    never: ["Encaisser à la place de la caisse", "Livrer", "Forcer un stock insuffisant"],
    rules: ["Aucune commande validée sans StockGuard.", "La facture à payer naît à la validation."],
    flow: ["vendre"],
    accent: "navy",
    icon: "handshake",
    homeHint: "Créer une commande Atlas — tester d’abord une quantité trop haute.",
    paramAllow: ["/parametrage/clients", "/parametrage/tarifs"],
  },
  caissier: {
    role: "caissier",
    label: "Caissier",
    station: "Caisse",
    mission: "Encaisser selon le type client. Un succès déverrouille la livraison. Un échec suspend la facture, libère le stock, interdit Sage.",
    posture: "Paiement et préparation sont parallèles. Vous tenez le verrou livraison.",
    owns: ["File à encaisser", "Succès / échec + motif", "Factures suspendues", "Clôture de caisse"],
    never: ["Modifier une commande livrée", "Exporter vers Sage", "Valider un BL"],
    rules: ["Les moyens d’encaissement suivent le type client.", "Suspendue = jamais exportable."],
    flow: ["encaisser"],
    accent: "green",
    icon: "banknote",
    homeHint: "Encaisser FA-2026-01102, puis rejouer un échec pour voir la suspension.",
    paramAllow: [],
  },
  preparateur: {
    role: "preparateur",
    label: "Préparateur",
    station: "Quai / préparation",
    mission: "Préparer les commandes validées, complète ou partielle. Vous n’attendez pas le paiement — mais vous ne livrez pas.",
    posture: "Avancer le physique. Le BL reste l’affaire de la logistique + caisse.",
    owns: ["File à préparer", "Préparation complète / partielle"],
    never: ["Encaisser", "Valider un BL impayé", "Modifier le stock réservé"],
    rules: ["On prépare les commandes validées, y compris en attente de paiement.", "Partielle reste visible dans la file."],
    flow: ["livrer"],
    accent: "amber",
    icon: "package",
    homeHint: "Préparer CD-2026-01103 (déjà payée) et CD-2026-01102 (pas encore).",
    paramAllow: [],
  },
  logistique: {
    role: "logistique",
    label: "Logistique / Livreur",
    station: "Tournée",
    mission: "Éditer et valider le BL seulement si la facture est payée. Puis signature et preuve. Un BL impayé n’entre pas en tournée.",
    posture: "Écran simple, tablette. Le cadenas paiement est non négociable.",
    owns: ["Bons de livraison", "Tournées", "Preuve / signature", "Réclamations transport"],
    never: ["Débloquer une facture", "Livrer un impayé"],
    rules: ["PaymentGuard sur le BL.", "Livré = stock réservé consommé."],
    flow: ["livrer"],
    accent: "teal",
    icon: "truck",
    homeHint: "Tenter le BL de la commande à payer — il doit rester verrouillé.",
    paramAllow: [],
  },
  comptabilite: {
    role: "comptabilite",
    label: "Comptabilité",
    station: "Finance",
    mission: "Contrôler les brouillards nés des ventes et achats, puis exporter Sage 100. Vous ne saisissez pas d’écriture.",
    posture: "Validation humaine, export manuel en V1. Les suspendues n’apparaissent pas.",
    owns: ["Brouillards", "Export Sage 100", "Mapping comptable", "Lecture des coûts"],
    never: ["Saisir un mouvement de stock", "Réactiver une facture suspendue pour l’export"],
    rules: ["Le brouillard est généré, jamais recopié.", "Export = pièces validées uniquement, hors suspendues."],
    flow: ["couter", "comptabiliser"],
    accent: "slate",
    icon: "ledger",
    homeHint: "Valider FA-2026-01103 puis exporter. Vérifier que FA-2026-01104 est exclue.",
    paramAllow: ["/parametrage/sage", "/parametrage/general", "/parametrage/motifs-suspension"],
  },
};

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
  Object.values(ROLE_PROFILES).map((p) => [p.role, p.label]),
) as Record<Role, string>;

export function canEditParam(role: Role | null, href: string) {
  if (!role) return false;
  const allow = ROLE_PROFILES[role].paramAllow;
  if (allow.includes("*")) return true;
  return allow.some((p) => href === p || href.startsWith(p + "/"));
}
