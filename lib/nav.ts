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
};

const I = {
  accueil: { href: "/accueil", label: "Mon poste", hint: "Mission et file du jour" },
  dashboard: { href: "/dashboard", label: "Tableau de bord", hint: "Indicateurs vitaux" },
  planning: { href: "/production/planning", label: "Planning", hint: "Plan → OF automatique" },
  of: { href: "/production/of", label: "Ordres de fabrication", hint: "Cycle de vie OF" },
  suivi: { href: "/production/suivi", label: "Suivi atelier", hint: "Saisie du réel" },
  eau: { href: "/production/suivi-eau", label: "Suivi eau", hint: "Compteurs et volumes" },
  pertes: { href: "/production/pertes", label: "Pertes & rebuts", hint: "Causes paramétrées" },
  qualite: { href: "/production/qualite", label: "Contrôle qualité", hint: "Clôture = stock PF" },
  besoinsOf: { href: "/production/besoins", label: "Besoins matières", hint: "Depuis la fiche technique" },
  dm: { href: "/production/demandes-matieres", label: "Demandes matières", hint: "Atelier ↔ magasin" },
  stock: { href: "/stocks", label: "Situation", hint: "Disponible vs réservé" },
  mvt: { href: "/stocks/mouvements", label: "Mouvements", hint: "Entrées / sorties" },
  inv: { href: "/stocks/inventaires", label: "Inventaires", hint: "Théorique vs physique" },
  alertes: { href: "/stocks/alertes", label: "Alertes", hint: "Seuils min" },
  apBesoins: { href: "/approvisionnement/besoins", label: "Besoins d'achat", hint: "Calcul automatique" },
  da: { href: "/approvisionnement/demandes", label: "Demandes d'achat", hint: "Workflow de validation" },
  cf: { href: "/approvisionnement/commandes", label: "Commandes fournisseurs", hint: "Depuis DA validée" },
  rec: { href: "/approvisionnement/receptions", label: "Réceptions", hint: "Écart commandé / reçu" },
  cmd: { href: "/commercial/commandes", label: "Commandes", hint: "Garde stock obligatoire" },
  cmdNew: { href: "/commercial/commandes/nouvelle", label: "Nouvelle commande", hint: "StockGuard" },
  clients: { href: "/commercial/clients", label: "Clients", hint: "Type → encaissement" },
  caisse: { href: "/caisse", label: "Encaissements", hint: "Succès = BL déverrouillé" },
  suspendues: { href: "/caisse/suspendues", label: "Factures suspendues", hint: "Jamais Sage" },
  cloture: { href: "/caisse/cloture", label: "Clôture de caisse", hint: "Théorique vs réel" },
  prep: { href: "/distribution/preparations", label: "Préparations", hint: "Complète ou partielle" },
  bl: { href: "/distribution/bl", label: "Bons de livraison", hint: "Verrou paiement" },
  tournees: { href: "/distribution/tournees", label: "Tournées", hint: "Signature et preuve" },
  recs: { href: "/reclamations", label: "Réclamations", hint: "Lot / commande / BL" },
  couts: { href: "/couts", label: "Coût des OF", hint: "CMUP × réel" },
  marges: { href: "/couts/marges", label: "Marges", hint: "Prix vs revient" },
  brouillards: { href: "/comptabilite/brouillards", label: "Brouillards", hint: "Générés, jamais saisis" },
  sage: { href: "/comptabilite/export-sage", label: "Export Sage 100", hint: "Hors suspendues" },
  param: { href: "/parametrage", label: "Paramétrage", hint: "Référentiel de votre poste" },
  users: { href: "/admin/utilisateurs", label: "Utilisateurs" },
  profils: { href: "/admin/profils", label: "Profils" },
  droits: { href: "/admin/droits", label: "Matrice des droits" },
  audit: { href: "/admin/audit", label: "Journal d'audit" },
};

function g(id: string, label: string, icon: string, items: NavItem[]): NavGroup {
  return { id, label, icon, items };
}

