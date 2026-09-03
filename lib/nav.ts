import type { Profil } from "./types";
import { canEditParam, canReadParam, ROLE_PROFILES } from "./roles";

export const ROLE_HOME: Record<Profil, string> = {
  ADMIN_SI: "/accueil",
  DIRECTION: "/accueil",
  RESPONSABLE_PRODUCTION: "/accueil",
  AGENT_PRODUCTION: "/accueil",
  RESPONSABLE_QUALITE: "/accueil",
  MAGASINIER: "/accueil",
  RESPONSABLE_ACHATS: "/accueil",
  COMMERCIAL: "/accueil",
  CAISSIER: "/accueil",
  RESPONSABLE_DISTRIBUTION: "/accueil",
  CHAUFFEUR: "/accueil",
  COMPTABILITE_DAF: "/accueil",
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
};

const I = {
  accueil: { href: "/accueil", label: "Accueil", hint: "Votre journée" },
  dashboard: { href: "/dashboard", label: "Tableau de bord", hint: "Indicateurs de l’usine" },
  planning: { href: "/production/planning", label: "Plans", hint: "Planifier la production" },
  of: { href: "/production/of", label: "Ordres de fabrication", hint: "Suivi des OF" },
  suivi: { href: "/production/suivi", label: "Étapes atelier", hint: "Saisie des étapes" },
  pertes: { href: "/production/pertes", label: "Pertes", hint: "Pertes et rebuts" },
  qualite: { href: "/production/qualite", label: "Lots qualité", hint: "Contrôle et libération" },
  besoinsOf: { href: "/production/besoins", label: "Besoins matières", hint: "Besoins théoriques" },
  sorties: { href: "/production/demandes-matieres", label: "Matières atelier", hint: "Sorties et retours" },
  stock: { href: "/stocks", label: "Situation", hint: "Stock disponible" },
  mvt: { href: "/stocks/mouvements", label: "Mouvements", hint: "Entrées et sorties" },
  inv: { href: "/stocks/inventaires", label: "Inventaires", hint: "Comptage physique" },
  apBesoins: { href: "/approvisionnement/besoins", label: "Besoins d'achat", hint: "Besoins à couvrir" },
  da: { href: "/approvisionnement/demandes", label: "Demandes d'achat", hint: "Demandes et validation" },
  cf: { href: "/approvisionnement/commandes", label: "Commandes fournisseurs", hint: "Commandes d’achat" },
  rec: { href: "/approvisionnement/receptions", label: "Réceptions", hint: "Réceptions magasin" },
  cmd: { href: "/commercial/commandes", label: "Commandes", hint: "Commandes clients" },
  cmdNew: { href: "/commercial/commandes/nouvelle", label: "Nouvelle commande", hint: "Créer une commande" },
  clients: { href: "/commercial/clients", label: "Clients", hint: "Fiches clients" },
  factures: { href: "/caisse", label: "Factures", hint: "Suivi des factures" },
  encaissements: { href: "/caisse", label: "Encaissements", hint: "Factures à encaisser" },
  sessions: { href: "/caisse/cloture", label: "Sessions de caisse", hint: "Ouverture et clôture" },
  prep: { href: "/distribution/preparations", label: "Préparations", hint: "Préparer les commandes" },
  bl: { href: "/distribution/bl", label: "Bons de livraison", hint: "Livraisons" },
  tournees: { href: "/distribution/tournees", label: "Tournées", hint: "Tournées du jour" },
  couts: { href: "/couts", label: "Coûts réels", hint: "Coût des OF" },
  marges: { href: "/couts/marges", label: "Coûts standards", hint: "Prix de revient" },
  anomalies: { href: "/comptabilite/brouillards", label: "Anomalies", hint: "Écarts à traiter" },
  exports: { href: "/comptabilite/export-sage", label: "Exports comptables", hint: "Exports de période" },
  clotures: { href: "/comptabilite/clotures", label: "Clôtures", hint: "Périodes comptables" },
  param: { href: "/parametrage", label: "Référentiel", hint: "Articles et tiers" },
  ft: { href: "/parametrage/fiches-techniques", label: "Fiches techniques", hint: "Consultation recettes" },
  users: { href: "/admin/utilisateurs", label: "Utilisateurs" },
  profils: { href: "/admin/profils", label: "Profils" },
  droits: { href: "/admin/droits", label: "Droits d'accès" },
  audit: { href: "/admin/audit", label: "Journal d'audit" },
};

