"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, actions, api, catalog, catalogKeysForRole, detail, endpoints, loadSession, login as apiLogin, logout as apiLogout, rememberProfil, resolveProfil, saveSession, type AuthSession } from "./api";
import { canAct, stockArticleTotal, type ActionName } from "./engine";
import { displayName } from "./labels";
import { canEditParam as roleCanEditParam } from "./roles";
import type {
  AppState,
  Article,
  Client,
  ModePaiement,
  Profil,
  SessionUser,
  StatutOF,
} from "./types";
import { num } from "./utils";

function friendlyAuthError(err: unknown) {
  const raw = err instanceof ApiError ? err.message : "";
  const lower = raw.toLowerCase();
  if (!raw || lower.includes("no active account") || lower.includes("credential") || lower.includes("unauthorized") || lower.includes("token")) {
    return "Identifiant ou mot de passe incorrect.";
  }
  return raw;
}

export type Action =
  | { type: "LOGIN"; username: string; password: string }
  | { type: "LOGOUT" }
  | { type: "REFRESH" }
  | { type: "SET_DEPOT"; depotId: number }
  | { type: "CLEAR_ERROR" }
  | { type: "CREATE_PLAN"; article: number; date_prevue: string; quantite_prevue: number; priorite?: string }
  | { type: "CREATE_OF"; article: number; quantite_a_produire: number; plan_production?: number; agents_affectes?: number[] }
  | { type: "AVANCER_OF"; id: number }
  | { type: "CREATE_ETAPE"; ordre_fabrication: number; etape: string; quantite_produite?: number; observations?: string }
  | { type: "CREATE_PERTE"; ordre_fabrication: number; quantite_perte: number; motif: string; observations?: string; etape?: number }
  | { type: "CREATE_SORTIE"; ordre_fabrication: number; matiere: number; quantite_sortie: number; type_sortie?: string; motif?: string }
  | { type: "CREATE_RETOUR_MAT"; ordre_fabrication: number; matiere: number; quantite_retournee: number }
  | { type: "VALIDER_FT"; id: number }
  | { type: "CREATE_FT"; article: number; version?: number }
  | { type: "CREATE_COMPOSITION"; fiche_technique: number; matiere: number; quantite_necessaire: number }
  | { type: "CREATE_ARTICLE"; code: string; designation: string; type_article: string; unite_mesure: string; famille?: string }
  | { type: "CREATE_CONDITIONNEMENT"; article: number; nombre_unites_par_carton: number; type_emballage: string; poids_carton_kg?: number; nombre_cartons_par_palette?: number }
  | { type: "CREATE_DEPOT"; nom: string; adresse?: string }
  | { type: "CREATE_LOT"; article: number; quantite: number; date_production: string; ordre_fabrication?: number; date_peremption?: string }
  | { type: "CREATE_CONTROLE"; lot: number; resultat: "CONFORME" | "NON_CONFORME"; observations?: string }
  | { type: "LIBERER_LOT"; id: number }
  | { type: "BLOQUER_LOT"; id: number; motif?: string }
  | { type: "CREATE_CLIENT"; code: string; nom: string; type_client: string; adresse?: string; telephone?: string; encours_autorise?: number }
  | { type: "CREATE_COMMANDE"; client: number; type_commande: string }
  | { type: "ADD_LIGNE_COMMANDE"; commande: number; article: number; quantite: number; prix_unitaire: number }
  | { type: "PATCH_COMMANDE"; id: number; statut: string }
  | { type: "CREATE_FACTURE"; commande: number; client: number; montant_total: number }
  | { type: "CREATE_TARIF"; article: number; prix_unitaire: number; date_debut_validite: string; client?: number | null; date_fin_validite?: string }
  | { type: "CREATE_SESSION"; caisse: number; solde_ouverture: number }
  | { type: "ENCAISSER"; session_caisse: number; facture: number; montant: number; mode_paiement: ModePaiement }
  | { type: "CLOTURER_CAISSE"; id: number; solde_theorique: string; solde_compte: string }
  | { type: "JUSTIFIER_ECART"; session_caisse: number; montant_ecart: number; justification: string }
  | { type: "CREATE_DA"; article: number; quantite_demandee: number; motif?: string; besoin?: number }
  | { type: "APPROUVER_DA"; id: number }
  | { type: "REJETER_DA"; id: number }
  | { type: "CREATE_CF"; fournisseur: number; demande_achat?: number }
  | { type: "ADD_LIGNE_CF"; commande: number; article: number; quantite_commandee: number; prix_unitaire: number }
  | { type: "ENVOYER_CF"; id: number }
  | { type: "CREATE_RECEPTION"; commande: number; conforme?: boolean; observations?: string }
  | { type: "ADD_LIGNE_RECEPTION"; reception: number; ligne_commande: number; quantite_recue: number }
  | { type: "CREATE_FOURNISSEUR"; code: string; nom: string; contact?: string; telephone?: string; email?: string; adresse?: string }
  | { type: "CREATE_MVT"; article: number; depot: number; type_mouvement: string; quantite: number; motif?: string; document_origine?: string }
  | { type: "CREATE_INVENTAIRE"; depot: number; date_inventaire: string }
  | { type: "ADD_LIGNE_INVENTAIRE"; inventaire: number; article: number; quantite_theorique: number; quantite_comptee: number }
  | { type: "CLOTURER_INVENTAIRE"; id: number }
  | { type: "CREATE_PREP"; commande: number }
  | { type: "CREATE_VEHICULE"; immatriculation: string; type_vehicule?: string }
  | { type: "CREATE_CHAUFFEUR"; utilisateur: number; permis_numero?: string }
  | { type: "PREP_CONFIRMER"; id: number }
  | { type: "PREP_SORTIE"; id: number }
  | { type: "CREATE_TOURNEE"; chauffeur: number; vehicule: number; date_tournee: string }
  | { type: "CREATE_BL"; commande: number; tournee?: number }
  | { type: "CONFIRMER_BL"; id: number }
  | { type: "CREATE_USER"; username: string; password: string; profil: Profil; first_name?: string; last_name?: string; email?: string }
  | { type: "TOGGLE_USER"; id: number; actif: boolean }
  | { type: "RECALCULER_COUT"; id: number }
  | { type: "CREATE_EXPORT"; type_export: string; periode_debut: string; periode_fin: string }
  | { type: "CREATE_ANOMALIE"; type_anomalie: string; module_source: string; description: string }
  | { type: "TRAITER_ANOMALIE"; id: number; statut: "TRAITEE" | "IGNOREE" | "EN_TRAITEMENT" }
  | { type: "CREATE_CLOTURE"; periode: string; type_cloture: string };

