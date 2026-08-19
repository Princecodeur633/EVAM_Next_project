"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { Button, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("production@evam.dz");
  const [password, setPassword] = useState("evam");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const user = state.users.find((u) => u.email === email && u.active);
    if (!user || password !== "evam") {
      setError("Identifiants incorrects. Mot de passe démo : evam");
      return;
    }
    dispatch({ type: "LOGIN", userId: user.id });
    router.replace(ROLE_HOME[user.role]);
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <div className="hidden lg:flex w-[42%] bg-sidebar text-white flex-col justify-between p-12">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Unité de production</p>
          <h1 className="text-[42px] font-semibold tracking-[0.2em] mt-3">EVAM</h1>
          <p className="mt-6 text-white/70 max-w-sm leading-relaxed">
            Une information saisie une fois. Du plan de production à Sage 100, sans ressaisie.
          </p>
        </div>
        <ul className="text-[13px] text-white/55 space-y-2">
          <li>Planifier → Fabriquer → Contrôler</li>
          <li>Stocker → Vendre → Encaisser → Livrer</li>
          <li>Coûter → Comptabiliser</li>
        </ul>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-[380px]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Connexion</p>
          <h2 className="text-[22px] font-semibold mt-1 mb-6">Accéder à EVAM</h2>
          <div className="space-y-3">
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
            {error && <p className="text-[13px] text-danger">{error}</p>}
            <Button type="submit" className="w-full justify-center h-9 mt-2">
              Entrer
            </Button>
          </div>
          <div className="mt-8 border-t border-line pt-4">
            <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Comptes de démonstration</p>
            <div className="grid grid-cols-1 gap-1">
              {state.users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setEmail(u.email)}
                  className="text-left text-[12px] px-2 py-1 hover:bg-white border border-transparent hover:border-line rounded-[4px]"
                >
                  <span className="text-ink">{u.email}</span>
                  <span className="text-muted"> — {ROLE_LABEL[u.role]}</span>
                </button>
              ))}
            </div>
            <p className="text-[12px] text-muted mt-3">Mot de passe unique : <span className="num text-ink">evam</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}
