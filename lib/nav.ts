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
  /** Entrée « hub » : les écrans regroupés s’affichent sous des onglets communs. */
  hub?: HubTab[];
};

/** Onglet d’un hub ; `items` = sous-onglets (sinon l’onglet est l’écran `href`). */
export type HubTab = { label: string; href: string; items?: NavItem[] };

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
  suiviEau: { href: "/production/suivi-eau", label: "Suivi eau", hint: "Captage et embouteillage" },
  pertes: { href: "/production/pertes", label: "Pertes", hint: "Pertes et rebuts" },
  qualite: { href: "/production/qualite", label: "Lots qualité", hint: "Contrôle et libération" },
  ofRecus: { href: "/production/qualite/of", label: "OF reçus", hint: "Production terminée, à contrôler" },
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
  decaissements: { href: "/caisse/decaissements", label: "Décaissements", hint: "Sorties de caisse" },
  prep: { href: "/distribution/preparations", label: "Préparations", hint: "Préparer les commandes" },
  bl: { href: "/distribution/bl", label: "Bons de livraison", hint: "Livraisons" },
  tournees: { href: "/distribution/tournees", label: "Tournées", hint: "Tournées du jour" },
  couts: { href: "/couts", label: "Coûts réels", hint: "Coût des OF" },
  marges: { href: "/couts/marges", label: "Coûts standards", hint: "Prix de revient" },
  anomalies: { href: "/comptabilite/brouillards", label: "Anomalies", hint: "Écarts à traiter" },
  exports: { href: "/comptabilite/export-sage", label: "Exports comptables", hint: "Exports de période" },
  clotures: { href: "/comptabilite/clotures", label: "Clôtures", hint: "Périodes comptables" },
  ecritures: { href: "/comptabilite/ecritures", label: "Écritures", hint: "Journal comptable" },
  parametresCompta: { href: "/comptabilite/parametres", label: "Paramètres comptables", hint: "Plan de comptes, seuils" },
  valorisation: { href: "/stocks/valorisation", label: "Valorisation du stock", hint: "Coût moyen pondéré (CMUP)" },
  ft: { href: "/parametrage/fiches-techniques", label: "Fiches techniques", hint: "Consultation recettes" },
  users: { href: "/admin/utilisateurs", label: "Utilisateurs & profils", hint: "Comptes, rôles et accès" },
  ftAdmin: { href: "/parametrage/fiches-techniques", label: "Fiches techniques", hint: "Composer et valider les recettes" },
  referentiel: { href: "/parametrage", label: "Référentiel", hint: "Articles, matières, tiers, fiscalité" },
  supervision: { href: "/commercial/commandes", label: "Supervision", hint: "Commandes, production, achats, livraisons, stocks" },
  coutsMarges: { href: "/couts", label: "Coûts & marges", hint: "Coûts réels, standards, valorisation" },
  anomaliesEcritures: { href: "/comptabilite/brouillards", label: "Anomalies & écritures", hint: "Écarts détectés et journal comptable" },
  parametres: { href: "/admin/parametres", label: "Paramètres", hint: "Listes fixes, numérotation" },
  audit: { href: "/admin/audit", label: "Journal d'audit", hint: "Historique des actions" },
  caisses: { href: "/admin/caisses", label: "Caisses", hint: "Créer et affecter les caisses" },
  reclamations: { href: "/reclamations", label: "Réclamations", hint: "Retours clients" },
  avoirs: { href: "/commercial/avoirs", label: "Avoirs", hint: "Crédits clients" },
  impayes: { href: "/commercial/impayes", label: "Impayés", hint: "Factures en retard" },
};

// ---------- hubs à onglets ----------

const SUPERVISION: HubTab[] = [
  { label: "Commandes", href: "/commercial/commandes" },
  { label: "Production", href: "/production/of", items: [{ href: "/production/of", label: "Ordres de fabrication" }, { href: "/production/qualite", label: "Lots" }] },
  {
    label: "Achats",
    href: "/approvisionnement/besoins",
    items: [
      { href: "/approvisionnement/besoins", label: "Besoins" },
      { href: "/approvisionnement/commandes", label: "Commandes fournisseurs" },
      { href: "/approvisionnement/receptions", label: "Réceptions" },
    ],
  },
  { label: "Distribution", href: "/distribution/preparations", items: [{ href: "/distribution/preparations", label: "Préparations" }, { href: "/distribution/bl", label: "Bons de livraison" }] },
  {
    label: "Stocks",
    href: "/stocks",
    items: [
      { href: "/stocks", label: "Situation" },
      { href: "/stocks/mouvements", label: "Mouvements" },
      { href: "/stocks/inventaires", label: "Inventaires" },
    ],
  },
];

const COUTS_MARGES: HubTab[] = [
  { label: "Coûts réels", href: "/couts" },
  { label: "Coûts standards", href: "/couts/marges" },
  { label: "Valorisation du stock", href: "/stocks/valorisation" },
];

const ANOMALIES_ECRITURES: HubTab[] = [
  { label: "Anomalies", href: "/comptabilite/brouillards" },
  { label: "Écritures", href: "/comptabilite/ecritures" },
];

