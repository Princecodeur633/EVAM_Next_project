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
import { ApiError, actions, api, catalog, catalogKeysForRole, detail, endpoints, fetchMoi, loadSession, login as apiLogin, logout as apiLogout, saveSession, type AuthSession, type CatalogKey } from "./api";
import { canAct, stockArticleTotal, type ActionName } from "./engine";
import { displayName, ORDRE_STATUTS_OF } from "./labels";
import { canEditParam as roleCanEditParam } from "./roles";
import { tarifEnVigueur } from "./tarifs";
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

/** Listes déroulantes de paramétrage (une valeur = un `nom`, sauf le format qui utilise `valeur`). */
export type ListeValeurs = "famille_article" | "format" | "parfum" | "unite_vente" | "famille_fiscale";

const LISTE_CONFIG: Record<ListeValeurs, { endpoint: string; champ: "nom" | "valeur" }> = {
  famille_article: { endpoint: endpoints.famillesArticle, champ: "nom" },
  format: { endpoint: endpoints.formatsArticle, champ: "valeur" },
  parfum: { endpoint: endpoints.parfums, champ: "nom" },
  unite_vente: { endpoint: endpoints.unitesVente, champ: "nom" },
  famille_fiscale: { endpoint: endpoints.famillesFiscales, champ: "nom" },
};