function emptyState(): AppState {
  return {
    currentUserId: null,
    depotId: null,
    utilisateurs: [],
    droits: [],
    journal: [],
    articles: [],
    fichesTechniques: [],
    compositions: [],
    fichesConditionnement: [],
    fournisseurs: [],
    contratsFournisseurs: [],
    catalogueFournisseurs: [],
    besoinsAchat: [],
    demandesAchat: [],
    commandesFournisseur: [],
    lignesCommandeFournisseur: [],
    receptions: [],
    lignesReception: [],
    retoursFournisseur: [],
    depots: [],
    stock: [],
    mouvements: [],
    inventaires: [],
    lignesInventaire: [],
    plans: [],
    ofList: [],
    besoinsMatieres: [],
    sortiesMatieres: [],
    retoursMatieres: [],
    etapes: [],
    pertes: [],
    lots: [],
    controles: [],
    clients: [],
    prospects: [],
    contratsClients: [],
    tarifs: [],
    commandes: [],
    lignesCommande: [],
    factures: [],
    caisses: [],
    sessionsCaisse: [],
    encaissements: [],
    ecartsCaisse: [],
    vehicules: [],
    chauffeurs: [],
    depotsDistribution: [],
    tournees: [],
    preparations: [],
    bonsLivraison: [],
    transferts: [],
    coutsMatieres: [],
    coutsEnergie: [],
    coutsMainOeuvre: [],
    amortissements: [],
    coutsStandards: [],
    coutsReels: [],
    anomalies: [],
    exportsComptables: [],
    clotures: [],
    lastError: null,
    loading: false,
  };
}

async function loadCatalogs(base: AppState, profil: Profil): Promise<AppState> {
  const keys = catalogKeysForRole(profil);
  const entries = await Promise.all(
    keys.map(async (key) => {
      try {
        const value = await catalog[key]();
        return [key, value] as const;
      } catch {
        return [key, []] as const;
      }
    }),
  );
  const next: AppState = { ...base, loading: false, lastError: null };
  for (const [key, value] of entries) {
    (next as unknown as Record<string, unknown>)[key] = value;
  }
  if (!next.depotId && next.depots[0]) next.depotId = next.depots[0].id;
  return next;
}

