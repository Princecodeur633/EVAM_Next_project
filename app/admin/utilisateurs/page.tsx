"use client";

import { FormEvent, useState } from "react";
import { ROLE_LABEL } from "@/lib/seed";
import { Button, Field, inputClass, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export default function UtilisateursPage() {
  const { state, dispatch, can } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("agent_production");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "CREATE_USER", name, email, role });
    setName("");
    setEmail("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Activation, rattachement profil. Un compte inactif ne se connecte pas. L'administrateur ne saisit pas l'opérationnel."
      />
      {can("ADMIN_USERS") && (
        <Panel className="p-4">
          <h2 className="text-[13px] font-semibold mb-3">Créer un compte</h2>
          <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-2 items-end">
            <Field label="Nom">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Profil">
              <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {Object.entries(ROLE_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit">Créer</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-left px-3 py-2">E-mail</th>
              <th className="text-left px-3 py-2">Profil</th>
              <th className="text-left px-3 py-2">Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => (
              <tr key={u.id} className="border-b border-line">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{ROLE_LABEL[u.role]}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={u.active ? "success" : "neutral"}>{u.active ? "Actif" : "Inactif"}</StatusBadge>
                </td>
                <td className="px-3 py-2 text-right">
                  {can("ADMIN_USERS") && (
                    <Button variant="ghost" onClick={() => dispatch({ type: "TOGGLE_USER", id: u.id })}>
                      {u.active ? "Désactiver" : "Activer"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
