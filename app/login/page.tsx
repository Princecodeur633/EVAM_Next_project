"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Moon, Sun } from "lucide-react";
import { ROLE_HOME } from "@/lib/nav";
import { loadSession } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { Button, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
  const { dispatch, state } = useStore();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await dispatch({ type: "LOGIN", username: username.trim(), password });
    setBusy(false);
    const session = loadSession();
    if (!session) return;
    router.replace(ROLE_HOME[session.profil]);
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <div className="hidden lg:flex w-[42%] bg-sidebar text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 evam-grid-bg pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-[10px] bg-white/10 border border-white/15 flex items-center justify-center">
              <Droplets size={20} />
            </span>
            <span>
              <span className="block text-[11px] uppercase tracking-[0.2em] text-white/45">Unité de production</span>
              <span className="block text-[28px] font-bold tracking-[0.18em] leading-none mt-1">EVAM</span>
            </span>
          </div>
          <p className="mt-10 text-white/75 max-w-sm leading-relaxed text-[15px]">
            Eau, jus et yaourts. Un seul outil pour planifier, fabriquer, contrôler, stocker, vendre et livrer.
          </p>
        </div>
        <div className="relative space-y-2 text-[13px] text-white/50">
          <p>Production · Qualité · Stocks</p>
          <p>Ventes · Caisse · Distribution</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <button
          onClick={toggle}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          className="absolute top-5 right-5 h-9 w-9 flex items-center justify-center border border-line rounded-[8px] text-muted hover:text-ink bg-surface"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="w-full max-w-[400px]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-medium lg:hidden">Unité de production · EVAM</p>
          <h1 className="text-[26px] font-semibold tracking-tight mt-1">Bienvenue</h1>
          <p className="text-muted text-[13px] mt-1 mb-7">Connectez-vous pour ouvrir votre espace de travail.</p>

          <form onSubmit={onSubmit} className="evam-card p-5 space-y-4">
            <Field label="Identifiant">
              <input
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </Field>
            <Field label="Mot de passe">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            {state.lastError && <p className="text-[13px] text-danger">{state.lastError}</p>}
            <Button type="submit" className="w-full h-10" disabled={busy || !username || !password}>
              {busy ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
