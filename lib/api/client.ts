"use client";

import type { Paginated, Profil } from "../types";
import { isProfil } from "../labels";

const SESSION_KEY = "evam-erp-session-v1";

export type AuthSession = {
  access: string;
  refresh: string;
  username: string;
  userId: number;
  profil: Profil;
  name: string;
  email: string;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function decodeJwt(token: string): { user_id?: number; userId?: number; username?: string; exp?: number } {
  const payload = token.split(".")[1];
  if (!payload) return {};
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as { user_id?: number; userId?: number; username?: string; exp?: number };
}

export type Moi = { id: number; username: string; name: string; email: string; profil: Profil; active?: boolean };

/**
 * GET /api/comptes/moi/ - la fiche du compte actuellement connecté, telle que
 * renvoyée par le backend (accessible à tout utilisateur authentifié, quel que
 * soit son profil). Seule source de vérité pour "qui est connecté, avec quel
 * profil" : on ne devine jamais côté frontend.
 *
 * `access` permet de forcer le jeton à utiliser : juste après un login, la
 * session n'est pas encore persistée, donc rien n'est disponible côté stockage
 * local pour authentifier cet appel.
 */
export async function fetchMoi(access?: string): Promise<Moi | null> {
  try {
    const me = await apiRequest<{
      id: number;
      username: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      profil: Profil;
      is_active?: boolean;
    }>("/comptes/moi/", { method: "GET" }, true, access);
    if (!isProfil(me.profil)) return null;
    return {
      id: me.id,
      username: me.username,
      profil: me.profil,
      name: `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || me.username,
      email: me.email ?? "",
      active: me.is_active,
    };
  } catch {
    return null;
  }
}

export type FactureImpayee = {
  facture: string;
  client: string;
  echeance: string | null;
  montant: string | number;
  paye: string | number;
  restant: string | number;
  jours_retard: number;
};

/**
 * GET /api/commercial/impayes/ - vue agrégée (§8.5), pas un endpoint
 * CRUD paginé : ne passe donc pas par le système `catalog`/`AppState`,
 * se récupère à la demande depuis l'écran qui en a besoin.
 */
export async function fetchImpayes(clientId?: number): Promise<FactureImpayee[]> {
  const query = clientId ? `?client=${clientId}` : "";
  return apiRequest<FactureImpayee[]>(`/commercial/impayes/${query}`, { method: "GET" });
}

export type BlocProduction = {
  aujourd_hui: { production_conforme: number; rendement_pourcentage: number | null; pertes_pourcentage: number | null };
  mois: { production_conforme: number; rendement_pourcentage: number | null; pertes_pourcentage: number | null };
};
export type BlocStock = {
  valeur_stock_matieres: number;
  valeur_stock_produits_finis: number;
  articles_en_rupture: number;
  articles_sous_minimum: number;
};
export type BlocCommercial = {
  chiffre_affaires_jour: string | number;
  chiffre_affaires_mois: string | number;
  produit_le_plus_vendu: string | null;
  client_principal: string | null;
};
export type BlocCaisse = { encaissements_jour: string | number; solde_theorique: number; ecart_caisse: string | number };
export type BlocDistribution = {
  livraisons_prevues: number;
  livraisons_terminees: number;
  livraisons_en_cours: number;
  livraisons_en_retard: number;
};
export type ProduitRentable = {
  produit: string;
  cout_de_revient: number;
  prix_de_vente: number;
  marge: number;
  taux_marge_pourcentage: number | null;
};
export type BlocRentabilite = { produits_les_plus_rentables: ProduitRentable[]; marge_moyenne_pourcentage: number | null };
export type BlocAlertes = {
  matieres_manquantes: { of: string; matiere: string; manquant: string | number }[];
  ruptures_stock: { article: string; depot: string }[];
  ecarts_caisse_non_justifies: { session_id: number; caisse: string; ecart: string | number }[];
  anomalies_comptables: { id: number; type_anomalie: string; module_source: string; description: string }[];
};
export type TableauDeBordDirection = {
  production: BlocProduction;
  stock: BlocStock;
  commercial: BlocCommercial;
  caisse: BlocCaisse;
  distribution: BlocDistribution;
  rentabilite: BlocRentabilite;
  alertes: BlocAlertes;
};

/** GET /api/reporting/tableau-de-bord-direction/ - agrégat en lecture, hors système `catalog`. */
export async function fetchTableauDeBordDirection(): Promise<TableauDeBordDirection> {
  return apiRequest<TableauDeBordDirection>("/reporting/tableau-de-bord-direction/", { method: "GET" });
}

export function parseApiError(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const rec = body as Record<string, unknown>;
  if (typeof rec.erreur === "string") return rec.erreur;
  if (typeof rec.detail === "string") return rec.detail;
  const first = Object.values(rec).find((v) => Array.isArray(v) && typeof v[0] === "string");
  if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  return fallback;
}

let refreshPromise: Promise<boolean> | null = null;

async function rawFetch(path: string, init: RequestInit, access?: string) {
  const headers = new Headers(init.headers);
  // Un FormData (logo, pièce jointe) fixe lui-même son Content-Type multipart (avec la frontière).
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  return fetch(`/api${path}`, { ...init, headers });
}

async function tryRefresh(): Promise<boolean> {
  const session = loadSession();
  if (!session?.refresh) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await rawFetch("/auth/rafraichir/", {
        method: "POST",
        body: JSON.stringify({ refresh: session.refresh }),
      });
      if (!res.ok) {
        saveSession(null);
        return false;
      }
      const data = (await res.json()) as { access: string; refresh?: string };
      saveSession({
        ...session,
        access: data.access,
        refresh: data.refresh ?? session.refresh,
      });
      return true;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true, accessOverride?: string): Promise<T> {
  const session = loadSession();
  const access = accessOverride ?? session?.access;
  const res = await rawFetch(path, init, access);
  if (res.status === 401 && retry && session?.refresh) {
    const ok = await tryRefresh();
    if (ok) return apiRequest<T>(path, init, false, accessOverride);
  }
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    throw new ApiError(parseApiError(body, `Erreur API ${res.status}`), res.status, body);
  }
  return body as T;
}

/** Réponse brute authentifiée (jeton rafraîchi si besoin) : pour les PDF et images. */
async function fetchAuthentifie(path: string, init: RequestInit = {}): Promise<Response> {
  const session = loadSession();
  let res = await rawFetch(path, init, session?.access);
  if (res.status === 401 && session?.refresh && (await tryRefresh())) {
    res = await rawFetch(path, init, loadSession()?.access);
  }
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(parseApiError(body, `Erreur API ${res.status}`), res.status, body);
  }
  return res;
}

/** Fichier binaire (PDF, logo) : le jeton est obligatoire, un simple lien <a> ne l'enverrait pas. */
export async function apiBlob(path: string): Promise<Blob> {
  return (await fetchAuthentifie(path, { method: "GET" })).blob();
}

/**
 * Document PDF généré par le backend (facture, avoir, bon de commande, reçu, BL,
 * bon de transfert, bon de sortie) : ouvert dans un nouvel onglet pour l'imprimer,
 * ou téléchargé si `telecharger`. `path` = chemin API complet (ex. /commercial/factures/12/pdf/).
 */
export async function ouvrirPdf(path: string, nomFichier: string, telecharger = false) {
  // L'onglet est ouvert tout de suite (dans le geste de l'utilisateur) pour ne pas être bloqué
  // par le navigateur, puis rempli quand le PDF est prêt.
  const onglet = telecharger ? null : window.open("", "_blank");
  try {
    const blob = await apiBlob(path);
    const url = URL.createObjectURL(blob);
    if (onglet) {
      onglet.location.href = url;
    } else {
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = nomFichier.endsWith(".pdf") ? nomFichier : `${nomFichier}.pdf`;
      lien.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    onglet?.close();
    throw err;
  }
}

/** Envoi multipart (logo de l'entreprise, photo ou bulletin d'analyse). */
export async function apiUpload<T>(path: string, form: FormData, method: "POST" | "PATCH" = "POST"): Promise<T> {
  const res = await fetchAuthentifie(path, { method, body: form });
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path: string) => apiRequest<void>(path, { method: "DELETE" }),
};

function withQuery(path: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return path;
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export async function listAll<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T[]> {
  try {
    const out: T[] = [];
    for (let page = 1; page <= 20; page++) {
      const data = await api.get<Paginated<T> | T[]>(withQuery(path, { ...params, page }));
      if (Array.isArray(data)) return data;
      out.push(...(data.results ?? []));
      if (!data.next) break;
    }
    return out;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 404)) return [];
    throw err;
  }
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const tokens = await apiRequest<{ access: string; refresh: string }>(
    "/auth/connexion/",
    { method: "POST", body: JSON.stringify({ username, password }) },
    false,
  );
  const decoded = decodeJwt(tokens.access);
  const userId = decoded.user_id ?? decoded.userId ?? 0;
  const loginName = decoded.username || username;

  const moi = await fetchMoi(tokens.access);
  if (!moi) {
    throw new ApiError(
      "Ce compte est valide mais son profil métier n’a pas pu être vérifié. Contactez l’Administrateur SI.",
      403,
      null,
    );
  }
  const session: AuthSession = {
    access: tokens.access,
    refresh: tokens.refresh,
    username: moi.username || loginName,
    userId: moi.id || userId,
    profil: moi.profil,
    name: moi.name || loginName,
    email: moi.email,
  };
  saveSession(session);
  return session;
}

export function logout() {
  saveSession(null);
}
