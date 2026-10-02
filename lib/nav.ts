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
  { label: "Réels", href: "/couts" },
  { label: "Standards & marges", href: "/couts/marges" },
  { label: "Valorisation", href: "/stocks/valorisation" },
];

const DAF_CONTROLE: HubTab[] = [
  { label: "Anomalies", href: "/comptabilite/brouillards" },
  { label: "Impayés", href: "/commercial/impayes" },
  { label: "Écarts de caisse", href: "/comptabilite/ecarts" },
];

const DAF_COMPTA: HubTab[] = [
  { label: "Écritures", href: "/comptabilite/ecritures" },
  { label: "Exports", href: "/comptabilite/export-sage" },
  { label: "Clôtures", href: "/comptabilite/clotures" },
  { label: "Paramètres comptables", href: "/comptabilite/parametres" },
];

const DAF_CAISSE: HubTab[] = [
  { label: "Sessions", href: "/caisse/cloture" },
  { label: "Décaissements", href: "/caisse/decaissements" },
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

/** « Catalogue » du Responsable Achat. */
const ACHATS_CATALOGUE: NavItem[] = [
  { href: "/parametrage/produits", label: "Articles" },
  { href: "/parametrage/matieres", label: "Matières" },
];

/** Hub « Stock » du Magasinier. */
const STOCK_MAGASIN: NavItem[] = [
  { href: "/stocks", label: "Situation" },
  { href: "/stocks/mouvements", label: "Mouvements" },
  { href: "/stocks/inventaires", label: "Inventaires" },
  { href: "/parametrage/depots", label: "Dépôts" },
];

/** « Fiches » du Responsable Qualité : articles et fiches techniques en lecture. */
const QUALITE_FICHES: NavItem[] = [
  { href: "/parametrage/produits", label: "Articles" },
  { href: "/parametrage/fiches-techniques", label: "Fiches techniques" },
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
  // Poste mobile : 3 entrées, affichées en barre basse sur téléphone.
  AGENT_PRODUCTION: [
    g("atelier", "Atelier", "factory", [
      { href: "/production/of", label: "Mes OF", hint: "OF qui vous sont affectés" },
      { href: "/production/suivi", label: "Saisir", hint: "Étape, perte, eau, session" },
      I.accueil,
    ]),
  ],
  // Menu à plat : 5 entrées ; les « OF reçus » deviennent l’onglet « À créer » des lots.
  RESPONSABLE_QUALITE: [
    g("qualite", "Qualité", "check", [
      I.accueil,
      I.qualite,
      I.reclamations,
      { ...I.stock, label: "Stock" },
      { href: "/parametrage/produits", label: "Fiches", hint: "Articles et fiches techniques (lecture)", hub: QUALITE_FICHES },
    ]),
  ],
  // Menu à plat : 6 entrées ; mouvements, inventaires et dépôts sont des onglets de « Stock ».
  MAGASINIER: [
    g("magasin", "Magasin", "boxes", [
      I.accueil,
      { ...I.sorties, label: "Servir l’atelier", hint: "Livrer les matières demandées" },
      I.prep,
      I.rec,
      { ...I.stock, label: "Stock", hint: "Situation, mouvements, inventaires, dépôts", hub: STOCK_MAGASIN },
      I.reclamations,
    ]),
  ],
  // Menu à plat : 5 entrées ; besoins, demandes, commandes et réceptions sont les étapes du flux « Approvisionnement ».
  RESPONSABLE_ACHATS: [
    g("appro", "Achats", "cart", [
      I.accueil,
      { href: "/approvisionnement", label: "Approvisionnement", hint: "Besoins → demandes → commandes → réceptions" },
      { href: "/parametrage/fournisseurs", label: "Fournisseurs", hint: "Fiches fournisseurs" },
      { ...I.stock, label: "Stock" },
      { href: "/parametrage/produits", label: "Catalogue", hint: "Articles et matières", hub: ACHATS_CATALOGUE },
    ]),
  ],
  // Menu à plat : 6 entrées ; factures, impayés et avoirs sont des onglets de « Facturation ».
  COMMERCIAL: [
    g("vente", "Vente", "handshake", [
      I.accueil,
      I.cmd,
      { href: "/commercial/facturation", label: "Facturation", hint: "Factures, impayés, avoirs" },
      { href: "/parametrage/clients", label: "Clients", hint: "Fiches et conditions" },
      { href: "/parametrage/tarifs", label: "Tarifs", hint: "Prix de vente" },
      I.reclamations,
    ]),
  ],
  // Menu à plat : 4 entrées (encaissement d’une facture et factures non soldées sont dans « Caisse »).
  CAISSIER: [
    g("caisse", "Caisse", "banknote", [
      I.accueil,
      { href: "/caisse", label: "Caisse", hint: "Encaisser les factures" },
      I.decaissements,
      { href: "/caisse/cloture", label: "Ma session", hint: "Solde, clôture et écart" },
    ]),
  ],
  // Menu à plat : 4 entrées ; préparations et BL sont des étapes du « Circuit de livraison ».
  RESPONSABLE_DISTRIBUTION: [
    g("liv", "Logistique", "truck", [
      I.accueil,
      { href: "/distribution", label: "Circuit de livraison", hint: "Commandes → préparations → BL → livrées" },
      { href: "/distribution/tournees", label: "Tournées & flotte", hint: "Tournées, véhicules, chauffeurs" },
      I.reclamations,
    ]),
  ],
  // Poste mobile : 2 entrées en barre basse ; l’accueil est la tournée du jour.
  CHAUFFEUR: [
    g("liv", "Tournée", "truck", [
      { href: "/accueil", label: "Ma tournée", hint: "BL du jour dans l’ordre de passage" },
      { href: "/distribution/bl", label: "Historique", hint: "Mes livraisons passées" },
    ]),
  ],
  // Menu à plat : 7 entrées, chacune à onglets.
  COMPTABILITE_DAF: [
    g("fin", "Finance", "ledger", [
      I.accueil,
      { href: "/comptabilite/brouillards", label: "Contrôle", hint: "Anomalies, impayés, écarts de caisse", hub: DAF_CONTROLE },
      { href: "/comptabilite/ecritures", label: "Comptabilité", hint: "Écritures, exports, clôtures, paramètres", hub: DAF_COMPTA },
      { ...I.coutsMarges, label: "Coûts", hub: COUTS_MARGES },
      { href: "/caisse/cloture", label: "Caisse", hint: "Sessions et décaissements", hub: DAF_CAISSE },
      { href: "/parametrage/fiscalite", label: "Fiscalité", hint: "Familles et codes fiscaux" },
      I.audit,
    ]),
  ],
};

/** Postes dont le menu s’affiche en barre basse sur mobile (saisie terrain). */
export const BOTTOM_NAV_ROLES: Profil[] = ["AGENT_PRODUCTION", "CHAUFFEUR"];

export function navForRole(role: Profil): NavGroup[] {
  const base = ROLE_MENU[role];
  // Menus à plat (un seul groupe) : le référentiel utile est déjà dans une entrée à onglets.
  if (base.length === 1) return base;
  const used = new Set(base.flatMap((group) => group.items.flatMap(itemPatterns)));
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
  COMMERCIAL: ["/stocks"],
  RESPONSABLE_DISTRIBUTION: ["/commercial/commandes"],
  CAISSIER: ["/commercial/commandes"],
  RESPONSABLE_PRODUCTION: ["/production/qualite"],
};

export function canAccess(role: Profil, url: string) {
  const href = url.split(/[?#]/)[0];
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
    approvisionnement: "Approvisionnement",
    demandes: "Demandes d'achat",
    commandes: "Commandes",
    receptions: "Réceptions",
    commercial: "Commercial",
    nouvelle: "Nouvelle",
    facturation: "Facturation",
    clients: "Clients",
    caisse: "Caisse",
    suspendues: "Factures",
    cloture: "Sessions",
    decaissements: "Décaissements",
    impayes: "Impayés",
    distribution: "Circuit de livraison",
    preparations: "Préparations",
    bl: "Bons de livraison",
    tournees: "Tournées",
    reclamations: "Réclamations",
    couts: "Coûts",
    marges: "Standards",
    comptabilite: "Comptabilité",
    brouillards: "Anomalies",
    "export-sage": "Exports",
    ecarts: "Écarts de caisse",
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