/** Pages du référentiel, listées directement dans le groupe « Référentiel » selon les droits du profil. */
const PARAM_PAGES: NavItem[] = [
  { href: "/parametrage/produits", label: "Articles", hint: "Eau, jus, yaourts" },
  { href: "/parametrage/matieres", label: "Matières", hint: "Matières premières" },
  { href: "/parametrage/conditionnements", label: "Conditionnements", hint: "Cartons et palettes" },
  { href: "/parametrage/fiches-techniques", label: "Fiches techniques", hint: "Recettes de fabrication" },
  { href: "/parametrage/depots", label: "Dépôts", hint: "Magasins" },
  { href: "/parametrage/clients", label: "Clients", hint: "Fiches clients" },
  { href: "/parametrage/tarifs", label: "Tarifs", hint: "Prix de vente" },
  { href: "/parametrage/fournisseurs", label: "Fournisseurs", hint: "Fournisseurs matières" },
  { href: "/parametrage/fiscalite", label: "Codes fiscaux", hint: "TVA, accises, centimes" },
];

/** Onglets du hub « Référentiel » de l’Admin SI. */
export const REF_TABS: NavItem[] = [
  { href: "/parametrage/produits", label: "Articles" },
  { href: "/parametrage/matieres", label: "Matières" },
  { href: "/parametrage/conditionnements", label: "Conditionnements" },
  { href: "/parametrage/depots", label: "Dépôts" },
  { href: "/parametrage/clients", label: "Clients" },
  { href: "/parametrage/fournisseurs", label: "Fournisseurs" },
  { href: "/parametrage/fiscalite", label: "Codes fiscaux" },
];

/** Référentiel du Responsable Production (fiches techniques en lecture). */
const PROD_REF_TABS: NavItem[] = [
  { href: "/parametrage/produits", label: "Articles" },
  { href: "/parametrage/matieres", label: "Matières" },
  { href: "/parametrage/conditionnements", label: "Conditionnements" },
  { href: "/parametrage/fiches-techniques", label: "Fiches techniques" },
];

function g(id: string, label: string, icon: string, items: NavItem[]): NavGroup {
  return { id, label, icon, items };
}

export const ROLE_MENU: Record<Profil, NavGroup[]> = {
  ADMIN_SI: [
    // Menu à plat : 7 entrées, le référentiel est regroupé derrière un hub à onglets.
    g("config", "Configuration", "shield", [I.accueil, I.users, I.caisses, I.ftAdmin, { ...I.referentiel, hub: REF_TABS }, I.parametres, I.audit]),
  ],
  // Menu à plat : 6 entrées, tout en lecture sauf l’autorisation des décaissements.
  DIRECTION: [
    g("pilotage", "Pilotage", "bar", [
      I.accueil,
      I.dashboard,
      { ...I.supervision, hub: SUPERVISION },
      { ...I.coutsMarges, hub: COUTS_MARGES },
      { ...I.anomaliesEcritures, hub: ANOMALIES_ECRITURES },
      I.decaissements,
    ]),
  ],
  // Menu à plat : 6 entrées ; besoins matières et suivi eau sont des onglets de la fiche OF.
  RESPONSABLE_PRODUCTION: [
    g("prod", "Production", "factory", [
      I.accueil,
      I.planning,
      I.of,
      I.sorties,
      { ...I.stock, label: "Stock" },
      { ...I.referentiel, hint: "Articles, matières, conditionnements, fiches techniques", hub: PROD_REF_TABS },
    ]),
  ],
  AGENT_PRODUCTION: [
    g("poste", "Menu", "home", [I.accueil]),
    g("atelier", "Atelier", "factory", [I.suivi, I.suiviEau, I.pertes, I.of]),
  ],
  RESPONSABLE_QUALITE: [
    g("poste", "Menu", "home", [I.accueil]),
    g("qualite", "Qualité", "check", [I.ofRecus, I.qualite, I.ft, I.reclamations]),
  ],
  MAGASINIER: [
    g("poste", "Menu", "home", [I.accueil]),
    g("magasin", "Magasin", "boxes", [I.sorties, I.stock, I.mvt, I.inv, I.da]),
    g("rec", "Réceptions & quai", "cart", [I.rec, I.prep, I.reclamations]),
  ],
  RESPONSABLE_ACHATS: [
    g("poste", "Menu", "home", [I.accueil]),
    g("appro", "Achats", "cart", [I.apBesoins, I.da, I.cf, I.rec]),
    g("stock", "Stocks", "boxes", [I.stock]),
  ],
  COMMERCIAL: [
    g("poste", "Menu", "home", [I.accueil]),
    g("vente", "Commercial", "handshake", [I.cmd, I.cmdNew, I.clients, I.factures, I.avoirs, I.impayes, I.reclamations]),
  ],
  CAISSIER: [
    g("poste", "Menu", "home", [I.accueil]),
    g("caisse", "Caisse", "banknote", [I.encaissements, I.sessions, I.decaissements]),
  ],
  RESPONSABLE_DISTRIBUTION: [
    g("poste", "Menu", "home", [I.accueil]),
    g("liv", "Distribution", "truck", [I.prep, I.bl, I.tournees, I.reclamations]),
    g("vente", "Commandes", "handshake", [I.cmd]),
  ],
  CHAUFFEUR: [
    g("poste", "Menu", "home", [I.accueil]),
    g("liv", "Mes livraisons", "truck", [I.bl, I.tournees]),
  ],
  COMPTABILITE_DAF: [
    g("poste", "Menu", "home", [I.accueil]),
    g("fin", "Comptabilité", "ledger", [I.anomalies, I.ecritures, I.exports, I.clotures, I.parametresCompta, I.audit, I.impayes]),
    g("couts", "Coûts", "coins", [I.couts, I.marges, I.valorisation]),
    g("caisse", "Caisse", "banknote", [I.sessions, I.decaissements]),
  ],
};