export type Action =
  | { type: "LOGIN"; username: string; password: string }
  | { type: "LOGOUT" }
  | { type: "REFRESH" }
  | { type: "SET_DEPOT"; depotId: number }
  | { type: "CLEAR_ERROR" }
  | { type: "CREATE_PLAN"; article: number; date_prevue: string; quantite_prevue: number; priorite?: string; commentaire?: string }
  | { type: "CREATE_OF"; article: number; quantite_a_produire: number; plan_production?: number; agents_affectes?: number[] }
  | { type: "AVANCER_OF"; id: number }
  | { type: "ANNULER_OF"; id: number; motif: string }
  | { type: "CONVERTIR_PLAN"; id: number }
  | { type: "CREATE_DEMANDE_MATIERE"; ordre_fabrication: number; matiere: number; quantite_demandee: number }
  | { type: "LIVRER_DEMANDE_MATIERE"; id: number; quantite_livree?: number }
  | { type: "CREATE_COMPLEMENT"; ordre_fabrication: number; matiere: number; quantite: number; motif: string }
  | { type: "APPROUVER_COMPLEMENT"; id: number }
  | { type: "REJETER_COMPLEMENT"; id: number }
  | { type: "CREATE_SUIVI_PROD"; ordre_fabrication: number; date: string; heure_debut: string; quantite_entree: number; quantite_produite?: number; quantite_conforme?: number; quantite_rejetee?: number; equipe?: string; arrets?: string; incidents?: string; observations?: string }
  | { type: "CREATE_SUIVI_EAU"; ordre_fabrication: number; volume_capte_l: number; volume_obtenu_traitement_l: number; volume_envoye_embouteillage_l: number; bouteilles_produites: number; bouteilles_conformes: number; bouteilles_rejetees?: number; volume_envoye_traitement_l?: number; nombre_packs?: number }
  | { type: "CREATE_ETAPE"; ordre_fabrication: number; etape: string; quantite_produite?: number; observations?: string }
  | { type: "CREATE_PERTE"; ordre_fabrication: number; quantite_perte: number; motif: string; observations?: string; etape?: number; taux_perte?: number }
  | { type: "CREATE_SORTIE"; ordre_fabrication: number; matiere: number; quantite_sortie: number; type_sortie?: string; motif?: string }
  | { type: "CREATE_RETOUR_MAT"; ordre_fabrication: number; matiere: number; quantite_retournee: number }
  | { type: "VALIDER_FT"; id: number }
  | { type: "CREATE_FT"; article: number; version?: number }
  | { type: "CREATE_COMPOSITION"; fiche_technique: number; matiere: number; quantite_necessaire: number }
  | {
      type: "CREATE_ARTICLE";
      code: string;
      /** Optionnelle : générée côté backend (famille + parfum + format - unité de vente) si vide. */
      designation?: string;
      type_article: string;
      unite_mesure: string;
      famille?: number | null;
      sous_famille?: string;
      marque?: string;
      format?: number | null;
      parfum?: number | null;
      unite_vente?: number | null;
      code_fiscal?: number | null;
      suivi_par_lot?: boolean;
      duree_conservation_jours?: number | null;
      stock_minimum?: number;
      stock_alerte?: number;
      emplacement_stockage?: string;
      compte_vente?: string;
      activite_analytique?: string;
      centre_cout?: string;
    }
  | {
      type: "PATCH_ARTICLE";
      id: number;
      designation?: string;
      famille?: number | null;
      sous_famille?: string;
      marque?: string;
      format?: number | null;
      parfum?: number | null;
      unite_vente?: number | null;
      code_fiscal?: number | null;
      suivi_par_lot?: boolean;
      duree_conservation_jours?: number | null;
      stock_minimum?: number;
      stock_alerte?: number;
      emplacement_stockage?: string;
      compte_vente?: string;
      activite_analytique?: string;
      centre_cout?: string;
      actif?: boolean;
    }
  | {
      type: "CREATE_CONTROLE_QUALITE_REQUIS";
      article: number;
      type_controle: string;
      norme_ou_seuil: string;
      moment: string;
      obligatoire?: boolean;
    }
  | { type: "CREATE_CONDITIONNEMENT"; article: number; nombre_unites_par_carton: number; type_emballage: string; poids_carton_kg?: number; nombre_cartons_par_palette?: number }
  | { type: "CREATE_DEPOT"; nom: string; adresse?: string }
  | { type: "CREATE_LOT"; article: number; quantite: number; date_production: string; ordre_fabrication?: number; date_peremption?: string }
  | { type: "CREATE_CONTROLE"; lot: number; resultat: "CONFORME" | "NON_CONFORME"; observations?: string }
  | { type: "LIBERER_LOT"; id: number }
  | { type: "BLOQUER_LOT"; id: number; motif?: string }
  | { type: "PATCH_CLIENT"; id: number; nom?: string; type_client?: string; adresse?: string; telephone?: string; encours_autorise?: number; delai_paiement_jours?: number; bloque?: boolean }
  | { type: "PATCH_FOURNISSEUR"; id: number; nom?: string; contact?: string; telephone?: string; email?: string; adresse?: string; actif?: boolean }
  | { type: "PATCH_TARIF"; id: number; prix_unitaire?: number; date_debut_validite?: string; date_fin_validite?: string | null }
  | { type: "CREATE_CLIENT"; code: string; nom: string; type_client: string; adresse?: string; telephone?: string; encours_autorise?: number; delai_paiement_jours?: number }
  | { type: "CREATE_COMMANDE"; client: number; type_commande: string }
  | { type: "ADD_LIGNE_COMMANDE"; commande: number; article: number; quantite: number; prix_unitaire: number }
  | { type: "PATCH_COMMANDE"; id: number; statut: string }
  | { type: "CREATE_FACTURE"; commande: number; client: number; montant_total?: number }
  | { type: "GENERER_LIGNES_FACTURE"; id: number }
  | { type: "CREATE_AVOIR"; client: number; montant: number; motif: string; facture_origine?: number }
  | { type: "UTILISER_AVOIR"; id: number; facture: number }
  | { type: "CREATE_DECAISSEMENT"; session_caisse: number; montant: number; motif: string; autorise_par: number; beneficiaire?: string }
  | { type: "CREATE_RECLAMATION"; client: number; article: number; quantite: number; type_probleme: string; description: string; bon_livraison?: number; facture?: number; produit_retourne?: boolean; prix_unitaire?: number }
  | { type: "CREATE_RETOUR_PHYSIQUE"; reclamation: number; quantite_retournee: number; lot?: number }
  | { type: "CREATE_CONTROLE_RETOUR"; retour_physique: number; resultat: string; observations?: string }
  | { type: "TERMINER_RECONDITIONNEMENT"; id: number; quantite_reconditionnee: number; cout?: number }
  | { type: "CREATE_SOLUTION"; reclamation: number; type_solution: string; montant_avoir?: number; montant_rembourse?: number; nouvelle_commande?: number }
  | { type: "CREATE_TARIF"; article: number; prix_unitaire: number; date_debut_validite: string; client?: number | null; date_fin_validite?: string }
  | { type: "CREATE_SESSION"; caisse: number; solde_ouverture: number }
  | { type: "ENCAISSER"; session_caisse: number; facture: number; montant: number; mode_paiement: ModePaiement }
  | { type: "CLOTURER_CAISSE"; id: number; solde_theorique?: string; solde_compte: string }
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
  | { type: "CREATE_CLOTURE"; periode: string; type_cloture: string }
  | { type: "GENERER_RAPPORT"; periode: "JOURNALIER" | "MENSUEL" }
  | { type: "CREATE_VALEUR_LISTE"; liste: ListeValeurs; valeur: string }
  | { type: "TOGGLE_VALEUR_LISTE"; liste: ListeValeurs; id: number; actif: boolean }
  | { type: "VALORISER_COUT_RETOUR"; id: number; cout_produit_detruit: number };