function g(id: string, label: string, icon: string, items: NavItem[]): NavGroup {
  return { id, label, icon, items };
}

export const ROLE_MENU: Record<Profil, NavGroup[]> = {
  ADMIN_SI: [
    g("poste", "Menu", "home", [I.accueil]),
    g("ref", "Référentiel", "sliders", [I.param]),
    g("admin", "Administration", "shield", [I.users, I.profils, I.droits, I.audit]),
  ],
  DIRECTION: [
    g("poste", "Menu", "home", [I.accueil]),
    g("pilotage", "Pilotage", "bar", [I.dashboard, I.couts, I.marges, I.anomalies]),
  ],
  RESPONSABLE_PRODUCTION: [
    g("poste", "Menu", "home", [I.accueil]),
    g("prod", "Production", "factory", [I.planning, I.of, I.besoinsOf, I.da]),
    g("stock", "Stocks", "boxes", [I.stock]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  AGENT_PRODUCTION: [
    g("poste", "Menu", "home", [I.accueil]),
    g("atelier", "Atelier", "factory", [I.suivi, I.pertes, I.of]),
  ],
  RESPONSABLE_QUALITE: [
    g("poste", "Menu", "home", [I.accueil]),
    g("qualite", "Qualité", "check", [I.qualite, I.ft]),
  ],
  MAGASINIER: [
    g("poste", "Menu", "home", [I.accueil]),
    g("magasin", "Magasin", "boxes", [I.sorties, I.stock, I.mvt, I.inv, I.da]),
    g("rec", "Réceptions & quai", "cart", [I.rec, I.prep]),
  ],
  RESPONSABLE_ACHATS: [
    g("poste", "Menu", "home", [I.accueil]),
    g("appro", "Achats", "cart", [I.apBesoins, I.da, I.cf, I.rec]),
    g("stock", "Stocks", "boxes", [I.stock]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  COMMERCIAL: [
    g("poste", "Menu", "home", [I.accueil]),
    g("vente", "Commercial", "handshake", [I.cmd, I.cmdNew, I.clients, I.factures]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  CAISSIER: [
    g("poste", "Menu", "home", [I.accueil]),
    g("caisse", "Caisse", "banknote", [I.encaissements, I.sessions]),
  ],
  RESPONSABLE_DISTRIBUTION: [
    g("poste", "Menu", "home", [I.accueil]),
    g("liv", "Distribution", "truck", [I.prep, I.bl, I.tournees]),
    g("vente", "Commandes", "handshake", [I.cmd]),
  ],
  CHAUFFEUR: [
    g("poste", "Menu", "home", [I.accueil]),
    g("liv", "Mes livraisons", "truck", [I.bl, I.tournees]),
  ],
  COMPTABILITE_DAF: [
    g("poste", "Menu", "home", [I.accueil]),
    g("fin", "Comptabilité", "ledger", [I.anomalies, I.exports, I.clotures, I.audit]),
    g("couts", "Coûts", "coins", [I.couts, I.marges]),
    g("caisse", "Caisse", "banknote", [I.sessions]),
  ],
};

export function navForRole(role: Profil): NavGroup[] {
  return ROLE_MENU[role];
}

export function flattenNav(role: Profil) {
  return navForRole(role).flatMap((group) => group.items.map((i) => ({ ...i, group: group.label })));
}

/** Correspondance menu → route, sans ouvrir les écrans « frères » du même préfixe. */
function matchesItem(href: string, itemHref: string) {
  if (href === itemHref) return true;
  if (itemHref === "/parametrage") return false;
  if (itemHref === "/caisse") {
    return (
      href.startsWith("/caisse/encaissement/") ||
      href.startsWith("/caisse/suspendues")
    );
  }
  if (itemHref === "/stocks") {
    return href.startsWith("/stocks/article/");
  }
  if (itemHref === "/commercial/commandes") {
    if (href.startsWith("/commercial/commandes/nouvelle")) return false;
    return href.startsWith("/commercial/commandes/");
  }
  if (itemHref === "/caisse/cloture") {
    return href === "/caisse/cloture" || href.startsWith("/caisse/cloture/");
  }
  return href.startsWith(itemHref + "/");
}

function matchesExtra(href: string, extra: string) {
  if (href === extra) return true;
  if (extra === "/stocks") return href.startsWith("/stocks/article/");
  if (extra === "/caisse") {
    return href.startsWith("/caisse/encaissement/") || href.startsWith("/caisse/suspendues");
  }
  if (extra === "/commercial/commandes") {
    return href.startsWith("/commercial/commandes/") && !href.startsWith("/commercial/commandes/nouvelle");
  }
  return href.startsWith(extra + "/");
}

const EXTRA_ACCESS: Partial<Record<Profil, string[]>> = {
  DIRECTION: ["/stocks", "/production/qualite"],
  RESPONSABLE_QUALITE: ["/stocks"],
  COMMERCIAL: ["/stocks"],
  RESPONSABLE_DISTRIBUTION: ["/commercial/commandes"],
  CAISSIER: ["/commercial/commandes"],
  RESPONSABLE_PRODUCTION: ["/production/qualite"],
};

export function canAccess(role: Profil, href: string) {
  if (["/403", "/login", "/", "/accueil"].includes(href)) return true;
  if (flattenNav(role).some((i) => matchesItem(href, i.href))) return true;
  const extra = EXTRA_ACCESS[role] ?? [];
  if (extra.some((p) => matchesExtra(href, p))) return true;
  if (href.startsWith("/parametrage")) {
    if (ROLE_PROFILES[role].paramAllow.includes("*")) return true;
    if (href === "/parametrage") {
      return ROLE_PROFILES[role].paramAllow.length > 0 || (ROLE_PROFILES[role].paramRead?.length ?? 0) > 0;
    }
    return canReadParam(role, href) || canEditParam(role, href);
  }
  return false;
}

export function isNavActive(pathname: string, href: string, allHrefs: string[]) {
  if (pathname === href) return true;
  if (href === "/accueil") return false;
  if (!pathname.startsWith(href + "/")) return false;
  const moreSpecific = allHrefs.some(
    (h) => h !== href && h.length > href.length && (pathname === h || pathname.startsWith(h + "/")),
  );
  return !moreSpecific;
}

export function breadcrumbs(pathname: string) {
  const map: Record<string, string> = {
    accueil: "Accueil",
    dashboard: "Tableau de bord",
    production: "Production",
    planning: "Plans",
    of: "Ordres de fabrication",
    suivi: "Étapes",
    "suivi-eau": "Étapes",
    pertes: "Pertes",
    qualite: "Lots qualité",
    besoins: "Besoins matières",
    "demandes-matieres": "Matières atelier",
    stocks: "Stocks",
    article: "Article",
    mouvements: "Mouvements",
    inventaires: "Inventaires",
    alertes: "Stock",
    approvisionnement: "Achats",
    demandes: "Demandes d'achat",
    commandes: "Commandes",
    receptions: "Réceptions",
    commercial: "Commercial",
    nouvelle: "Nouvelle",
    clients: "Clients",
    caisse: "Caisse",
    suspendues: "Factures",
    cloture: "Sessions",
    distribution: "Distribution",
    preparations: "Préparations",
    bl: "Bons de livraison",
    tournees: "Tournées",
    reclamations: "Réclamations",
    couts: "Coûts",
    marges: "Standards",
    comptabilite: "Comptabilité",
    brouillards: "Anomalies",
    "export-sage": "Exports",
    clotures: "Clôtures",
    parametrage: "Référentiel",
    produits: "Articles",
    articles: "Articles",
    matieres: "Matières",
    conditionnements: "Conditionnements",
    "fiches-techniques": "Fiches techniques",
    depots: "Dépôts",
    unites: "Unités",
    seuils: "Articles",
    tarifs: "Tarifs",
    fournisseurs: "Fournisseurs",
    "causes-pertes": "Motifs pertes",
    "motifs-suspension": "Référentiel",
    "motifs-reclamation": "Référentiel",
    sage: "Exports",
    numerotation: "Référentiel",
    general: "Référentiel",
    encaissement: "Caisse",
    admin: "Administration",
    utilisateurs: "Utilisateurs",
    profils: "Profils",
    droits: "Droits",
    audit: "Journal",
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
