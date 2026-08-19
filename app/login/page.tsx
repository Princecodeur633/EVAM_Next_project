"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME } from "@/lib/nav";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { ACCENT_CLASS, ROLE_ICONS } from "@/components/icons";
import { Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("production@evam.dz");
  const [password, setPassword] = useState("evam");
  const [error, setError] = useState("");
  const selected = state.users.find((u) => u.email === email);

  function enter(userId: string) {
    const user = state.users.find((u) => u.id === userId && u.active);
    if (!user) return;
    dispatch({ type: "LOGIN", userId: user.id });
    router.replace(ROLE_HOME[user.role]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const user = state.users.find((u) => u.email === email && u.active);
    if (!user || password !== "evam") {
      setError("Identifiants incorrects. Mot de passe démo : evam");
      return;
    }
    enter(user.id);
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <div className="hidden lg:flex w-[38%] bg-sidebar text-white flex-col justify-between p-12">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Unité de production</p>
          <h1 className="text-[44px] font-semibold tracking-[0.22em] mt-4">EVAM</h1>
          <p className="mt-6 text-white/70 max-w-sm leading-relaxed text-[15px]">
            Eau, jus, yaourts. Une saisie, tout le flux : planifier, fabriquer, contrôler, stocker, vendre, encaisser, livrer.
          </p>
        </div>
        <div className="text-[13px] text-white/50 space-y-3">
          <p className="uppercase tracking-[0.16em] text-[10px] text-white/35">Chaîne opératoire</p>
          <p>Planifier → Fabriquer → Contrôler</p>
          <p>Stocker → Vendre → Encaisser → Livrer</p>
          <p>Coûter → Comptabiliser (Sage 100)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-[720px] mx-auto">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Connexion</p>
          <h2 className="text-[24px] font-semibold mt-1">Choisir un poste</h2>
          <p className="text-muted text-[13px] mt-1 mb-6">
            Chaque profil ouvre une interface différente. Cliquez une carte pour entrer — mot de passe démo : <span className="num text-ink">evam</span>
          </p>

          <div className="grid sm:grid-cols-2 gap-2.5 mb-8">
            {state.users.map((u) => {
              const p = ROLE_PROFILES[u.role];
              const Icon = ROLE_ICONS[p.icon];
              const active = email === u.email;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setError("");
                  }}
                  onDoubleClick={() => enter(u.id)}
                  className={cn(
                    "text-left rounded-[8px] border p-3.5 transition-colors bg-white",
                    active ? "border-primary bg-primary-soft/50" : "border-line hover:border-line-strong",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("h-8 w-8 rounded-[6px] text-white flex items-center justify-center shrink-0", ACCENT_CLASS[p.accent])}>
                      <Icon size={15} strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium leading-tight">{p.label}</span>
                      <span className="block text-[11px] text-muted mt-0.5">{u.name} · {p.station}</span>
                      <span className="block text-[12px] text-muted mt-1.5 leading-snug line-clamp-2">{p.mission}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="bg-white border border-line rounded-[8px] p-4 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Field label="Identifiant">
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Mot de passe">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" className="h-9">
              Entrer{selected ? ` · ${ROLE_PROFILES[selected.role].label}` : ""}
            </Button>
            {error && <p className="text-[13px] text-danger sm:col-span-3">{error}</p>}
          </form>
          <p className="text-[12px] text-muted mt-3">Double-clic sur une carte = entrée directe.</p>
        </div>
      </div>
    </div>
  );
}
