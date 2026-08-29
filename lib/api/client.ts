"use client";

import type { Paginated, Profil } from "../types";
import { profilFromUsername } from "../labels";

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

function decodeJwt(token: string): { user_id?: number; userId?: number; exp?: number } {
  const payload = token.split(".")[1];
  if (!payload) return {};
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as { user_id?: number; userId?: number; exp?: number };
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
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
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

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const session = loadSession();
  const res = await rawFetch(path, init, session?.access);
  if (res.status === 401 && retry && session?.refresh) {
    const ok = await tryRefresh();
    if (ok) return apiRequest<T>(path, init, false);
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
  let profil = profilFromUsername(username);
  let name = username;
  let email = "";
  const session: AuthSession = {
    access: tokens.access,
    refresh: tokens.refresh,
    username,
    userId,
    profil: profil ?? "CHAUFFEUR",
    name,
    email,
  };
  saveSession(session);
  if (userId) {
    try {
      const me = await api.get<{
        id: number;
        username: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        profil: Profil;
      }>(`/comptes/utilisateurs/${userId}/`);
      profil = me.profil;
      name = `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || me.username;
      email = me.email ?? "";
      saveSession({ ...session, userId: me.id, profil, name, email, username: me.username || username });
    } catch {
      /* Liste utilisateurs réservée ADMIN_SI : on garde le profil déduit du login. */
    }
  }
  return loadSession() ?? session;
}

export function logout() {
  saveSession(null);
}