function emptyState(): AppState {
  return {
    currentUserId: null,
    depotId: null,
    utilisateurs: [],
    journal: [],
    articles: [],
    controlesQualiteRequis: [],
    codesFiscaux: [],
    famillesFiscales: [],
    famillesArticle: [],
    formatsArticle: [],
    parfums: [],
    unitesVente: [],
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
    demandesMatieres: [],
    demandesComplementaires: [],
    sortiesMatieres: [],
    retoursMatieres: [],
    suivisProduction: [],
    suivisEau: [],
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
    lignesFacture: [],
    avoirs: [],
    caisses: [],
    sessionsCaisse: [],
    encaissements: [],
    decaissements: [],
    ecartsCaisse: [],
    vehicules: [],
    chauffeurs: [],
    depotsDistribution: [],
    tournees: [],
    preparations: [],
    bonsLivraison: [],
    transferts: [],
    reclamations: [],
    retoursPhysiques: [],
    controlesRetour: [],
    reconditionnements: [],
    coutsRetours: [],
    solutionsReclamation: [],
    coutsMatieres: [],
    coutsEnergie: [],
    coutsMainOeuvre: [],
    amortissements: [],
    coutsStandards: [],
    coutsReels: [],
    anomalies: [],
    exportsComptables: [],
    clotures: [],
    rapports: [],
    lastError: null,
    loading: false,
  };
}

async function fetchCatalogs(keys: CatalogKey[]): Promise<Partial<AppState>> {
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
  const partial: Record<string, unknown> = {};
  for (const [key, value] of entries) partial[key] = value;
  return partial as Partial<AppState>;
}

function withDepotId(state: AppState): AppState {
  if (!state.depotId && state.depots[0]) return { ...state, depotId: state.depots[0].id };
  return state;
}

/**
 * L'Administrateur SI a accès à tous les modules, mais /accueil et /admin/* n'ont
 * besoin que de ceci pour s'afficher. Le reste (référentiel, stocks, production...)
 * continue de charger en arrière-plan juste après, sans bloquer l'écran : avec un
 * backend aussi lent, mieux vaut afficher l'accueil vite et remplir le reste ensuite
 * plutôt que de faire attendre ~65 requêtes avant le premier affichage.
 */
