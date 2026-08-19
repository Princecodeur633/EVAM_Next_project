"use client";

import { ROLE_LABEL } from "@/lib/seed";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function UtilisateursPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Utilisateurs" description="Activation, rattachement profil. Un compte inactif ne se connecte pas." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-left px-3 py-2">E-mail</th>
              <th className="text-left px-3 py-2">Profil</th>
              <th className="text-left px-3 py-2">Statut</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
