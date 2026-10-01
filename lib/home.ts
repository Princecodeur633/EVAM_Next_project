import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeAlert,
  Ban,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FilePlus2,
  FileOutput,
  FileText,
  FlaskConical,
  HandCoins,
  History,
  Inbox,
  ListChecks,
  ListTodo,
  Lock,
  MessageSquareWarning,
  PackageCheck,
  PackageMinus,
  PackageOpen,
  Receipt,
  Route,
  ScrollText,
  ShoppingCart,
  TrendingDown,
  Truck,
  UserPlus,
  Users,
  UserCog,
  Vault,
  Wallet,
} from "lucide-react";
import type { ChartPoint } from "@/components/charts";
import { stockDisponible } from "./engine";
import {
  displayName,
  MODE_PAIEMENT_LABEL,
  MOTIF_PERTE_LABEL,
  PROFIL_LABEL,
  STATUT_BL_LABEL,
  STATUT_CF_LABEL,
  STATUT_CMD_LABEL,
  STATUT_DEMANDE_MATIERE_LABEL,
  STATUT_LOT_LABEL,
  STATUT_OF_LABEL,
  STATUT_PLAN_LABEL,
  STATUT_PREP_LABEL,
  STATUT_RECLAMATION_LABEL,
  TYPE_ANOMALIE_LABEL,
  TYPE_EXPORT_LABEL,
  TYPE_MVT_LABEL,
  TYPE_PROBLEME_LABEL,
} from "./labels";
import type { AppState, Caisse, OrdreFabrication, Profil, SessionCaisse, StatutOF } from "./types";
import { formatDa, formatDate, formatDateTime, formatQty, num } from "./utils";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "teal";
export type KpiTone = "default" | "warning" | "success" | "danger" | "teal";

export type HomeKpi = { label: string; value: string | number; hint?: string; tone?: KpiTone; href?: string; icon: LucideIcon };
export type HomeTask = { href: string; title: string; detail: string; badge?: { label: string; tone: Tone }; meta?: string };
/** `pinned` : carte toujours affichée, même vide. `wide` : carte sur toute la largeur. */
export type HomeSection = { id: string; title: string; icon: LucideIcon; href: string; total: number; items: HomeTask[]; empty: string; tone?: Tone; pinned?: boolean; wide?: boolean };
export type HomeChart = { title: string; subtitle?: string; href?: string; kind: "donut" | "hbar"; data: ChartPoint[]; centerLabel?: string };
export type HomeAction = { href: string; label: string; icon: LucideIcon };
/** Situation des caisses, affichée en tête de l’accueil caissier. */
export type HomeCash = { principale?: Caisse; maCaisse?: Caisse; session?: SessionCaisse; caisses: Caisse[] };
/** Étape d’une feuille de route (priorités d’action de l’admin). */
export type HomePriority = {
  title: string;
  detail: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  done: number;
  total: number;
  status: "done" | "todo" | "loading";
  /** Éléments restants, affichés en aperçu sous la barre de progression. */
  missing: string[];
};
export type HomeData = {
  actions: HomeAction[];
  kpis: HomeKpi[];
  sections: HomeSection[];
  chart?: HomeChart;
  cash?: HomeCash;
  priorities?: HomePriority[];
  /** false : pas de colonne latérale (accès rapides, repères, graphique). */
  aside?: boolean;
};

export type HomeHelpers = {
  meId: number;
  articleName: (id: number | null | undefined) => string;
  clientName: (id: number | null | undefined) => string;
  userName: (id: number | null | undefined) => string;
};

const MAX_ITEMS = 4;

// ---------- utilitaires de dates et de regroupement ----------

