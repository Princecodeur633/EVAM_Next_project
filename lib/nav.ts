import type { Role } from "./types";
import { ROLE_PROFILES } from "./roles";

export const ROLE_HOME: Record<Role, string> = {
  administrateur: "/accueil",
  direction: "/accueil",
  responsable_production: "/accueil",
  agent_production: "/accueil",
  controleur_qualite: "/accueil",
  magasinier: "/accueil",
  responsable_achats: "/accueil",
  commercial: "/accueil",
  caissier: "/accueil",
  preparateur: "/accueil",
  logistique: "/accueil",
  comptabilite: "/accueil",
};

export type NavItem = {
  href: string;
  label: string;
  hint?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
  roles: Role[];
};

export const NAV: NavGroup[] = [
  {
    id: "accueil",
    label: "Poste",
    icon: "home",
    roles: [
      "administrateur",
      "direction",
      "responsable_production",
      "agent_production",
      "controleur_qualite",
      "magasinier",
      "responsable_achats",
      "commercial",
      "caissier",
      "preparateur",
      "logistique",
      "comptabilite",
    ],
    items: [{ href: "/accueil", label: "Mon poste", hint: "Mission, file du jour, règles" }],
  },
  {
    id: "pilotage",
    label: "Pilotage",
    icon: "bar",
    roles: ["administrateur", "direction"],
    items: [{ href: "/dashboard", label: "Tableau de bord", hint: "5 indicateurs vitaux" }],
  },
  {
    id: "production",
    label: "Production",
    icon: "factory",
    roles: ["administrateur", "direction", "responsable_production", "agent_production", "controleur_qualite", "magasinier"],
    items: [
      { href: "/production/planning", label: "Planning", hint: "Plan → OF automatique" },
      { href: "/production/of", label: "Ordres de fabrication", hint: "Cycle de vie OF" },
      { href: "/production/suivi", label: "Suivi atelier", hint: "Saisie du réel" },
      { href: "/production/suivi-eau", label: "Suivi eau", hint: "Compteurs & volumes" },
      { href: "/production/pertes", label: "Pertes & rebuts", hint: "Causes paramétrées" },
      { href: "/production/qualite", label: "Contrôle qualité", hint: "Clôture = stock PF" },
      { href: "/production/besoins", label: "Besoins matières", hint: "Depuis la fiche technique" },
      { href: "/production/demandes-matieres", label: "Demandes matières", hint: "Workflow magasin" },
    ],
  },
  {
    id: "stocks",
    label: "Stocks",
    icon: "boxes",
    roles: ["administrateur", "direction", "magasinier", "responsable_production", "responsable_achats"],
    items: [
      { href: "/stocks", label: "Situation", hint: "Disponible vs réservé" },
      { href: "/stocks/mouvements", label: "Mouvements", hint: "Chaque origine tracée" },
      { href: "/stocks/inventaires", label: "Inventaires", hint: "Théorique vs physique" },
      { href: "/stocks/alertes", label: "Alertes", hint: "Seuils → achat" },
    ],
  },
  {
    id: "appro",
    label: "Approvisionnement",
    icon: "cart",
    roles: ["administrateur", "direction", "responsable_achats", "magasinier"],
    items: [
      { href: "/approvisionnement/besoins", label: "Besoins", hint: "Calcul automatique" },
      { href: "/approvisionnement/demandes", label: "Demandes d'achat", hint: "Workflow de validation" },
      { href: "/approvisionnement/commandes", label: "Commandes fournisseurs", hint: "Depuis DA validée" },
      { href: "/approvisionnement/receptions", label: "Réceptions", hint: "Écart commandé / reçu" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: "handshake",
    roles: ["administrateur", "direction", "commercial"],
    items: [
      { href: "/commercial/commandes", label: "Commandes", hint: "Garde stock obligatoire" },
      { href: "/commercial/commandes/nouvelle", label: "Nouvelle commande", hint: "StockGuard" },
      { href: "/commercial/clients", label: "Clients", hint: "Type → encaissement" },
    ],
  },
  {
    id: "caisse",
    label: "Caisse",
    icon: "banknote",
    roles: ["administrateur", "direction", "caissier"],
    items: [
      { href: "/caisse", label: "Encaissements", hint: "Succès = BL déverrouillé" },
      { href: "/caisse/suspendues", label: "Factures suspendues", hint: "Jamais Sage" },
      { href: "/caisse/cloture", label: "Clôture", hint: "Théorique vs réel" },
    ],
  },
  {
    id: "distribution",
    label: "Distribution",
    icon: "truck",
    roles: ["administrateur", "direction", "preparateur", "logistique", "commercial"],
    items: [
      { href: "/distribution/preparations", label: "Préparations", hint: "Même avant paiement" },
      { href: "/distribution/bl", label: "Bons de livraison", hint: "Verrou paiement" },
      { href: "/distribution/tournees", label: "Tournées", hint: "Signature & preuve" },
    ],
  },
  {
    id: "reclamations",
    label: "Après-vente",
    icon: "alert",
    roles: ["administrateur", "direction", "logistique", "commercial", "controleur_qualite"],
    items: [{ href: "/reclamations", label: "Réclamations", hint: "Lot / commande / BL" }],
  },
  {
    id: "couts",
    label: "Coûts",
    icon: "coins",
    roles: ["administrateur", "direction", "responsable_production", "comptabilite"],
    items: [
      { href: "/couts", label: "Coût des OF", hint: "CMUP × réel" },
      { href: "/couts/marges", label: "Marges", hint: "Prix vs revient" },
    ],
  },
  {
    id: "compta",
    label: "Comptabilité",
    icon: "ledger",
    roles: ["administrateur", "direction", "comptabilite"],
    items: [
      { href: "/comptabilite/brouillards", label: "Brouillards", hint: "Générés, jamais saisis" },
      { href: "/comptabilite/export-sage", label: "Export Sage 100", hint: "Hors suspendues" },
    ],
  },
  {
    id: "param",
    label: "Référentiel",
    icon: "sliders",
    roles: ["administrateur", "responsable_production", "responsable_achats", "commercial", "comptabilite", "controleur_qualite"],
    items: [{ href: "/parametrage", label: "Paramétrage", hint: "Saisi une fois" }],
  },
  {
    id: "admin",
    label: "Administration",
    icon: "shield",
    roles: ["administrateur"],
    items: [
      { href: "/admin/utilisateurs", label: "Utilisateurs" },
      { href: "/admin/profils", label: "Profils" },
      { href: "/admin/droits", label: "Matrice des droits" },
      { href: "/admin/audit", label: "Journal d'audit" },
    ],
  },
];

export function navForRole(role: Role) {
  return NAV.filter((g) => g.roles.includes(role))
    .map((g) => {
      if (role === "magasinier" && g.id === "production") {
        return { ...g, items: g.items.filter((i) => i.href === "/production/demandes-matieres") };
      }
      if (role === "agent_production" && g.id === "production") {
        return {
          ...g,
          items: g.items.filter((i) =>
            ["/production/suivi", "/production/suivi-eau", "/production/pertes", "/production/of"].includes(i.href),
          ),
        };
      }
      if (role === "controleur_qualite" && g.id === "production") {
        return { ...g, items: g.items.filter((i) => ["/production/qualite", "/production/of"].includes(i.href)) };
      }
      if (role === "preparateur" && g.id === "distribution") {
        return { ...g, items: g.items.filter((i) => i.href.startsWith("/distribution/preparations")) };
      }
      if (role === "logistique" && g.id === "distribution") {
        return { ...g, items: g.items.filter((i) => i.href !== "/distribution/preparations") };
      }
      if (role === "commercial" && g.id === "distribution") {
        return { ...g, items: g.items.filter((i) => i.href === "/distribution/bl") };
      }
      return g;
    })
    .filter((g) => g.items.length > 0);
}

export function flattenNav(role: Role) {
  return navForRole(role).flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
}

export function canAccess(role: Role, href: string) {
  if (["/403", "/login", "/", "/accueil"].includes(href)) return true;
  if (role === "administrateur") return true;
  if (href === "/dashboard" && role === "direction") return true;

  const items = flattenNav(role);
  if (items.some((i) => href === i.href || href.startsWith(i.href + "/"))) return true;

  if (href.startsWith("/parametrage")) {
    const allow = ROLE_PROFILES[role].paramAllow;
    if (allow.includes("*")) return true;
    if (href === "/parametrage" && allow.length) return true;
    return allow.some((p) => href === p || href.startsWith(p + "/"));
  }

  return false;
}

export function breadcrumbs(pathname: string) {
  const map: Record<string, string> = {
    accueil: "Mon poste",
    dashboard: "Tableau de bord",
    production: "Production",
    planning: "Planning",
    of: "Ordres de fabrication",
    suivi: "Suivi atelier",
    "suivi-eau": "Suivi eau",
    pertes: "Pertes",
    qualite: "Qualité",
    besoins: "Besoins",
    "demandes-matieres": "Demandes matières",
    stocks: "Stocks",
    article: "Article",
    mouvements: "Mouvements",
    inventaires: "Inventaires",
    alertes: "Alertes",
    approvisionnement: "Approvisionnement",
    demandes: "Demandes d'achat",
    commandes: "Commandes",
    receptions: "Réceptions",
    commercial: "Commercial",
    nouvelle: "Nouvelle",
    clients: "Clients",
    "caisse": "Caisse",
    "encaissement": "Encaissement",
    suspendues: "Suspendues",
    cloture: "Clôture",
    distribution: "Distribution",
    preparations: "Préparations",
    bl: "Bons de livraison",
    tournees: "Tournées",
    reclamations: "Réclamations",
    couts: "Coûts",
    marges: "Marges",
    comptabilite: "Comptabilité",
    brouillards: "Brouillards",
    "export-sage": "Export Sage 100",
    parametrage: "Paramétrage",
    produits: "Produits",
    matieres: "Matières",
    conditionnements: "Conditionnements",
    "fiches-techniques": "Fiches techniques",
    depots: "Dépôts",
    unites: "Unités",
    seuils: "Seuils",
    tarifs: "Tarifs",
    fournisseurs: "Fournisseurs",
    "causes-pertes": "Causes de pertes",
    "motifs-suspension": "Motifs suspension",
    "motifs-reclamation": "Motifs réclamation",
    sage: "Sage 100",
    numerotation: "Numérotation",
    general: "Général",
    admin: "Administration",
    utilisateurs: "Utilisateurs",
    profils: "Profils",
    droits: "Droits",
    audit: "Audit",
  };
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [{ href: "/accueil", label: "Poste" }];
  let acc = "";
  parts.forEach((p) => {
    acc += `/${p}`;
    crumbs.push({ href: acc, label: map[p] ?? p });
  });
  return crumbs.filter((c, i, a) => i === 0 || c.label !== a[i - 1]?.label);
}