/** Sidebar stricte : uniquement les écrans du poste. Rien n’est « grisé ». */
export const ROLE_MENU: Record<Role, NavGroup[]> = {
  administrateur: [
    g("poste", "Poste", "home", [I.accueil]),
    g("ref", "Référentiel", "sliders", [I.param]),
    g("admin", "Administration", "shield", [I.users, I.profils, I.droits, I.audit]),
  ],
  direction: [
    g("poste", "Poste", "home", [I.accueil]),
    g("pilotage", "Pilotage", "bar", [I.dashboard]),
  ],
  responsable_production: [
    g("poste", "Poste", "home", [I.accueil]),
    g("prod", "Production", "factory", [I.planning, I.of, I.besoinsOf, I.dm]),
    g("stock", "Stocks", "boxes", [I.stock, I.alertes]),
    g("couts", "Coûts", "coins", [I.couts]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  agent_production: [
    g("poste", "Poste", "home", [I.accueil]),
    g("atelier", "Atelier", "factory", [I.suivi, I.eau, I.pertes, I.of]),
  ],
  controleur_qualite: [
    g("poste", "Poste", "home", [I.accueil]),
    g("qualite", "Qualité", "check", [I.qualite, I.of]),
    g("av", "Après-vente", "alert", [I.recs]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  magasinier: [
    g("poste", "Poste", "home", [I.accueil]),
    g("magasin", "Magasin", "boxes", [I.dm, I.stock, I.mvt, I.inv, I.alertes]),
    g("rec", "Réceptions", "cart", [I.rec]),
  ],
  responsable_achats: [
    g("poste", "Poste", "home", [I.accueil]),
    g("appro", "Approvisionnement", "cart", [I.apBesoins, I.da, I.cf, I.rec]),
    g("stock", "Stocks", "boxes", [I.stock, I.alertes]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  commercial: [
    g("poste", "Poste", "home", [I.accueil]),
    g("vente", "Vente", "handshake", [I.cmd, I.cmdNew, I.clients]),
    g("av", "Après-vente", "alert", [I.recs]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
  caissier: [
    g("poste", "Poste", "home", [I.accueil]),
    g("caisse", "Caisse", "banknote", [I.caisse, I.suspendues, I.cloture]),
  ],
  preparateur: [
    g("poste", "Poste", "home", [I.accueil]),
    g("quai", "Préparation", "package", [I.prep]),
  ],
  logistique: [
    g("poste", "Poste", "home", [I.accueil]),
    g("liv", "Livraison", "truck", [I.bl, I.tournees]),
    g("av", "Après-vente", "alert", [I.recs]),
  ],
  comptabilite: [
    g("poste", "Poste", "home", [I.accueil]),
    g("fin", "Comptabilité", "ledger", [I.brouillards, I.sage]),
    g("couts", "Coûts", "coins", [I.couts, I.marges]),
    g("ref", "Référentiel", "sliders", [I.param]),
  ],
};

export function navForRole(role: Role): NavGroup[] {
  return ROLE_MENU[role];
}

export function flattenNav(role: Role) {
  return navForRole(role).flatMap((group) => group.items.map((i) => ({ ...i, group: group.label })));
}

function matchesItem(href: string, itemHref: string) {
  return href === itemHref || href.startsWith(itemHref + "/");
}

function matchesExtra(href: string, extra: string) {
  if (href === extra) return true;
  if (extra === "/stocks") return href.startsWith("/stocks/article/");
  return href.startsWith(extra + "/");
}

/** Lecture hors menu (ex. Direction qui clique un indicateur du dashboard). */
const EXTRA_ACCESS: Partial<Record<Role, string[]>> = {
  direction: ["/production/of", "/stocks", "/stocks/alertes", "/caisse/suspendues", "/commercial/commandes"],
  controleur_qualite: ["/stocks"],
  commercial: ["/distribution/bl", "/stocks"],
  preparateur: ["/commercial/commandes"],
  logistique: ["/commercial/commandes"],
  caissier: ["/commercial/commandes"],
};

export function canAccess(role: Role, href: string) {
  if (["/403", "/login", "/", "/accueil"].includes(href)) return true;

  if (flattenNav(role).some((i) => matchesItem(href, i.href))) return true;

  const extra = EXTRA_ACCESS[role] ?? [];
  if (extra.some((p) => matchesExtra(href, p))) return true;

  if (href.startsWith("/parametrage")) {
    const allow = ROLE_PROFILES[role].paramAllow;
    if (allow.includes("*")) return true;
    if (href === "/parametrage") return allow.length > 0;
    return allow.some((p) => matchesItem(href, p));
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
    caisse: "Caisse",
    encaissement: "Encaissement",
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