function toUser(session: AuthSession, utilisateurs: AppState["utilisateurs"]): SessionUser {
  const found = utilisateurs.find((u) => u.id === session.userId || u.username === session.username);
  if (found) {
    return {
      id: found.id,
      username: found.username,
      name: displayName(found),
      email: found.email,
      role: found.profil,
      active: found.actif && found.is_active,
    };
  }
  return {
    id: session.userId,
    username: session.username,
    name: session.name || session.username,
    email: session.email,
    role: session.profil,
    active: true,
  };
}

type StoreValue = {
  state: AppState;
  currentUser: SessionUser | null;
  role: Profil | null;
  dispatch: (action: Action) => Promise<void>;
  can: (action: ActionName) => boolean;
  canEditParam: (href: string) => boolean;
  articleName: (id: number | null | undefined) => string;
  clientName: (id: number | null | undefined) => string;
  fournisseurName: (id: number | null | undefined) => string;
  ofNumero: (id: number | null | undefined) => string;
  userName: (id: number | null | undefined) => string;
  stockOf: (articleId: number) => number;
  tarifFor: (articleId: number, clientId?: number | null) => number;
  produitsFinis: Article[];
  matieres: Article[];
  ready: boolean;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const busy = useRef(false);

  const hydrate = useCallback(async (auth: AuthSession | null) => {
    if (!auth) {
      setState(emptyState());
      setSession(null);
      setReady(true);
      return;
    }
    setState((s) => ({ ...s, loading: true, lastError: null, currentUserId: auth.userId }));
    try {
      const profil = await resolveProfil(auth.username, auth.userId, auth.profil);
      const resolved = { ...auth, profil };
      saveSession(resolved);
      const loaded = await loadCatalogs({ ...emptyState(), currentUserId: resolved.userId, loading: false }, profil);
      const user = toUser(resolved, loaded.utilisateurs);
      const nextSession = { ...resolved, name: user.name, email: user.email, profil: user.role, userId: user.id };
      rememberProfil(nextSession.username, nextSession.profil);
      saveSession(nextSession);
      setSession(nextSession);
      setState({ ...loaded, currentUserId: user.id });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        lastError: err instanceof ApiError ? err.message : "Impossible de charger les données.",
      }));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const existing = loadSession();
    if (existing) {
      setSession(existing);
      void hydrate(existing);
    } else {
      setReady(true);
    }
  }, [hydrate]);

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, lastError: message, loading: false }));
  }, []);

  const dispatch = useCallback(
    async (action: Action) => {
      if (action.type === "CLEAR_ERROR") {
        setState((s) => ({ ...s, lastError: null }));
        return;
      }
      if (action.type === "SET_DEPOT") {
        setState((s) => ({ ...s, depotId: action.depotId }));
        return;
      }
      if (action.type === "LOGOUT") {
        apiLogout();
        setSession(null);
        setState(emptyState());
        return;
      }
      if (action.type === "LOGIN") {
        try {
          const auth = await apiLogin(action.username, action.password);
          setSession(auth);
          await hydrate(auth);
        } catch (err) {
          fail(friendlyAuthError(err));
        }
        return;
      }
      if (action.type === "REFRESH") {
        const auth = loadSession();
        await hydrate(auth);
        return;
      }
      if (busy.current) return;
      busy.current = true;
      setState((s) => ({ ...s, lastError: null }));
      try {
        const userId = session?.userId;
        switch (action.type) {
          case "CREATE_PLAN":
            await api.post(endpoints.plans, {
              article: action.article,
              date_prevue: action.date_prevue,
              quantite_prevue: action.quantite_prevue,
              priorite: action.priorite ?? "NORMALE",
            });
            break;
          case "CREATE_OF":
            await api.post(endpoints.ofList, {
              article: action.article,
              quantite_a_produire: action.quantite_a_produire,
              plan_production: action.plan_production ?? null,
              agents_affectes: action.agents_affectes ?? [],
            });
            break;
          case "AVANCER_OF":
            await actions.avancerOf(action.id);
            break;
          case "CREATE_ETAPE":
            await api.post(endpoints.etapes, {
              ordre_fabrication: action.ordre_fabrication,
              etape: action.etape,
              quantite_produite: action.quantite_produite ?? null,
              observations: action.observations ?? "",
              date_debut: new Date().toISOString(),
            });
            break;
          case "CREATE_PERTE":
            await api.post(endpoints.pertes, {
              ordre_fabrication: action.ordre_fabrication,
              quantite_perte: action.quantite_perte,
              motif: action.motif,
              observations: action.observations ?? "",
              etape: action.etape ?? null,
            });
            break;
          case "CREATE_SORTIE":
            await api.post(endpoints.sortiesMatieres, {
              ordre_fabrication: action.ordre_fabrication,
              matiere: action.matiere,
              quantite_sortie: action.quantite_sortie,
              type_sortie: action.type_sortie ?? "NORMALE",
              motif: action.motif ?? "",
            });
            break;
          case "CREATE_RETOUR_MAT":
            await api.post(endpoints.retoursMatieres, {
              ordre_fabrication: action.ordre_fabrication,
              matiere: action.matiere,
              quantite_retournee: action.quantite_retournee,
            });
            break;
          case "VALIDER_FT":
            await actions.validerFiche(action.id);
            break;
          case "CREATE_FT":
            await api.post(endpoints.fichesTechniques, {
              article: action.article,
              version: action.version ?? 1,
              cree_par: userId,
              statut: "BROUILLON",
            });
            break;
          case "CREATE_COMPOSITION":
            await api.post(endpoints.compositions, {
              fiche_technique: action.fiche_technique,
              matiere: action.matiere,
              quantite_necessaire: action.quantite_necessaire,
            });
            break;
          case "CREATE_ARTICLE":
            await api.post(endpoints.articles, {
              code: action.code,
              designation: action.designation,
              type_article: action.type_article,
              unite_mesure: action.unite_mesure,
              famille: action.famille ?? "",
              actif: true,
            });
            break;
          case "CREATE_CONDITIONNEMENT":
            await api.post(endpoints.fichesConditionnement, {
              article: action.article,
              nombre_unites_par_carton: action.nombre_unites_par_carton,
              type_emballage: action.type_emballage,
              poids_carton_kg: action.poids_carton_kg ?? null,
              nombre_cartons_par_palette: action.nombre_cartons_par_palette ?? null,
            });
            break;
          case "CREATE_DEPOT":
            await api.post(endpoints.depots, { nom: action.nom, adresse: action.adresse ?? "", actif: true });
            break;
          case "CREATE_LOT":
            await api.post(endpoints.lots, {
              article: action.article,
              quantite: action.quantite,
              date_production: action.date_production,
              ordre_fabrication: action.ordre_fabrication ?? null,
              date_peremption: action.date_peremption ?? null,
            });
            break;
          case "CREATE_CONTROLE":
            await api.post(endpoints.controles, {
              lot: action.lot,
              resultat: action.resultat,
              observations: action.observations ?? "",
            });
            break;
          case "LIBERER_LOT":
            await actions.libererLot(action.id);
            break;
          case "BLOQUER_LOT":
            await actions.bloquerLot(action.id, action.motif);
            break;
          case "CREATE_CLIENT":
            await api.post(endpoints.clients, {
              code: action.code,
              nom: action.nom,
              type_client: action.type_client,
              adresse: action.adresse ?? "",
              telephone: action.telephone ?? "",
              encours_autorise: action.encours_autorise ?? 0,
              bloque: false,
            });
            break;
          case "CREATE_COMMANDE":
            await api.post(endpoints.commandes, {
              client: action.client,
              type_commande: action.type_commande,
            });
            break;
          case "ADD_LIGNE_COMMANDE":
            await api.post(endpoints.lignesCommande, {
              commande: action.commande,
              article: action.article,
              quantite: action.quantite,
              prix_unitaire: action.prix_unitaire,
            });
            break;
          case "PATCH_COMMANDE":
            await api.patch(detail(endpoints.commandes, action.id), { statut: action.statut });
            break;
          case "CREATE_FACTURE":
            await api.post(endpoints.factures, {
              commande: action.commande,
              client: action.client,
              montant_total: action.montant_total,
            });
            break;
          case "CREATE_TARIF":
            await api.post(endpoints.tarifs, {
              article: action.article,
              client: action.client ?? null,
              prix_unitaire: action.prix_unitaire,
              date_debut_validite: action.date_debut_validite,
              date_fin_validite: action.date_fin_validite ?? null,
            });
            break;
          case "CREATE_SESSION":
            await api.post(endpoints.sessionsCaisse, {
              caisse: action.caisse,
              solde_ouverture: action.solde_ouverture,
            });
            break;
          case "ENCAISSER":
            await api.post(endpoints.encaissements, {
              session_caisse: action.session_caisse,
              facture: action.facture,
              montant: action.montant,
              mode_paiement: action.mode_paiement,
            });
            break;
          case "CLOTURER_CAISSE": {
            const res = await actions.cloturerSession(action.id, action.solde_theorique, action.solde_compte);
            if (res.avertissement) fail(res.avertissement);
            break;
          }
          case "JUSTIFIER_ECART":
            await api.post(endpoints.ecartsCaisse, {
              session_caisse: action.session_caisse,
              montant_ecart: action.montant_ecart,
              justification: action.justification,
            });
            break;
          case "CREATE_DA":
            await api.post(endpoints.demandesAchat, {
              article: action.article,
              quantite_demandee: action.quantite_demandee,
              motif: action.motif ?? "",
              besoin: action.besoin ?? null,
            });
            break;
          case "APPROUVER_DA":
            await actions.approuverDemande(action.id);
            break;
          case "REJETER_DA":
            await actions.rejeterDemande(action.id);
            break;
          case "CREATE_CF":
            await api.post(endpoints.commandesFournisseur, {
              fournisseur: action.fournisseur,
              demande_achat: action.demande_achat ?? null,
            });
            break;
          case "ADD_LIGNE_CF":
            await api.post(endpoints.lignesCommandeFournisseur, {
              commande: action.commande,
              article: action.article,
              quantite_commandee: action.quantite_commandee,
              prix_unitaire: action.prix_unitaire,
            });
            break;
          case "ENVOYER_CF":
            await actions.envoyerCommandeFournisseur(action.id);
            break;
          case "CREATE_RECEPTION":
            await api.post(endpoints.receptions, {
              commande: action.commande,
              conforme: action.conforme ?? true,
              observations: action.observations ?? "",
            });
            break;
          case "ADD_LIGNE_RECEPTION":
            await api.post(endpoints.lignesReception, {
              reception: action.reception,
              ligne_commande: action.ligne_commande,
              quantite_recue: action.quantite_recue,
            });
            break;
          case "CREATE_FOURNISSEUR":
            await api.post(endpoints.fournisseurs, {
              code: action.code,
              nom: action.nom,
              contact: action.contact ?? "",
              telephone: action.telephone ?? "",
              email: action.email ?? "",
              adresse: action.adresse ?? "",
              actif: true,
            });
            break;
          case "CREATE_MVT":
            await api.post(endpoints.mouvements, {
              article: action.article,
              depot: action.depot,
              type_mouvement: action.type_mouvement,
              quantite: action.quantite,
              motif: action.motif ?? "",
              document_origine: action.document_origine ?? "",
            });
            break;
          case "CREATE_INVENTAIRE":
            await api.post(endpoints.inventaires, {
              depot: action.depot,
              date_inventaire: action.date_inventaire,
            });
            break;
          case "ADD_LIGNE_INVENTAIRE":
            await api.post(endpoints.lignesInventaire, {
              inventaire: action.inventaire,
              article: action.article,
              quantite_theorique: action.quantite_theorique,
              quantite_comptee: action.quantite_comptee,
            });
            break;
          case "CLOTURER_INVENTAIRE":
            await api.patch(detail(endpoints.inventaires, action.id), { statut: "CLOTURE" });
            break;
          case "CREATE_PREP":
            await api.post(endpoints.preparations, { commande: action.commande });
            break;
          case "PREP_CONFIRMER":
            await actions.confirmerPreparation(action.id);
            break;
          case "PREP_SORTIE":
            await actions.confirmerSortie(action.id);
            break;
          case "CREATE_VEHICULE":
            await api.post(endpoints.vehicules, {
              immatriculation: action.immatriculation,
              type_vehicule: action.type_vehicule ?? "",
              actif: true,
            });
            break;
          case "CREATE_CHAUFFEUR":
            await api.post(endpoints.chauffeurs, {
              utilisateur: action.utilisateur,
              permis_numero: action.permis_numero ?? "",
            });
            break;
          case "CREATE_TOURNEE":
            await api.post(endpoints.tournees, {
              chauffeur: action.chauffeur,
              vehicule: action.vehicule,
              date_tournee: action.date_tournee,
            });
            break;
          case "CREATE_BL":
            await api.post(endpoints.bonsLivraison, {
              commande: action.commande,
              tournee: action.tournee ?? null,
            });
            break;
          case "CONFIRMER_BL":
            await actions.confirmerLivraison(action.id);
            break;
          case "CREATE_USER":
            await api.post(endpoints.utilisateurs, {
              username: action.username,
              password: action.password,
              profil: action.profil,
              first_name: action.first_name ?? "",
              last_name: action.last_name ?? "",
              email: action.email ?? "",
              actif: true,
            });
            rememberProfil(action.username, action.profil);
            break;
          case "TOGGLE_USER":
            await api.patch(detail(endpoints.utilisateurs, action.id), { actif: action.actif });
            break;
          case "RECALCULER_COUT":
            await actions.recalculerCout(action.id);
            break;
          case "CREATE_EXPORT":
            await api.post(endpoints.exportsComptables, {
              type_export: action.type_export,
              periode_debut: action.periode_debut,
              periode_fin: action.periode_fin,
            });
            break;
          case "CREATE_ANOMALIE":
            await api.post(endpoints.anomalies, {
              type_anomalie: action.type_anomalie,
              module_source: action.module_source,
              description: action.description,
            });
            break;
          case "TRAITER_ANOMALIE":
            await api.patch(detail(endpoints.anomalies, action.id), {
              statut: action.statut,
              traite_par: userId ?? null,
              date_traitement: action.statut === "EN_TRAITEMENT" ? null : new Date().toISOString(),
            });
            break;
          case "CREATE_CLOTURE":
            await api.post(endpoints.clotures, {
              periode: action.periode,
              type_cloture: action.type_cloture,
            });
            break;
        }
        const auth = loadSession();
        await hydrate(auth);
      } catch (err) {
        fail(err instanceof ApiError ? err.message : "Cette action n’a pas pu être enregistrée.");
      } finally {
        busy.current = false;
      }
    },
    [fail, hydrate, session?.userId],
  );

  const currentUser = useMemo(() => (session ? toUser(session, state.utilisateurs) : null), [session, state.utilisateurs]);
  const role = currentUser?.role ?? null;

  const value = useMemo<StoreValue>(() => {
    const articleName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const a = state.articles.find((x) => x.id === id);
      return a ? `${a.code} · ${a.designation}` : `#${id}`;
    };
    const clientName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const c = state.clients.find((x) => x.id === id);
      return c ? `${c.code} · ${c.nom}` : `#${id}`;
    };
    const fournisseurName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const f = state.fournisseurs.find((x) => x.id === id);
      return f ? `${f.code} · ${f.nom}` : `#${id}`;
    };
    const ofNumero = (id: number | null | undefined) => {
      if (id == null) return "—";
      return state.ofList.find((o) => o.id === id)?.numero ?? `#${id}`;
    };
    const userName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const u = state.utilisateurs.find((x) => x.id === id);
      if (u) return displayName(u);
      if (session?.userId === id) return session.name || session.username;
      return `#${id}`;
    };
    return {
      state,
      currentUser,
      role,
      dispatch,
      can: (action) => canAct(role, action),
      canEditParam: (href) => roleCanEditParam(role, href),
      articleName,
      clientName,
      fournisseurName,
      ofNumero,
      userName,
      stockOf: (articleId) => stockArticleTotal(state, articleId),
      tarifFor: (articleId, clientId) => {
        const specific = clientId
          ? state.tarifs.find((t) => t.article === articleId && t.client === clientId)
          : undefined;
        const pub = state.tarifs.find((t) => t.article === articleId && t.client == null);
        return num((specific ?? pub)?.prix_unitaire);
      },
      produitsFinis: state.articles.filter((a) => a.type_article === "PRODUIT_FINI" && a.actif),
      matieres: state.articles.filter((a) => a.type_article === "MATIERE_PREMIERE" && a.actif),
      ready,
    };
  }, [currentUser, dispatch, ready, role, session, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function nextOfStatut(current: StatutOF): StatutOF | null {
  const order: StatutOF[] = [
    "BROUILLON",
    "PLANIFIE",
    "LANCE",
    "EN_PRODUCTION",
    "TERMINE",
    "CONTROLE_QUALITE",
    "LIBERE",
    "CLOTURE",
  ];
  const i = order.indexOf(current);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

export type { Client };
