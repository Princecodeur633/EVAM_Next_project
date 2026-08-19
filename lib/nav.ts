import type { Role } from "./types";

export const ROLE_HOME: Record<Role, string> = {
  administrateur: "/dashboard",
  direction: "/dashboard",
  responsable_production: "/production/planning",
  agent_production: "/production/suivi",
  controleur_qualite: "/production/qualite",
  magasinier: "/stocks/mouvements",
  responsable_achats: "/approvisionnement/besoins",
  commercial: "/commercial/commandes",
  caissier: "/caisse",
  preparateur: "/distribution/preparations",
  logistique: "/distribution/tournees",
  comptabilite: "/comptabilite/brouillards",
};

export type NavItem = {
  href: string;
  label: string;
  module?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  roles: Role[];
};

export const NAV: NavGroup[] = [
  {
    id: "accueil",
    label: "Pilotage",
    roles: ["administrateur", "direction"],
    items: [{ href: "/dashboard", label: "Tableau de bord" }],
  },
  {
    id: "production",
    label: "Production",
    roles: ["administrateur", "direction", "responsable_production", "agent_production", "controleur_qualite"],
    items: [
      { href: "/production/planning", label: "Planning", module: "planning" },
      { href: "/production/of", label: "Ordres de fabrication" },
      { href: "/production/suivi", label: "Suivi atelier" },
      { href: "/production/suivi-eau", label: "Suivi eau" },
      { href: "/production/pertes", label: "Pertes & rebuts" },
      { href: "/production/qualite", label: "Contrôle qualité" },
      { href: "/production/besoins", label: "Besoins matières" },
      { href: "/production/demandes-matieres", label: "Demandes matières" },
    ],
  },
  {
    id: "stocks",
    label: "Stocks",
    roles: ["administrateur", "direction", "magasinier", "responsable_production", "responsable_achats"],
    items: [
      { href: "/stocks", label: "Situation" },
      { href: "/stocks/mouvements", label: "Mouvements" },
      { href: "/stocks/inventaires", label: "Inventaires" },
      { href: "/stocks/alertes", label: "Alertes" },
    ],
  },
  {
    id: "appro",
    label: "Approvisionnement",
    roles: ["administrateur", "direction", "responsable_achats", "magasinier"],
    items: [
      { href: "/approvisionnement/besoins", label: "Besoins" },
      { href: "/approvisionnement/demandes", label: "Demandes d'achat" },
      { href: "/approvisionnement/commandes", label: "Commandes fournisseurs" },
      { href: "/approvisionnement/receptions", label: "Réceptions" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    roles: ["administrateur", "direction", "commercial"],
    items: [
      { href: "/commercial/commandes", label: "Commandes" },
      { href: "/commercial/commandes/nouvelle", label: "Nouvelle commande" },
      { href: "/commercial/clients", label: "Clients" },
    ],
  },
  {
    id: "caisse",
    label: "Caisse",
    roles: ["administrateur", "direction", "caissier"],
    items: [
      { href: "/caisse", label: "Encaissements" },
      { href: "/caisse/suspendues", label: "Factures suspendues" },
      { href: "/caisse/cloture", label: "Clôture" },
    ],
  },
  {
    id: "distribution",
    label: "Distribution",
    roles: ["administrateur", "direction", "preparateur", "logistique", "commercial"],
    items: [
      { href: "/distribution/preparations", label: "Préparations" },
      { href: "/distribution/bl", label: "Bons de livraison" },
      { href: "/distribution/tournees", label: "Tournées" },
    ],
  },
  {
    id: "reclamations",
    label: "Réclamations",
    roles: ["administrateur", "direction", "logistique", "commercial", "controleur_qualite"],
    items: [{ href: "/reclamations", label: "Réclamations" }],
  },
  {
    id: "couts",
    label: "Coûts",
    roles: ["administrateur", "direction", "responsable_production", "comptabilite"],
    items: [
      { href: "/couts", label: "Coût des OF" },
      { href: "/couts/marges", label: "Marges" },
    ],
  },
  {
    id: "compta",
    label: "Comptabilité",
    roles: ["administrateur", "direction", "comptabilite"],
    items: [
      { href: "/comptabilite/brouillards", label: "Brouillards" },
      { href: "/comptabilite/export-sage", label: "Export Sage 100" },
    ],
  },
  {
    id: "param",
    label: "Paramétrage",
    roles: ["administrateur", "responsable_production", "responsable_achats", "commercial", "comptabilite", "controleur_qualite"],
    items: [
      { href: "/parametrage", label: "Référentiels" },
      { href: "/parametrage/produits", label: "Produits finis" },
      { href: "/parametrage/matieres", label: "Matières" },
      { href: "/parametrage/conditionnements", label: "Conditionnements" },
      { href: "/parametrage/fiches-techniques", label: "Fiches techniques" },
      { href: "/parametrage/depots", label: "Dépôts" },
      { href: "/parametrage/unites", label: "Unités" },
      { href: "/parametrage/seuils", label: "Seuils d'alerte" },
      { href: "/parametrage/clients", label: "Clients" },
      { href: "/parametrage/tarifs", label: "Tarifs" },
      { href: "/parametrage/fournisseurs", label: "Fournisseurs" },
      { href: "/parametrage/encaissement", label: "Modes d'encaissement" },
      { href: "/parametrage/causes-pertes", label: "Causes de pertes" },
      { href: "/parametrage/motifs-suspension", label: "Motifs de suspension" },
      { href: "/parametrage/motifs-reclamation", label: "Motifs de réclamation" },
      { href: "/parametrage/sage", label: "Mapping Sage" },
      { href: "/parametrage/numerotation", label: "Numérotation" },
      { href: "/parametrage/general", label: "Paramètres généraux" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
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
  return NAV.filter((g) => g.roles.includes(role)).map((g) => {
    if (role === "agent_production") {
      return {
        ...g,
        items: g.items.filter((i) =>
          ["/production/suivi", "/production/suivi-eau", "/production/pertes", "/production/of"].includes(i.href),
        ),
      };
    }
    if (role === "controleur_qualite" && g.id === "production") {
      return {
        ...g,
        items: g.items.filter((i) =>
          ["/production/qualite", "/production/of"].includes(i.href),
        ),
      };
    }
    if (role === "preparateur") {
      return { ...g, items: g.items.filter((i) => i.href.startsWith("/distribution/preparations") || g.id !== "distribution") };
    }
    if (role === "logistique" && g.id === "distribution") {
      return { ...g, items: g.items.filter((i) => i.href !== "/distribution/preparations") };
    }
    if (role === "commercial" && g.id === "param") {
      return { ...g, items: g.items.filter((i) => ["/parametrage", "/parametrage/clients", "/parametrage/tarifs"].includes(i.href)) };
    }
    if (role === "responsable_achats" && g.id === "param") {
      return {
        ...g,
        items: g.items.filter((i) =>
          ["/parametrage", "/parametrage/matieres", "/parametrage/fournisseurs", "/parametrage/seuils"].includes(i.href),
        ),
      };
    }
    if (role === "responsable_production" && g.id === "param") {
      return {
        ...g,
        items: g.items.filter((i) =>
          [
            "/parametrage",
            "/parametrage/produits",
            "/parametrage/fiches-techniques",
            "/parametrage/causes-pertes",
            "/parametrage/seuils",
          ].includes(i.href),
        ),
      };
    }
    if (role === "comptabilite" && g.id === "param") {
      return { ...g, items: g.items.filter((i) => ["/parametrage", "/parametrage/sage", "/parametrage/general"].includes(i.href)) };
    }
    if (role === "controleur_qualite" && g.id === "param") {
      return { ...g, items: g.items.filter((i) => ["/parametrage", "/parametrage/fiches-techniques", "/parametrage/causes-pertes"].includes(i.href)) };
    }
    return g;
  }).filter((g) => g.items.length > 0);
}

export function canAccess(role: Role, href: string) {
  if (href === "/403" || href === "/login" || href === "/") return true;
  return navForRole(role).some((g) => g.items.some((i) => href === i.href || href.startsWith(i.href + "/")));
}