export function navForRole(role: Profil): NavGroup[] {
  const base = ROLE_MENU[role];
  const used = new Set(base.flatMap((group) => group.items.map((i) => i.href)));
  // Le hub « Référentiel » (onglets) remplace la liste des pages.
  if (used.has("/parametrage")) return base;
  const refItems = PARAM_PAGES.filter((p) => !used.has(p.href) && (canReadParam(role, p.href) || canEditParam(role, p.href)));
  if (refItems.length === 0) return base;
  const ref = g("ref", "Référentiel", "sliders", refItems);
  // Le référentiel se place avant l’administration, sinon en fin de menu.
  const adminIdx = base.findIndex((group) => group.id === "admin");
  return adminIdx >= 0 ? [...base.slice(0, adminIdx), ref, ...base.slice(adminIdx)] : [...base, ref];
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
  RESPONSABLE_QUALITE: ["/stocks"],
  COMMERCIAL: ["/stocks"],
  RESPONSABLE_DISTRIBUTION: ["/commercial/commandes"],
  CAISSIER: ["/commercial/commandes"],
  RESPONSABLE_PRODUCTION: ["/production/qualite"],
};

export function canAccess(role: Profil, href: string) {
  if (["/403", "/login", "/", "/accueil"].includes(href)) return true;
  if (flattenNav(role).some((i) => itemPatterns(i).some((p) => matchesItem(href, p)))) return true;
  const extra = EXTRA_ACCESS[role] ?? [];
  if (extra.some((p) => matchesExtra(href, p))) return true;
  if (href.startsWith("/parametrage")) {
    if (ROLE_PROFILES[role].paramAllow.includes("*")) return true;
    if (href === "/parametrage") {
      return ROLE_PROFILES[role].paramAllow.length > 0 || (ROLE_PROFILES[role].paramRead?.length ?? 0) > 0;
    }
    return canReadParam(role, href) || canEditParam(role, href);
  }
  if (href.startsWith("/reclamations") || href.startsWith("/commercial/avoirs")) {
    return flattenNav(role).some((i) => matchesItem(href, i.href) || i.href === "/reclamations" || i.href === "/commercial/avoirs");
  }
  return false;
}

function pathMatch(pathname: string, p: string) {
  return pathname === p || (p !== "/accueil" && pathname.startsWith(p + "/"));
}

/** Chemins couverts par une entrée du menu (elle-même + écrans de son hub). */
export function itemPatterns(item: NavItem) {
  return [item.href, ...(item.hub ?? []).flatMap((t) => (t.items ?? [t]).map((i) => i.href))];
}

/** Entrée du menu active : celle dont un chemin correspond le plus précisément à l’URL. */
export function activeNavHref(pathname: string, items: NavItem[]) {
  let best: string | null = null;
  let len = -1;
  items.forEach((item) =>
    itemPatterns(item).forEach((p) => {
      if (pathMatch(pathname, p) && p.length > len) {
        best = item.href;
        len = p.length;
      }
    }),
  );
  return best;
}

/** Hub à onglets de l’écran courant (entrée du menu, onglet et sous-onglet actifs). */
export function activeHub(pathname: string, role: Profil) {
  const items = flattenNav(role);
  const href = activeNavHref(pathname, items);
  const item = items.find((i) => i.href === href && i.hub?.length);
  if (!item?.hub) return null;
  let tab: HubTab | null = null;
  let sub: NavItem | null = null;
  let len = -1;
  item.hub.forEach((t) =>
    (t.items ?? [t]).forEach((i) => {
      if (pathMatch(pathname, i.href) && i.href.length > len) {
        tab = t;
        sub = i;
        len = i.href.length;
      }
    }),
  );
  return tab ? { item, tab: tab as HubTab, sub: sub as NavItem | null } : null;
}

export function breadcrumbs(pathname: string) {
  const map: Record<string, string> = {
    accueil: "Accueil",
    dashboard: "Tableau de bord",
    production: "Production",
    planning: "Plans",
    of: "Ordres de fabrication",
    suivi: "Étapes",
    "suivi-eau": "Suivi eau",
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
    decaissements: "Décaissements",
    impayes: "Impayés",
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
    utilisateurs: "Utilisateurs & profils",
    parametres: "Paramètres",
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
