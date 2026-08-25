"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { displayName, PROFIL_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Profil } from "@/lib/types";

export default function UtilisateursPage() {
  const { state, dispatch, can } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profil, setProfil] = useState<Profil>("AGENT_PRODUCTION");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administration" title="Utilisateurs" description="Créez les comptes de l’usine et activez ou désactivez un accès." />
      {can("ADMIN_USERS") && (
        <Panel className="p-4 grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <Field label="Prénom"><input className={inputClass} value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
          <Field label="Nom"><input className={inputClass} value={last} onChange={(e) => setLast(e.target.value)} /></Field>
          <Field label="Identifiant"><input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
          <Field label="Mot de passe"><input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Field label="Profil">
            <select className={inputClass} value={profil} onChange={(e) => setProfil(e.target.value as Profil)}>
              {(Object.keys(PROFIL_LABEL) as Profil[]).map((k) => <option key={k} value={k}>{PROFIL_LABEL[k]}</option>)}
            </select>
          </Field>
          <Button disabled={!username || !password} onClick={() => void dispatch({ type: "CREATE_USER", username, password, profil, first_name: first, last_name: last })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "Nom" }, { key: "p", label: "Profil" }, { key: "u", label: "Identifiant" }, { key: "a", label: "Actif" }, { key: "act", label: "" }]}
          rows={state.utilisateurs.map((u) => ({
            n: displayName(u),
            p: PROFIL_LABEL[u.profil] ?? u.profil,
            u: u.username,
            a: u.actif ? "Oui" : "Non",
            act: can("ADMIN_USERS") ? (
              <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "TOGGLE_USER", id: u.id, actif: !u.actif })}>
                {u.actif ? "Désactiver" : "Activer"}
              </button>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