function sameDay(iso: string | null | undefined, ref = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function sameMonth(iso: string | null | undefined, ref = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function isPast(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

function withinDays(iso: string | null | undefined, days: number) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= days * 86_400_000;
}

function byDateDesc<T>(get: (x: T) => string | null | undefined) {
  return (a: T, b: T) => new Date(get(b) ?? 0).getTime() - new Date(get(a) ?? 0).getTime();
}

function countBy<T>(list: T[], key: (x: T) => string, label: (k: string) => string): ChartPoint[] {
  const m = new Map<string, number>();
  list.forEach((x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: label(k), value: v }));
}

function sum<T>(list: T[], get: (x: T) => string | number | null | undefined) {
  return list.reduce((a, x) => a + num(get(x)), 0);
}

function section(s: Omit<HomeSection, "total" | "items"> & { all: HomeTask[] }): HomeSection {
  return { ...s, total: s.all.length, items: s.all.slice(0, MAX_ITEMS) };
}

const OF_TONE: Record<StatutOF, Tone> = {
  BROUILLON: "neutral",
  A_PREPARER: "info",
  MATIERES_EN_PREPARATION: "teal",
  PRET: "teal",
  EN_PRODUCTION: "warning",
  PRODUCTION_TERMINEE: "teal",
  EN_CONTROLE: "info",
  CLOTURE: "success",
  ANNULE: "danger",
};

const OF_EN_AMONT: StatutOF[] = ["BROUILLON", "A_PREPARER", "MATIERES_EN_PREPARATION", "PRET"];

function ofPhase(o: OrdreFabrication) {
  if (OF_EN_AMONT.includes(o.statut)) return "En préparation";
  if (o.statut === "EN_PRODUCTION") return "En production";
  if (o.statut === "PRODUCTION_TERMINEE" || o.statut === "EN_CONTROLE") return "En contrôle";
  if (o.statut === "CLOTURE") return "Clôturés";
  return "Annulés";
}

function ofTask(o: OrdreFabrication, h: HomeHelpers): HomeTask {
  return {
    href: `/production/of/${o.id}`,
    title: o.numero,
    detail: `${h.articleName(o.article)} · ${formatQty(num(o.quantite_a_produire), 0)}`,
    badge: { label: STATUT_OF_LABEL[o.statut], tone: OF_TONE[o.statut] },
  };
}

/** Articles actifs dont le disponible (tous dépôts) passe sous le stock minimum. */
function lowStock(state: AppState) {
  const totals = new Map<number, number>();
  state.stock.forEach((s) => totals.set(s.article, (totals.get(s.article) ?? 0) + stockDisponible(s)));
  return state.articles
    .filter((a) => a.actif && num(a.stock_minimum) > 0 && (totals.get(a.id) ?? 0) < num(a.stock_minimum))
    .map((a) => ({ article: a, dispo: totals.get(a.id) ?? 0, min: num(a.stock_minimum) }))
    .sort((x, y) => x.dispo / x.min - y.dispo / y.min);
}

function lowStockSection(state: AppState): HomeSection {
  return section({
    id: "seuil",
    title: "Articles sous le seuil",
    icon: AlertTriangle,
    href: "/stocks",
    tone: "danger",
    empty: "Tous les articles sont au-dessus du minimum.",
    all: lowStock(state).map(({ article, dispo, min }) => ({
      href: `/stocks/article/${article.id}`,
      title: article.designation,
      detail: `Disponible ${formatQty(dispo, 0)} · minimum ${formatQty(min, 0)}`,
      badge: dispo <= 0 ? { label: "Rupture", tone: "danger" } : { label: "Sous seuil", tone: "warning" },
    })),
  });
}

function ofDonut(list: OrdreFabrication[]): HomeChart {
  return {
    title: "Ordres de fabrication",
    subtitle: "Répartition par étape",
    href: "/production/of",
    kind: "donut",
    centerLabel: "OF",
    data: countBy(list.filter((o) => o.statut !== "ANNULE"), ofPhase, (k) => k),
  };
}

// ---------- contenu par poste ----------

export function homeForRole(role: Profil, state: AppState, h: HomeHelpers): HomeData {
  switch (role) {
    case "ADMIN_SI":
      return admin(state, h);
    case "DIRECTION":
      return direction(state, h);
    case "RESPONSABLE_PRODUCTION":
      return respProduction(state, h);
    case "AGENT_PRODUCTION":
      return agentProduction(state, h);
    case "RESPONSABLE_QUALITE":
      return qualite(state, h);
    case "MAGASINIER":
      return magasinier(state, h);
    case "RESPONSABLE_ACHATS":
      return achats(state, h);
    case "COMMERCIAL":
      return commercial(state, h);
    case "CAISSIER":
      return caissier(state, h);
    case "RESPONSABLE_DISTRIBUTION":
      return distribution(state, h);
    case "CHAUFFEUR":
      return chauffeur(state, h);
    case "COMPTABILITE_DAF":
      return daf(state, h);
  }
}

/** Fiches techniques encore en brouillon (partagé par l’admin et le responsable production). */
function ftBrouillonSection(state: AppState, h: HomeHelpers, title: string, empty: string): HomeSection {
  return section({
    id: "ft",
    title,
    icon: ScrollText,
    href: "/parametrage/fiches-techniques",
    tone: "warning",
    empty,
    all: [...state.fichesTechniques]
      .filter((f) => f.statut === "BROUILLON")
      .sort(byDateDesc((f) => f.date_creation))
      .map((f) => ({
        href: `/parametrage/fiches-techniques/${f.id}`,
        title: h.articleName(f.article),
        detail: `Version ${f.version} · créée par ${h.userName(f.cree_par)}`,
        meta: formatDate(f.date_creation),
        badge: { label: "Brouillon", tone: "neutral" },
      })),
  });
}

function admin(state: AppState, h: HomeHelpers): HomeData {
  // L’admin reçoit d’abord comptes + journal, le reste arrive en arrière-plan. La caisse
  // principale et les dépôts système existant toujours, leur absence signifie « pas encore chargé ».
  const loaded = state.depots.length > 0 || state.caisses.length > 0;
  const wait = (msg: string) => (loaded ? msg : "Chargement…");

  const actifs = state.utilisateurs.filter((u) => u.actif);
  const inactifs = state.utilisateurs.filter((u) => !u.actif);
  const journalToday = state.journal.filter((j) => sameDay(j.date_action));

  const aUneCaisse = (id: number) => state.caisses.some((c) => c.caissier === id && !c.est_principale);
  const aUneFicheChauffeur = (id: number) => state.chauffeurs.some((c) => c.utilisateur === id);
  const caissiersSansCaisse = loaded ? actifs.filter((u) => u.profil === "CAISSIER" && !aUneCaisse(u.id)) : [];
  const incomplets = actifs
    .map((u) => {
      if (!u.profil || !PROFIL_LABEL[u.profil]) return { u, raison: "Sans rôle", href: "/admin/utilisateurs" };
      if (!loaded) return null;
      if (u.profil === "CHAUFFEUR" && !aUneFicheChauffeur(u.id)) return { u, raison: "Sans fiche chauffeur", href: "/admin/utilisateurs" };
      return null;
    })
    .filter((x): x is { u: (typeof actifs)[number]; raison: string; href: string } => x != null);

  // Priorités d’action : comptes + rôle → caisses → fiches techniques des produits finis.
  const profils = Object.keys(PROFIL_LABEL) as Profil[];
  const profilsSansCompte = profils.filter((p) => p !== "ADMIN_SI" && !actifs.some((u) => u.profil === p));
  const sansRole = actifs.filter((u) => !u.profil || !PROFIL_LABEL[u.profil]);
  const caissiers = actifs.filter((u) => u.profil === "CAISSIER");
  const produitsFinis = state.articles.filter((a) => a.type_article === "PRODUIT_FINI" && a.actif);
  const avecFicheValidee = new Set(state.fichesTechniques.filter((f) => f.statut === "VALIDEE").map((f) => f.article));
  const pfSansFiche = produitsFinis.filter((a) => !avecFicheValidee.has(a.id));
  const priorities: HomePriority[] = [
    {
      title: "Créer les comptes et leur rôle",
      detail: profilsSansCompte.length
        ? `${profilsSansCompte.length} poste(s) sans compte actif${sansRole.length ? ` · ${sansRole.length} compte(s) sans rôle` : ""}`
        : sansRole.length
          ? `${sansRole.length} compte(s) sans rôle`
          : "Chaque poste a au moins un compte.",
      href: "/admin/utilisateurs",
      cta: "Créer un compte",
      icon: UserPlus,
      done: profils.length - 1 - profilsSansCompte.length,
      total: profils.length - 1,
      status: profilsSansCompte.length || sansRole.length ? "todo" : "done",
      missing: [...sansRole.map((u) => `${displayName(u)} (sans rôle)`), ...profilsSansCompte.map((p) => PROFIL_LABEL[p])],
    },
    {
      title: "Créer et affecter chaque caisse",
      detail: !loaded
        ? "Chargement…"
        : caissiers.length === 0
          ? "Aucun caissier : créez d’abord un compte Caissier."
          : caissiersSansCaisse.length
            ? `${caissiersSansCaisse.length} caissier(s) sans caisse`
            : "Chaque caissier a sa caisse.",
      href: "/admin/caisses",
      cta: "Affecter une caisse",
      icon: Vault,
      done: caissiers.length - caissiersSansCaisse.length,
      total: caissiers.length,
      status: !loaded ? "loading" : caissiers.length === 0 || caissiersSansCaisse.length ? "todo" : "done",
      missing: [],
    },
    {
      title: "Valider la fiche technique de chaque produit fini",
      detail: !loaded
        ? "Chargement…"
        : produitsFinis.length === 0
          ? "Aucun produit fini créé pour l’instant."
          : pfSansFiche.length
            ? `${pfSansFiche.length} produit(s) fini(s) sans fiche validée`
            : "Tous les produits finis ont une fiche validée.",
      href: "/parametrage/fiches-techniques",
      cta: "Valider les fiches",
      icon: ScrollText,
      done: produitsFinis.length - pfSansFiche.length,
      total: produitsFinis.length,
      status: !loaded ? "loading" : pfSansFiche.length ? "todo" : "done",
      missing: [],
    },
  ];

  const caissesOuvertes = state.caisses.filter((c) => !c.est_principale && c.session_ouverte != null).length;
  const caissesActives = state.caisses.filter((c) => !c.est_principale && c.actif).length;

  return {
    priorities,
    aside: false,
    // Pas de boutons d’en-tête : chaque étape des priorités porte déjà son action.
    actions: [],
    kpis: [
      { label: "Comptes actifs", value: actifs.length, hint: inactifs.length ? `${inactifs.length} compte(s) désactivé(s)` : "Aucun compte désactivé", icon: Users, href: "/admin/utilisateurs" },
      { label: "Sessions de caisse ouvertes", value: loaded ? caissesOuvertes : "…", hint: loaded ? `sur ${caissesActives} caisse(s) active(s)` : "Chargement…", tone: "teal", icon: Vault, href: "/admin/caisses" },
      { label: "Actions aujourd’hui", value: journalToday.length, hint: "Journal d’audit", icon: History, href: "/admin/audit" },
    ],
    sections: [
      ftBrouillonSection(state, h, "Fiches techniques en brouillon", wait("Aucune fiche en brouillon.")),
      section({
        id: "incomplets",
        title: "Comptes sans rôle",
        icon: UserCog,
        href: "/admin/utilisateurs",
        tone: "warning",
        empty: wait("Tous les comptes actifs ont un rôle."),
        all: incomplets.map(({ u, raison, href }) => ({
          href,
          title: displayName(u),
          detail: PROFIL_LABEL[u.profil] ?? "Profil non renseigné",
          badge: { label: raison, tone: "warning" },
        })),
      }),
      section({
        id: "caissiers",
        title: "Caissiers sans caisse",
        icon: Vault,
        href: "/admin/caisses",
        tone: "danger",
        empty: wait("Chaque caissier a sa caisse."),
        all: caissiersSansCaisse.map((u) => ({
          href: "/admin/caisses",
          title: displayName(u),
          detail: "Ne peut ouvrir aucune session de caisse",
          badge: { label: "À affecter", tone: "danger" },
        })),
      }),
      section({
        id: "journal",
        title: "Activité récente",
        wide: true,
        pinned: true,
        icon: History,
        href: "/admin/audit",
        empty: "Aucune action enregistrée.",
        all: [...state.journal].sort(byDateDesc((j) => j.date_action)).map((j) => ({
          href: "/admin/audit",
          title: j.action || "Action",
          detail: [h.userName(j.utilisateur), j.document_type, j.document_id].filter(Boolean).join(" · "),
          meta: formatDateTime(j.date_action),
        })),
      }),
    ],
  };
}

function direction(state: AppState, h: HomeHelpers): HomeData {
  const ofCours = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const lotsWait = state.lots.filter((l) => l.statut === "EN_ATTENTE");
  const encJour = sum(state.encaissements.filter((e) => sameDay(e.date_encaissement)), (e) => e.montant);
  const encMois = sum(state.encaissements.filter((e) => sameMonth(e.date_encaissement)), (e) => e.montant);
  const anomalies = state.anomalies.filter((a) => a.statut === "DETECTEE" || a.statut === "EN_TRAITEMENT");
  const decAutoriser = state.decaissements.filter((d) => d.statut === "EN_ATTENTE").length;
  return {
    // Seule action en tête : les décaissements en attente, quand il y en a.
    actions: decAutoriser ? [{ href: "/caisse/decaissements", label: `Décaissements à autoriser (${decAutoriser})`, icon: HandCoins }] : [],
    kpis: [
      { label: "Encaissé aujourd’hui", value: formatDa(encJour), hint: `${formatDa(encMois)} ce mois`, tone: "success", icon: Wallet },
      { label: "OF en cours", value: ofCours.length, hint: `${ofCours.filter((o) => o.statut === "EN_PRODUCTION").length} en production`, icon: ClipboardList },
      { label: "Lots en attente", value: lotsWait.length, hint: "Contrôle qualité", tone: lotsWait.length ? "warning" : "success", icon: FlaskConical, href: "/production/qualite" },
      { label: "Anomalies ouvertes", value: anomalies.length, tone: anomalies.length ? "danger" : "success", icon: BadgeAlert, href: "/comptabilite/brouillards" },
    ],
    sections: [
      section({
        id: "lots",
        title: "Lots à libérer",
        icon: FlaskConical,
        href: "/production/qualite",
        tone: "warning",
        empty: "Aucun lot en attente.",
        all: lotsWait.map((l) => ({
          href: `/production/qualite/${l.id}`,
          title: l.numero_lot,
          detail: `${h.articleName(l.article)} · ${formatQty(num(l.quantite), 0)}`,
          meta: formatDate(l.date_production),
        })),
      }),
      section({
        id: "prod",
        title: "OF en production",
        icon: ClipboardList,
        href: "/production/of",
        empty: "Aucun OF en production.",
        all: ofCours.filter((o) => o.statut === "EN_PRODUCTION").map((o) => ofTask(o, h)),
      }),
      lowStockSection(state),
      section({
        id: "anomalies",
        title: "Anomalies ouvertes",
        icon: BadgeAlert,
        href: "/comptabilite/brouillards",
        tone: "danger",
        empty: "Aucune anomalie ouverte.",
        all: anomalies.map((a) => ({
          href: "/comptabilite/brouillards",
          title: TYPE_ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie,
          detail: a.description,
          meta: formatDate(a.date_detection),
        })),
      }),
    ],
    chart: ofDonut(state.ofList),
  };
}

function respProduction(state: AppState, h: HomeHelpers): HomeData {
  const ofCours = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const enProd = ofCours.filter((o) => o.statut === "EN_PRODUCTION");
  const amont = ofCours.filter((o) => OF_EN_AMONT.includes(o.statut));
  const plans = state.plans.filter((p) => p.statut === "A_CONVERTIR_EN_OF" || p.statut === "PREVISION");
  const matieres = state.demandesMatieres.filter((d) => d.statut === "A_PREPARER" || d.statut === "PARTIELLEMENT_PREPAREE" || d.statut === "PREPAREE");
  const pertesJour = state.pertes.filter((p) => sameDay(p.date_constat));
  const ofOrder = (o: OrdreFabrication) => ["EN_PRODUCTION", "PRET", "MATIERES_EN_PREPARATION", "A_PREPARER", "BROUILLON", "PRODUCTION_TERMINEE", "EN_CONTROLE"].indexOf(o.statut);
  return {
    actions: [
      { href: "/production/planning", label: "Planifier", icon: CalendarDays },
      { href: "/production/of", label: "Ordres de fabrication", icon: ClipboardList },
    ],
    kpis: [
      { label: "OF en production", value: enProd.length, hint: `${ofCours.length} OF ouverts`, tone: "teal", icon: ClipboardList, href: "/production/of" },
      { label: "OF à lancer", value: amont.length, hint: "Brouillon → prêt", tone: amont.length ? "warning" : "default", icon: ListChecks, href: "/production/of" },
      { label: "Plans à convertir", value: plans.length, icon: CalendarDays, href: "/production/planning" },
      { label: "Pertes du jour", value: formatQty(sum(pertesJour, (p) => p.quantite_perte), 0), hint: `${pertesJour.length} déclaration(s)`, tone: pertesJour.length ? "danger" : "success", icon: TrendingDown, href: "/production/pertes" },
    ],
    sections: [
      section({
        id: "of",
        title: "OF ouverts",
        icon: ClipboardList,
        href: "/production/of",
        empty: "Aucun OF ouvert.",
        all: [...ofCours].sort((a, b) => ofOrder(a) - ofOrder(b)).map((o) => ofTask(o, h)),
      }),
      section({
        id: "plans",
        title: "Plans à convertir en OF",
        icon: CalendarDays,
        href: "/production/planning",
        empty: "Aucun plan en attente.",
        all: [...plans]
          .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
          .map((p) => ({
            href: "/production/planning",
            title: h.articleName(p.article),
            detail: `${formatQty(num(p.quantite_prevue), 0)} prévus le ${formatDate(p.date_prevue)}`,
            badge: { label: p.priorite === "URGENTE" || p.priorite === "HAUTE" ? p.priorite === "URGENTE" ? "Urgent" : "Prioritaire" : STATUT_PLAN_LABEL[p.statut], tone: p.priorite === "URGENTE" ? "danger" : p.priorite === "HAUTE" ? "warning" : "neutral" },
          })),
      }),
      section({
        id: "matieres",
        title: "Matières demandées au magasin",
        icon: PackageMinus,
        href: "/production/demandes-matieres",
        empty: "Aucune demande en cours.",
        all: matieres.map((d) => ({
          href: "/production/demandes-matieres",
          title: d.numero,
          detail: `${h.articleName(d.matiere)} · ${formatQty(num(d.quantite_demandee), 2)}`,
          badge: { label: STATUT_DEMANDE_MATIERE_LABEL[d.statut], tone: d.statut === "PREPAREE" ? "teal" : "info" },
        })),
      }),
      ftBrouillonSection(state, h, "Fiches techniques à valider", "Toutes les fiches sont validées."),
    ],
    chart: ofDonut(state.ofList),
  };
}

function agentProduction(state: AppState, h: HomeHelpers): HomeData {
  // Le backend ne renvoie à l’agent que les OF auxquels il est affecté.
  const enProd = state.ofList.filter((o) => o.statut === "EN_PRODUCTION");
  const prets = state.ofList.filter((o) => o.statut === "PRET");
  const etapesJour = state.etapes.filter((e) => e.agent === h.meId && (sameDay(e.date_debut) || sameDay(e.date_fin)));
  const pertesJour = state.pertes.filter((p) => sameDay(p.date_constat));
  return {
    actions: [
      { href: "/production/suivi", label: "Saisir une étape", icon: ListChecks },
      { href: "/production/pertes", label: "Déclarer une perte", icon: TrendingDown },
    ],
    kpis: [
      { label: "OF en production", value: enProd.length, tone: "teal", icon: ClipboardList, href: "/production/of" },
      { label: "OF prêts à démarrer", value: prets.length, tone: prets.length ? "warning" : "default", icon: PackageCheck, href: "/production/of" },
      { label: "Mes étapes du jour", value: etapesJour.length, icon: ListChecks, href: "/production/suivi" },
      { label: "Pertes du jour", value: formatQty(sum(pertesJour, (p) => p.quantite_perte), 0), tone: pertesJour.length ? "danger" : "success", icon: TrendingDown, href: "/production/pertes" },
    ],
    sections: [
      section({ id: "prod", title: "En production", icon: ClipboardList, href: "/production/suivi", empty: "Aucun OF en production.", all: enProd.map((o) => ofTask(o, h)) }),
      section({ id: "prets", title: "Prêts à démarrer", icon: PackageCheck, href: "/production/of", empty: "Aucun OF prêt.", all: prets.map((o) => ofTask(o, h)) }),
    ],
    chart: {
      title: "Pertes par motif",
      subtitle: "Sur vos OF",
      href: "/production/pertes",
      kind: "hbar",
      data: countBy(state.pertes, (p) => p.motif, (k) => MOTIF_PERTE_LABEL[k as keyof typeof MOTIF_PERTE_LABEL] ?? k),
    },
  };
}

function qualite(state: AppState, h: HomeHelpers): HomeData {
  const lotsWait = state.lots.filter((l) => l.statut === "EN_ATTENTE");
  const ofRecus = state.ofList.filter((o) => o.statut === "PRODUCTION_TERMINEE" || o.statut === "EN_CONTROLE");
  const bloques = state.lots.filter((l) => l.statut === "BLOQUE" || l.statut === "NON_CONFORME");
  const controlesJour = state.controles.filter((c) => sameDay(c.date_controle));
  const quarantaine = state.retoursPhysiques.filter((r) => r.statut === "EN_QUARANTAINE");
  return {
    actions: [
      { href: "/production/qualite/of", label: "OF reçus", icon: Inbox },
      { href: "/production/qualite", label: "Lots qualité", icon: FlaskConical },
    ],
    kpis: [
      { label: "Lots en attente", value: lotsWait.length, tone: lotsWait.length ? "warning" : "success", icon: FlaskConical, href: "/production/qualite" },
      { label: "OF à contrôler", value: ofRecus.length, icon: Inbox, href: "/production/qualite/of" },
      { label: "Contrôles du jour", value: controlesJour.length, hint: `${controlesJour.filter((c) => c.resultat === "CONFORME").length} conforme(s)`, tone: "teal", icon: ClipboardCheck },
      { label: "Lots bloqués", value: bloques.length, hint: "Bloqués ou non conformes", tone: bloques.length ? "danger" : "success", icon: Ban, href: "/production/qualite" },
    ],
    sections: [
      section({
        id: "lots",
        title: "Lots à contrôler",
        icon: FlaskConical,
        href: "/production/qualite",
        tone: "warning",
        empty: "Aucun lot en attente.",
        all: lotsWait.map((l) => ({
          href: `/production/qualite/${l.id}`,
          title: l.numero_lot,
          detail: `${h.articleName(l.article)} · ${formatQty(num(l.quantite), 0)}`,
          meta: formatDate(l.date_production),
        })),
      }),
      section({ id: "of", title: "OF reçus de la production", icon: Inbox, href: "/production/qualite/of", empty: "Aucun OF à contrôler.", all: ofRecus.map((o) => ofTask(o, h)) }),
      section({
        id: "bloques",
        title: "Lots bloqués ou non conformes",
        icon: Ban,
        href: "/production/qualite",
        tone: "danger",
        empty: "Aucun lot bloqué.",
        all: bloques.map((l) => ({
          href: `/production/qualite/${l.id}`,
          title: l.numero_lot,
          detail: h.articleName(l.article),
          badge: { label: STATUT_LOT_LABEL[l.statut], tone: "danger" },
        })),
      }),
      section({
        id: "retours",
        title: "Retours clients en quarantaine",
        icon: MessageSquareWarning,
        href: "/reclamations",
        empty: "Aucun retour en quarantaine.",
        all: quarantaine.map((r) => ({
          href: `/reclamations/${r.reclamation}`,
          title: `Retour n°${r.id}`,
          detail: `${formatQty(num(r.quantite_retournee), 0)} retourné(s)`,
          badge: { label: "Quarantaine", tone: "warning" },
        })),
      }),
    ],
    chart: {
      title: "Lots par statut",
      href: "/production/qualite",
      kind: "donut",
      centerLabel: "lots",
      data: countBy(state.lots, (l) => l.statut, (k) => STATUT_LOT_LABEL[k as keyof typeof STATUT_LOT_LABEL] ?? k),
    },
  };
}

function magasinier(state: AppState, h: HomeHelpers): HomeData {
  const aServir = state.demandesMatieres.filter((d) => d.statut === "A_PREPARER" || d.statut === "PARTIELLEMENT_PREPAREE");
  const preps = state.preparations.filter((p) => p.statut === "A_PREPARER" || p.statut === "EN_PREPARATION");
  const attendues = state.commandesFournisseur.filter((c) => c.statut === "ENVOYEE" || c.statut === "PARTIELLEMENT_RECUE");
  const seuil = lowStock(state);
  const inventaires = state.inventaires.filter((i) => i.statut === "EN_COURS");
  const cmdNumero = (id: number) => state.commandes.find((c) => c.id === id)?.numero ?? `Commande n°${id}`;
  const depotNom = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `Dépôt n°${id}`;
  return {
    actions: [
      { href: "/production/demandes-matieres", label: "Servir l’atelier", icon: PackageMinus },
      { href: "/stocks/mouvements", label: "Mouvements", icon: ArrowLeftRight },
    ],
    kpis: [
      { label: "Matières à servir", value: aServir.length, tone: aServir.length ? "warning" : "success", icon: PackageMinus, href: "/production/demandes-matieres" },
      { label: "Préparations clients", value: preps.length, tone: preps.length ? "warning" : "default", icon: PackageOpen, href: "/distribution/preparations" },
      { label: "Réceptions attendues", value: attendues.length, icon: Truck, href: "/approvisionnement/receptions" },
      { label: "Articles sous seuil", value: seuil.length, tone: seuil.length ? "danger" : "success", icon: AlertTriangle, href: "/stocks" },
    ],
    sections: [
      section({
        id: "matieres",
        title: "Matières à servir à l’atelier",
        icon: PackageMinus,
        href: "/production/demandes-matieres",
        tone: "warning",
        empty: "Aucune demande de l’atelier.",
        all: aServir.map((d) => ({
          href: "/production/demandes-matieres",
          title: d.numero,
          detail: `${h.articleName(d.matiere)} · ${formatQty(num(d.quantite_demandee), 2)}`,
          badge: { label: STATUT_DEMANDE_MATIERE_LABEL[d.statut], tone: "info" },
        })),
      }),
      section({
        id: "preps",
        title: "Préparations de commandes",
        icon: PackageOpen,
        href: "/distribution/preparations",
        empty: "Aucune préparation en cours.",
        all: preps.map((p) => ({
          href: `/distribution/preparations/${p.id}`,
          title: `Préparation n°${p.id}`,
          detail: cmdNumero(p.commande),
          badge: { label: STATUT_PREP_LABEL[p.statut], tone: p.statut === "EN_PREPARATION" ? "warning" : "info" },
        })),
      }),
      section({
        id: "receptions",
        title: "Livraisons fournisseurs attendues",
        icon: Truck,
        href: "/approvisionnement/receptions",
        empty: "Aucune livraison attendue.",
        all: attendues.map((c) => ({
          href: "/approvisionnement/receptions",
          title: c.numero,
          detail: `Commandée le ${formatDate(c.date_commande)}`,
          badge: { label: STATUT_CF_LABEL[c.statut], tone: c.statut === "PARTIELLEMENT_RECUE" ? "warning" : "info" },
        })),
      }),
      lowStockSection(state),
      ...(inventaires.length
        ? [
            section({
              id: "inv",
              title: "Inventaires en cours",
              icon: ClipboardCheck,
              href: "/stocks/inventaires",
              empty: "",
              all: inventaires.map((i) => ({ href: `/stocks/inventaires/${i.id}`, title: depotNom(i.depot), detail: `Ouvert le ${formatDate(i.date_inventaire)}` })),
            }),
          ]
        : []),
    ],
    chart: {
      title: "Mouvements de stock",
      subtitle: "7 derniers jours",
      href: "/stocks/mouvements",
      kind: "donut",
      centerLabel: "mvts",
      data: countBy(state.mouvements.filter((m) => withinDays(m.date_mouvement, 7)), (m) => m.type_mouvement, (k) => TYPE_MVT_LABEL[k as keyof typeof TYPE_MVT_LABEL] ?? k),
    },
  };
}

function achats(state: AppState, h: HomeHelpers): HomeData {
  const daWait = state.demandesAchat.filter((d) => d.statut === "EN_ATTENTE");
  const besoins = state.besoinsAchat.filter((b) => !b.satisfait);
  const brouillons = state.commandesFournisseur.filter((c) => c.statut === "BROUILLON");
  const attendues = state.commandesFournisseur.filter((c) => c.statut === "ENVOYEE" || c.statut === "PARTIELLEMENT_RECUE");
  const fournisseur = (id: number) => state.fournisseurs.find((f) => f.id === id)?.nom ?? `Fournisseur n°${id}`;
  return {
    actions: [
      { href: "/approvisionnement/demandes", label: "Demandes d’achat", icon: FileText },
      { href: "/approvisionnement/commandes", label: "Commandes fournisseurs", icon: ShoppingCart },
    ],
    kpis: [
      { label: "Demandes à approuver", value: daWait.length, tone: daWait.length ? "warning" : "success", icon: FileText, href: "/approvisionnement/demandes" },
      { label: "Besoins à couvrir", value: besoins.length, icon: ListTodo, href: "/approvisionnement/besoins" },
      { label: "Commandes à envoyer", value: brouillons.length, tone: brouillons.length ? "warning" : "default", icon: ShoppingCart, href: "/approvisionnement/commandes" },
      { label: "Livraisons attendues", value: attendues.length, tone: "teal", icon: Truck, href: "/approvisionnement/receptions" },
    ],
    sections: [
      section({
        id: "da",
        title: "Demandes en attente d’approbation",
        icon: FileText,
        href: "/approvisionnement/demandes",
        tone: "warning",
        empty: "Aucune demande en attente.",
        all: daWait.map((d) => ({
          href: "/approvisionnement/demandes",
          title: `Demande n°${d.id}`,
          detail: `${h.articleName(d.article)} · ${formatQty(num(d.quantite_demandee), 2)}`,
          meta: `par ${h.userName(d.demandeur)}`,
        })),
      }),
      section({
        id: "besoins",
        title: "Besoins non couverts",
        icon: ListTodo,
        href: "/approvisionnement/besoins",
        empty: "Tous les besoins sont couverts.",
        all: besoins.map((b) => ({
          href: "/approvisionnement/besoins",
          title: h.articleName(b.article),
          detail: `${formatQty(num(b.quantite_besoin), 2)} à couvrir`,
          badge: { label: b.origine === "AUTO_PRODUCTION" ? "Production" : "Manuel", tone: "neutral" },
        })),
      }),
      section({
        id: "brouillons",
        title: "Commandes prêtes à envoyer",
        icon: ShoppingCart,
        href: "/approvisionnement/commandes",
        empty: "Aucune commande en brouillon.",
        all: brouillons.map((c) => ({ href: "/approvisionnement/commandes", title: c.numero, detail: fournisseur(c.fournisseur), badge: { label: "Brouillon", tone: "neutral" } })),
      }),
      section({
        id: "attendues",
        title: "Livraisons attendues",
        icon: Truck,
        href: "/approvisionnement/receptions",
        empty: "Aucune livraison attendue.",
        all: attendues.map((c) => ({
          href: "/approvisionnement/receptions",
          title: c.numero,
          detail: `${fournisseur(c.fournisseur)} · commandée le ${formatDate(c.date_commande)}`,
          badge: { label: STATUT_CF_LABEL[c.statut], tone: c.statut === "PARTIELLEMENT_RECUE" ? "warning" : "info" },
        })),
      }),
      lowStockSection(state),
    ],
    chart: {
      title: "Commandes fournisseurs",
      subtitle: "Par statut",
      href: "/approvisionnement/commandes",
      kind: "donut",
      centerLabel: "cmd.",
      data: countBy(state.commandesFournisseur, (c) => c.statut, (k) => STATUT_CF_LABEL[k as keyof typeof STATUT_CF_LABEL] ?? k),
    },
  };
}

function commercial(state: AppState, h: HomeHelpers): HomeData {
  const brouillons = state.commandes.filter((c) => c.statut === "BROUILLON");
  const impayees = state.factures.filter((f) => f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE");
  const echues = impayees.filter((f) => isPast(f.date_echeance));
  const caMois = sum(state.factures.filter((f) => f.statut !== "ANNULEE" && sameMonth(f.date_emission)), (f) => f.montant_total);
  const reclamations = state.reclamations.filter((r) => r.statut !== "CLOTUREE");
  const bloques = state.clients.filter((c) => c.bloque);
  return {
    actions: [
      { href: "/commercial/commandes/nouvelle", label: "Nouvelle commande", icon: FilePlus2 },
      { href: "/commercial/clients", label: "Clients", icon: Users },
    ],
    kpis: [
      { label: "Facturé ce mois", value: formatDa(caMois), tone: "success", icon: Receipt, href: "/caisse" },
      { label: "Commandes à valider", value: brouillons.length, tone: brouillons.length ? "warning" : "default", icon: ClipboardList, href: "/commercial/commandes" },
      { label: "Factures non payées", value: impayees.length, hint: formatDa(sum(impayees, (f) => f.montant_total)), icon: Wallet, href: "/caisse" },
      { label: "Factures échues", value: echues.length, tone: echues.length ? "danger" : "success", icon: CalendarClock, href: "/commercial/impayes" },
    ],
    sections: [
      section({
        id: "brouillons",
        title: "Commandes en brouillon",
        icon: ClipboardList,
        href: "/commercial/commandes",
        tone: "warning",
        empty: "Aucune commande à valider.",
        all: brouillons.map((c) => ({
          href: `/commercial/commandes/${c.id}`,
          title: c.numero,
          detail: h.clientName(c.client),
          meta: formatDate(c.date_commande),
          badge: { label: STATUT_CMD_LABEL[c.statut], tone: "neutral" },
        })),
      }),
      section({
        id: "echues",
        title: "Factures échues",
        icon: CalendarClock,
        href: "/commercial/impayes",
        tone: "danger",
        empty: "Aucune facture en retard.",
        all: echues.map((f) => ({
          href: "/commercial/impayes",
          title: f.numero,
          detail: `${h.clientName(f.client)} · ${formatDa(num(f.montant_total))}`,
          badge: { label: `Échue le ${formatDate(f.date_echeance ?? "")}`, tone: "danger" },
        })),
      }),
      section({
        id: "reclamations",
        title: "Réclamations ouvertes",
        icon: MessageSquareWarning,
        href: "/reclamations",
        empty: "Aucune réclamation ouverte.",
        all: reclamations.map((r) => ({
          href: `/reclamations/${r.id}`,
          title: r.numero,
          detail: `${h.clientName(r.client)} · ${TYPE_PROBLEME_LABEL[r.type_probleme] ?? r.type_probleme}`,
          badge: { label: STATUT_RECLAMATION_LABEL[r.statut], tone: r.statut === "OUVERTE" ? "warning" : "info" },
        })),
      }),
      section({
        id: "bloques",
        title: "Clients bloqués",
        icon: Ban,
        href: "/commercial/clients",
        empty: "Aucun client bloqué.",
        all: bloques.map((c) => ({ href: "/commercial/clients", title: c.nom, detail: c.code, badge: { label: "Bloqué", tone: "danger" } })),
      }),
    ],
    chart: {
      title: "Commandes par statut",
      href: "/commercial/commandes",
      kind: "donut",
      centerLabel: "cmd.",
      data: countBy(state.commandes.filter((c) => c.statut !== "ANNULEE"), (c) => c.statut, (k) => STATUT_CMD_LABEL[k as keyof typeof STATUT_CMD_LABEL] ?? k),
    },
  };
}

function caissier(state: AppState, h: HomeHelpers): HomeData {
  // Uniquement la session du caissier connecté : celle d’un collègue ne lui permet pas d’encaisser.
  const session = state.sessionsCaisse.find((s) => s.statut === "OUVERTE" && s.caissier === h.meId);
  const principale = state.caisses.find((c) => c.est_principale);
  const maCaisse = state.caisses.find((c) => c.caissier === h.meId);
  const aEncaisser = state.factures.filter((f) => f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE");
  const encJour = state.encaissements.filter((e) => sameDay(e.date_encaissement));
  const decJour = state.decaissements.filter((d) => sameDay(d.date_decaissement));
  const ecarts = state.ecartsCaisse.filter((e) => !e.justification?.trim());
  const factureNum = (id: number) => state.factures.find((f) => f.id === id)?.numero ?? `Facture n°${id}`;
  return {
    cash: { principale, maCaisse, session, caisses: state.caisses.filter((c) => c.actif && !c.est_principale) },
    actions: session
      ? [
          { href: "/caisse", label: "Encaisser", icon: Wallet },
          { href: "/caisse/cloture", label: "Clôturer la session", icon: Vault },
        ]
      : [{ href: "/caisse/cloture", label: "Ouvrir une session", icon: Vault }],
    kpis: [
      {
        label: "Session de caisse",
        value: session ? "Ouverte" : "Fermée",
        hint: session ? `Solde ${formatDa(num(session.solde_theorique_actuel ?? session.solde_ouverture))}` : "Ouvrez une session pour encaisser",
        tone: session ? "success" : "warning",
        icon: Vault,
        href: "/caisse/cloture",
      },
      { label: "Factures à encaisser", value: aEncaisser.length, hint: formatDa(sum(aEncaisser, (f) => f.montant_total)), tone: aEncaisser.length ? "warning" : "default", icon: Receipt, href: "/caisse" },
      { label: "Encaissé aujourd’hui", value: formatDa(sum(encJour, (e) => e.montant)), hint: `${encJour.length} encaissement(s)`, tone: "teal", icon: Wallet },
      { label: "Décaissé aujourd’hui", value: formatDa(sum(decJour, (d) => d.montant)), hint: `${decJour.length} sortie(s)`, icon: HandCoins, href: "/caisse/decaissements" },
    ],
    sections: [
      section({
        id: "factures",
        title: "Factures à encaisser",
        icon: Receipt,
        href: "/caisse",
        tone: "warning",
        empty: "Aucune facture en attente.",
        all: [...aEncaisser].sort(byDateDesc((f) => f.date_emission)).map((f) => ({
          href: `/caisse/encaissement/${f.id}`,
          title: f.numero,
          detail: `${h.clientName(f.client)} · ${formatDa(num(f.montant_total))}`,
          badge: f.statut === "PARTIELLEMENT_PAYEE" ? { label: "Partiel", tone: "warning" } : undefined,
        })),
      }),
      section({
        id: "enc",
        title: "Encaissements du jour",
        icon: Wallet,
        href: "/caisse/cloture",
        empty: "Aucun encaissement aujourd’hui.",
        all: [...encJour].sort(byDateDesc((e) => e.date_encaissement)).map((e) => ({
          href: "/caisse/cloture",
          title: e.numero,
          detail: `${factureNum(e.facture)} · ${formatDa(num(e.montant))}`,
          badge: { label: MODE_PAIEMENT_LABEL[e.mode_paiement], tone: "teal" },
        })),
      }),
      ...(ecarts.length
        ? [
            section({
              id: "ecarts",
              title: "Écarts à justifier",
              icon: AlertTriangle,
              href: "/caisse/cloture",
              tone: "danger",
              empty: "",
              all: ecarts.map((e) => ({ href: "/caisse/cloture", title: `Session n°${e.session_caisse}`, detail: `Écart ${formatDa(num(e.montant_ecart))}`, badge: { label: "À justifier", tone: "danger" } })),
            }),
          ]
        : []),
    ],
    chart: {
      title: "Encaissements du jour",
      subtitle: "Par mode de paiement",
      kind: "donut",
      centerLabel: "enc.",
      data: countBy(encJour, (e) => e.mode_paiement, (k) => MODE_PAIEMENT_LABEL[k as keyof typeof MODE_PAIEMENT_LABEL] ?? k),
    },
  };
}

function distribution(state: AppState, h: HomeHelpers): HomeData {
  const avecPrep = new Set(state.preparations.map((p) => p.commande));
  const aLancer = state.commandes.filter((c) => c.statut === "VALIDEE" && !avecPrep.has(c.id));
  const enCours = state.preparations.filter((p) => p.statut === "A_PREPARER" || p.statut === "EN_PREPARATION");
  const pretes = state.preparations.filter((p) => p.statut === "PRETE");
  const enLivraison = state.bonsLivraison.filter((b) => b.statut === "EN_LIVRAISON");
  const tourneesJour = state.tournees.filter((t) => sameDay(t.date_tournee));
  const reclamations = state.reclamations.filter((r) => r.statut !== "CLOTUREE");
  const cmd = (id: number) => state.commandes.find((c) => c.id === id);
  const vehicule = (id: number) => state.vehicules.find((v) => v.id === id)?.immatriculation ?? `Véhicule n°${id}`;
  const chauffeurNom = (id: number) => h.userName(state.chauffeurs.find((c) => c.id === id)?.utilisateur);
  return {
    actions: [
      { href: "/distribution/preparations", label: "Préparations", icon: PackageOpen },
      { href: "/distribution/tournees", label: "Tournées", icon: Route },
    ],
    kpis: [
      { label: "Commandes à lancer", value: aLancer.length, tone: aLancer.length ? "warning" : "success", icon: ClipboardList, href: "/commercial/commandes" },
      { label: "Préparations en cours", value: enCours.length, icon: PackageOpen, href: "/distribution/preparations" },
      { label: "Prêtes à sortir", value: pretes.length, tone: pretes.length ? "teal" : "default", icon: PackageCheck, href: "/distribution/preparations" },
      { label: "En livraison", value: enLivraison.length, hint: `${tourneesJour.length} tournée(s) aujourd’hui`, icon: Truck, href: "/distribution/bl" },
    ],
    sections: [
      section({
        id: "lancer",
        title: "Commandes validées à préparer",
        icon: ClipboardList,
        href: "/distribution/preparations",
        tone: "warning",
        empty: "Toutes les commandes validées sont lancées.",
        all: aLancer.map((c) => ({ href: `/commercial/commandes/${c.id}`, title: c.numero, detail: h.clientName(c.client), meta: formatDate(c.date_commande) })),
      }),
      section({
        id: "preps",
        title: "Préparations",
        icon: PackageOpen,
        href: "/distribution/preparations",
        empty: "Aucune préparation en cours.",
        all: [...pretes, ...enCours].map((p) => ({
          href: `/distribution/preparations/${p.id}`,
          title: cmd(p.commande)?.numero ?? `Préparation n°${p.id}`,
          detail: h.clientName(cmd(p.commande)?.client),
          badge: { label: STATUT_PREP_LABEL[p.statut], tone: p.statut === "PRETE" ? "teal" : p.statut === "EN_PREPARATION" ? "warning" : "info" },
        })),
      }),
      section({
        id: "bl",
        title: "Livraisons en cours",
        icon: Truck,
        href: "/distribution/bl",
        empty: "Aucune livraison en cours.",
        all: enLivraison.map((b) => ({ href: `/distribution/bl/${b.id}`, title: b.numero, detail: h.clientName(cmd(b.commande)?.client), badge: { label: STATUT_BL_LABEL[b.statut], tone: "info" } })),
      }),
      section({
        id: "tournees",
        title: "Tournées du jour",
        icon: Route,
        href: "/distribution/tournees",
        empty: "Aucune tournée prévue aujourd’hui.",
        all: tourneesJour.map((t) => ({ href: "/distribution/tournees", title: t.numero, detail: `${chauffeurNom(t.chauffeur)} · ${vehicule(t.vehicule)}` })),
      }),
      ...(reclamations.length
        ? [
            section({
              id: "reclamations",
              title: "Réclamations ouvertes",
              icon: MessageSquareWarning,
              href: "/reclamations",
              empty: "",
              all: reclamations.map((r) => ({ href: `/reclamations/${r.id}`, title: r.numero, detail: h.clientName(r.client), badge: { label: STATUT_RECLAMATION_LABEL[r.statut], tone: "warning" } })),
            }),
          ]
        : []),
    ],
    chart: {
      title: "Bons de livraison",
      subtitle: "Par statut",
      href: "/distribution/bl",
      kind: "donut",
      centerLabel: "BL",
      data: countBy(state.bonsLivraison, (b) => b.statut, (k) => STATUT_BL_LABEL[k as keyof typeof STATUT_BL_LABEL] ?? k),
    },
  };
}

function chauffeur(state: AppState, h: HomeHelpers): HomeData {
  const mesIds = new Set(state.chauffeurs.filter((c) => c.utilisateur === h.meId).map((c) => c.id));
  // Le backend filtre déjà les tournées du chauffeur ; on garde tout si l’association n’est pas chargée.
  const tournees = mesIds.size ? state.tournees.filter((t) => mesIds.has(t.chauffeur)) : state.tournees;
  const mesTournees = new Set(tournees.map((t) => t.id));
  const bls = state.bonsLivraison.filter((b) => b.tournee == null || mesTournees.has(b.tournee));
  const aLivrer = bls.filter((b) => b.statut === "EN_LIVRAISON");
  const livresJour = bls.filter((b) => b.statut === "LIVREE" && sameDay(b.date_livraison));
  const aVenir = tournees.filter((t) => sameDay(t.date_tournee) || !isPast(t.date_tournee)).sort((a, b) => new Date(a.date_tournee).getTime() - new Date(b.date_tournee).getTime());
  return {
    actions: [
      { href: "/distribution/bl", label: "Mes bons de livraison", icon: Truck },
      { href: "/distribution/tournees", label: "Mes tournées", icon: Route },
    ],
    kpis: [
      { label: "Tournées du jour", value: tournees.filter((t) => sameDay(t.date_tournee)).length, tone: "teal", icon: Route, href: "/distribution/tournees" },
      { label: "BL à livrer", value: aLivrer.length, tone: aLivrer.length ? "warning" : "success", icon: Truck, href: "/distribution/bl" },
      { label: "Livrés aujourd’hui", value: livresJour.length, tone: "success", icon: PackageCheck },
    ],
    sections: [
      section({
        id: "bl",
        title: "Bons à livrer",
        icon: Truck,
        href: "/distribution/bl",
        tone: "warning",
        empty: "Aucune livraison en attente.",
        all: aLivrer.map((b) => ({ href: `/distribution/bl/${b.id}`, title: b.numero, detail: `Généré le ${formatDate(b.date_generation)}`, badge: { label: STATUT_BL_LABEL[b.statut], tone: "info" } })),
      }),
      section({
        id: "tournees",
        title: "Tournées à venir",
        icon: Route,
        href: "/distribution/tournees",
        empty: "Aucune tournée planifiée.",
        all: aVenir.map((t) => ({
          href: "/distribution/tournees",
          title: t.numero,
          detail: formatDate(t.date_tournee),
          badge: sameDay(t.date_tournee) ? { label: "Aujourd’hui", tone: "teal" } : undefined,
        })),
      }),
    ],
  };
}

function daf(state: AppState, h: HomeHelpers): HomeData {
  const anomalies = state.anomalies.filter((a) => a.statut === "DETECTEE" || a.statut === "EN_TRAITEMENT");
  const impayees = state.factures.filter((f) => f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE");
  const echues = impayees.filter((f) => isPast(f.date_echeance));
  const encMois = sum(state.encaissements.filter((e) => sameMonth(e.date_encaissement)), (e) => e.montant);
  const derniereCloture = [...state.clotures].sort(byDateDesc((c) => c.date_cloture))[0];
  const ecarts = state.ecartsCaisse.filter((e) => e.valide_par == null);
  return {
    actions: [
      { href: "/comptabilite/export-sage", label: "Exports comptables", icon: FileOutput },
      { href: "/comptabilite/clotures", label: "Clôtures", icon: Lock },
    ],
    kpis: [
      { label: "Anomalies à traiter", value: anomalies.length, tone: anomalies.length ? "danger" : "success", icon: AlertTriangle, href: "/comptabilite/brouillards" },
      { label: "Encaissé ce mois", value: formatDa(encMois), tone: "success", icon: Wallet },
      { label: "Factures impayées", value: impayees.length, hint: `${formatDa(sum(impayees, (f) => f.montant_total))} · ${echues.length} échue(s)`, tone: echues.length ? "warning" : "default", icon: CalendarClock, href: "/commercial/impayes" },
      { label: "Dernière clôture", value: derniereCloture?.periode ?? "—", hint: derniereCloture ? formatDate(derniereCloture.date_cloture) : "Aucune période clôturée", icon: Lock, href: "/comptabilite/clotures" },
    ],
    sections: [
      section({
        id: "anomalies",
        title: "Anomalies à traiter",
        icon: AlertTriangle,
        href: "/comptabilite/brouillards",
        tone: "danger",
        empty: "Aucune anomalie ouverte.",
        all: [...anomalies].sort(byDateDesc((a) => a.date_detection)).map((a) => ({
          href: "/comptabilite/brouillards",
          title: TYPE_ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie,
          detail: a.description,
          meta: formatDate(a.date_detection),
        })),
      }),
      section({
        id: "echues",
        title: "Factures échues",
        icon: CalendarClock,
        href: "/commercial/impayes",
        empty: "Aucune facture en retard.",
        all: echues.map((f) => ({ href: "/commercial/impayes", title: f.numero, detail: `${h.clientName(f.client)} · ${formatDa(num(f.montant_total))}`, badge: { label: `Échue le ${formatDate(f.date_echeance ?? "")}`, tone: "danger" } })),
      }),
      section({
        id: "ecarts",
        title: "Écarts de caisse à valider",
        icon: Vault,
        href: "/caisse/cloture",
        empty: "Aucun écart en attente.",
        all: ecarts.map((e) => ({
          href: "/caisse/cloture",
          title: `Session n°${e.session_caisse}`,
          detail: e.justification || "Sans justification",
          badge: { label: formatDa(num(e.montant_ecart)), tone: num(e.montant_ecart) < 0 ? "danger" : "warning" },
        })),
      }),
      section({
        id: "exports",
        title: "Derniers exports",
        icon: FileOutput,
        href: "/comptabilite/export-sage",
        empty: "Aucun export généré.",
        all: [...state.exportsComptables].sort(byDateDesc((x) => x.date_generation)).map((x) => ({
          href: "/comptabilite/export-sage",
          title: TYPE_EXPORT_LABEL[x.type_export] ?? x.type_export,
          detail: `${formatDate(x.periode_debut)} → ${formatDate(x.periode_fin)}`,
          meta: formatDateTime(x.date_generation),
        })),
      }),
    ],
    chart: {
      title: "Anomalies par type",
      subtitle: "Ouvertes",
      href: "/comptabilite/brouillards",
      kind: "hbar",
      data: countBy(anomalies, (a) => a.type_anomalie, (k) => TYPE_ANOMALIE_LABEL[k as keyof typeof TYPE_ANOMALIE_LABEL] ?? k),
    },
  };
}