const ADMIN_CORE_KEYS: CatalogKey[] = ["utilisateurs", "journal"];

async function loadCatalogs(base: AppState, profil: Profil): Promise<AppState> {
  const keys = profil === "ADMIN_SI" ? ADMIN_CORE_KEYS : catalogKeysForRole(profil);
  const fetched = await fetchCatalogs(keys);
  return withDepotId({ ...base, ...fetched, loading: false, lastError: null });
}

/** GET /comptes/moi/ fait toujours autorité sur l'identité du compte connecté. */
function toUser(session: AuthSession): SessionUser {
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
  familleName: (id: number | null | undefined) => string;
  familleFiscaleName: (id: number | null | undefined) => string;
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

  const hydrate = useCallback(async (auth: AuthSession | null, trustProfil = false) => {
    if (!auth) {
      setState(emptyState());
      setSession(null);
      setReady(true);
      return;
    }
    setState((s) => ({ ...s, loading: true, lastError: null, currentUserId: auth.userId }));
    try {
      // Après un LOGIN, apiLogin() a déjà appelé /comptes/moi/ : pas besoin de le
      // refaire une seconde fois ici.
      const moi = trustProfil
        ? { id: auth.userId, username: auth.username, name: auth.name, email: auth.email, profil: auth.profil }
        : await fetchMoi();
      if (!moi) {
        saveSession(null);
        setSession(null);
        setState({ ...emptyState(), lastError: "Votre profil n’a pas pu être vérifié. Reconnectez-vous." });
        return;
      }
      const nextSession: AuthSession = { ...auth, profil: moi.profil, username: moi.username, userId: moi.id, name: moi.name, email: moi.email };
      const loaded = await loadCatalogs({ ...emptyState(), currentUserId: nextSession.userId, loading: false }, moi.profil);
      saveSession(nextSession);
      setSession(nextSession);
      setState({ ...loaded, currentUserId: nextSession.userId });

      if (moi.profil === "ADMIN_SI") {
        const remaining = catalogKeysForRole(moi.profil).filter((k) => !ADMIN_CORE_KEYS.includes(k));
        void fetchCatalogs(remaining).then((rest) => {
          setState((s) => withDepotId({ ...s, ...rest }));
        });
      }
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
          await hydrate(auth, true);
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
              commentaire: action.commentaire ?? "",
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
          case "ANNULER_OF":
            await actions.annulerOf(action.id, action.motif);
            break;
          case "CONVERTIR_PLAN":
            await actions.convertirPlanEnOf(action.id);
            break;
          case "CREATE_DEMANDE_MATIERE":
            await api.post(endpoints.demandesMatieres, {
              ordre_fabrication: action.ordre_fabrication,
              matiere: action.matiere,
              quantite_demandee: action.quantite_demandee,
            });
            break;
          case "LIVRER_DEMANDE_MATIERE":
            await actions.livrerDemandeMatiere(action.id, action.quantite_livree);
            break;
          case "CREATE_COMPLEMENT":
            await api.post(endpoints.demandesComplementaires, {
              ordre_fabrication: action.ordre_fabrication,
              matiere: action.matiere,
              quantite: action.quantite,
              motif: action.motif,
            });
            break;
          case "APPROUVER_COMPLEMENT":
            await actions.approuverComplement(action.id);
            break;
          case "REJETER_COMPLEMENT":
            await actions.rejeterComplement(action.id);
            break;
          case "CREATE_SUIVI_PROD":
            await api.post(endpoints.suivisProduction, {
              ordre_fabrication: action.ordre_fabrication,
              date: action.date,
              heure_debut: action.heure_debut,
              quantite_entree: action.quantite_entree,
              quantite_produite: action.quantite_produite ?? null,
              quantite_conforme: action.quantite_conforme ?? null,
              quantite_rejetee: action.quantite_rejetee ?? null,
              equipe: action.equipe ?? "",
              arrets: action.arrets ?? "",
              incidents: action.incidents ?? "",
              observations: action.observations ?? "",
            });
            break;
          case "CREATE_SUIVI_EAU":
            await api.post(endpoints.suivisEau, {
              ordre_fabrication: action.ordre_fabrication,
              volume_capte_l: action.volume_capte_l,
              volume_envoye_traitement_l: action.volume_envoye_traitement_l ?? null,
              volume_obtenu_traitement_l: action.volume_obtenu_traitement_l,
              volume_envoye_embouteillage_l: action.volume_envoye_embouteillage_l,
              bouteilles_produites: action.bouteilles_produites,
              bouteilles_conformes: action.bouteilles_conformes,
              bouteilles_rejetees: action.bouteilles_rejetees ?? 0,
              nombre_packs: action.nombre_packs ?? null,
            });
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
              taux_perte: action.taux_perte ?? null,
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
              designation: action.designation ?? "",
              type_article: action.type_article,
              unite_mesure: action.unite_mesure,
              famille: action.famille ?? null,
              sous_famille: action.sous_famille ?? "",
              marque: action.marque ?? "",
              format: action.format ?? null,
              parfum: action.parfum ?? null,
              unite_vente: action.unite_vente ?? null,
              code_fiscal: action.code_fiscal ?? null,
              suivi_par_lot: action.suivi_par_lot ?? true,
              duree_conservation_jours: action.duree_conservation_jours ?? null,
              stock_minimum: action.stock_minimum ?? 0,
              stock_alerte: action.stock_alerte ?? 0,
              emplacement_stockage: action.emplacement_stockage ?? "",
              compte_vente: action.compte_vente ?? "",
              activite_analytique: action.activite_analytique ?? "",
              centre_cout: action.centre_cout ?? "",
              actif: true,
            });
            break;
          case "PATCH_ARTICLE": {
            const champs: Record<string, unknown> = {};
            if (action.designation !== undefined) champs.designation = action.designation;
            if (action.famille !== undefined) champs.famille = action.famille;
            if (action.sous_famille !== undefined) champs.sous_famille = action.sous_famille;
            if (action.marque !== undefined) champs.marque = action.marque;
            if (action.format !== undefined) champs.format = action.format;
            if (action.parfum !== undefined) champs.parfum = action.parfum;
            if (action.unite_vente !== undefined) champs.unite_vente = action.unite_vente;
            if (action.code_fiscal !== undefined) champs.code_fiscal = action.code_fiscal;
            if (action.suivi_par_lot !== undefined) champs.suivi_par_lot = action.suivi_par_lot;
            if (action.duree_conservation_jours !== undefined) champs.duree_conservation_jours = action.duree_conservation_jours;
            if (action.stock_minimum !== undefined) champs.stock_minimum = action.stock_minimum;
            if (action.stock_alerte !== undefined) champs.stock_alerte = action.stock_alerte;
            if (action.emplacement_stockage !== undefined) champs.emplacement_stockage = action.emplacement_stockage;
            if (action.compte_vente !== undefined) champs.compte_vente = action.compte_vente;
            if (action.activite_analytique !== undefined) champs.activite_analytique = action.activite_analytique;
            if (action.centre_cout !== undefined) champs.centre_cout = action.centre_cout;
            if (action.actif !== undefined) champs.actif = action.actif;
            await api.patch(detail(endpoints.articles, action.id), champs);
            break;
          }
          case "CREATE_CONTROLE_QUALITE_REQUIS":
            await api.post(endpoints.controlesQualiteRequis, {
              article: action.article,
              type_controle: action.type_controle,
              norme_ou_seuil: action.norme_ou_seuil,
              moment: action.moment,
              obligatoire: action.obligatoire ?? true,
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
          case "PATCH_CLIENT": {
            const champs: Record<string, unknown> = { ...action };
            delete champs.type;
            delete champs.id;
            await api.patch(detail(endpoints.clients, action.id), champs);
            break;
          }
          case "PATCH_FOURNISSEUR": {
            const champs: Record<string, unknown> = { ...action };
            delete champs.type;
            delete champs.id;
            await api.patch(detail(endpoints.fournisseurs, action.id), champs);
            break;
          }
          case "PATCH_TARIF": {
            const champs: Record<string, unknown> = { ...action };
            delete champs.type;
            delete champs.id;
            await api.patch(detail(endpoints.tarifs, action.id), champs);
            break;
          }
          case "CREATE_CLIENT":
            await api.post(endpoints.clients, {
              code: action.code,
              nom: action.nom,
              type_client: action.type_client,
              adresse: action.adresse ?? "",
              telephone: action.telephone ?? "",
              encours_autorise: action.encours_autorise ?? 0,
              delai_paiement_jours: action.delai_paiement_jours ?? 0,
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
          case "CREATE_FACTURE": {
            const facture = await api.post<{ id: number }>(endpoints.factures, {
              commande: action.commande,
              client: action.client,
              ...(action.montant_total != null ? { montant_total: action.montant_total } : {}),
            });
            try {
              await actions.genererLignesFacture(facture.id);
            } catch {
              /* lignes générées plus tard si code fiscal manquant */
            }
            break;
          }
          case "GENERER_LIGNES_FACTURE":
            await actions.genererLignesFacture(action.id);
            break;
          case "CREATE_AVOIR":
            await api.post(endpoints.avoirs, {
              client: action.client,
              montant: action.montant,
              motif: action.motif,
              facture_origine: action.facture_origine ?? null,
            });
            break;
          case "UTILISER_AVOIR":
            await actions.utiliserAvoir(action.id, action.facture);
            break;
          case "CREATE_DECAISSEMENT":
            await api.post(endpoints.decaissements, {
              session_caisse: action.session_caisse,
              montant: action.montant,
              motif: action.motif,
              beneficiaire: action.beneficiaire ?? "",
              autorise_par: action.autorise_par,
            });
            break;
          case "CREATE_RECLAMATION":
            await api.post(endpoints.reclamations, {
              client: action.client,
              article: action.article,
              quantite: action.quantite,
              type_probleme: action.type_probleme,
              description: action.description,
              bon_livraison: action.bon_livraison ?? null,
              facture: action.facture ?? null,
              produit_retourne: action.produit_retourne ?? false,
              prix_unitaire: action.prix_unitaire ?? null,
            });
            break;
          case "CREATE_RETOUR_PHYSIQUE":
            await api.post(endpoints.retoursPhysiques, {
              reclamation: action.reclamation,
              quantite_retournee: action.quantite_retournee,
              lot: action.lot ?? null,
            });
            break;
          case "CREATE_CONTROLE_RETOUR":
            await api.post(endpoints.controlesRetour, {
              retour_physique: action.retour_physique,
              resultat: action.resultat,
              observations: action.observations ?? "",
            });
            break;
          case "TERMINER_RECONDITIONNEMENT":
            await actions.terminerReconditionnement(action.id, action.quantite_reconditionnee, action.cout);
            break;
          case "CREATE_SOLUTION":
            await api.post(endpoints.solutionsReclamation, {
              reclamation: action.reclamation,
              type_solution: action.type_solution,
              montant_avoir: action.montant_avoir ?? null,
              montant_rembourse: action.montant_rembourse ?? null,
              nouvelle_commande: action.nouvelle_commande ?? null,
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
            });
            break;
          case "TOGGLE_USER":
            await api.post(`${detail(endpoints.utilisateurs, action.id)}${action.actif ? "activer" : "desactiver"}/`);
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
          case "CREATE_VALEUR_LISTE": {
            const cfg = LISTE_CONFIG[action.liste];
            await api.post(cfg.endpoint, { [cfg.champ]: action.valeur.trim(), actif: true });
            break;
          }
          case "TOGGLE_VALEUR_LISTE": {
            const cfg = LISTE_CONFIG[action.liste];
            await api.patch(detail(cfg.endpoint, action.id), { actif: action.actif });
            break;
          }
          case "GENERER_RAPPORT":
            await actions.genererRapport(action.periode);
            break;
          case "VALORISER_COUT_RETOUR":
            await api.patch(detail(endpoints.coutsRetours, action.id), {
              cout_produit_detruit: action.cout_produit_detruit,
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

  const currentUser = useMemo(() => (session ? toUser(session) : null), [session]);
  const role = currentUser?.role ?? null;

  /** Filtre les données sensibles selon le profil (agent → ses OF, chauffeur → ses tournées/BL). */
  const filteredState = useMemo(() => {
    if (!role || !currentUser) return state;
    const uid = currentUser.id;
    const s = { ...state };
    if (role === "AGENT_PRODUCTION") {
      s.ofList = s.ofList.filter((o) => o.agents_affectes?.includes(uid));
      s.etapes = s.etapes.filter((e) => s.ofList.some((o) => o.id === e.ordre_fabrication));
      s.pertes = s.pertes.filter((p) => s.ofList.some((o) => o.id === p.ordre_fabrication));
    }
    if (role === "CHAUFFEUR") {
      const myChIds = state.chauffeurs.filter((c) => c.utilisateur === uid).map((c) => c.id);
      s.tournees = s.tournees.filter((t) => myChIds.includes(t.chauffeur));
      const myTourneeIds = s.tournees.map((t) => t.id);
      s.bonsLivraison = s.bonsLivraison.filter((b) => b.tournee && myTourneeIds.includes(b.tournee));
    }
    return s;
  }, [state, role, currentUser]);

  const value = useMemo<StoreValue>(() => {
    const s = filteredState;
    const articleName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const a = s.articles.find((x) => x.id === id);
      return a ? `${a.code} · ${a.designation}` : `#${id}`;
    };
    const familleName = (id: number | null | undefined) => {
      if (id == null) return "—";
      return s.famillesArticle.find((x) => x.id === id)?.nom ?? `#${id}`;
    };
    const familleFiscaleName = (id: number | null | undefined) => {
      if (id == null) return "—";
      return s.famillesFiscales.find((x) => x.id === id)?.nom ?? `#${id}`;
    };
    const clientName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const c = s.clients.find((x) => x.id === id);
      return c ? `${c.code} · ${c.nom}` : `#${id}`;
    };
    const fournisseurName = (id: number | null | undefined) => {
      if (id == null) return "—";
      const f = s.fournisseurs.find((x) => x.id === id);
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
      state: s,
      currentUser,
      role,
      dispatch,
      can: (action) => canAct(role, action),
      canEditParam: (href) => roleCanEditParam(role, href),
      articleName,
      familleName,
      familleFiscaleName,
      clientName,
      fournisseurName,
      ofNumero,
      userName,
      stockOf: (articleId) => stockArticleTotal(s, articleId),
      tarifFor: (articleId, clientId) => num(tarifEnVigueur(s.tarifs, articleId, clientId ?? null)?.prix_unitaire),
      produitsFinis: s.articles.filter((a) => a.type_article === "PRODUIT_FINI" && a.actif),
      matieres: s.articles.filter((a) => a.type_article === "MATIERE_PREMIERE" && a.actif),
      ready,
    };
  }, [currentUser, dispatch, filteredState, ready, role, session, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function nextOfStatut(current: StatutOF): StatutOF | null {
  if (current === "ANNULE" || current === "CLOTURE") return null;
  const i = ORDRE_STATUTS_OF.indexOf(current);
  return i >= 0 && i < ORDRE_STATUTS_OF.length - 1 ? ORDRE_STATUTS_OF[i + 1] : null;
}

export type { Client };
