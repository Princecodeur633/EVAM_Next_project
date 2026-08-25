"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Journal d'audit" description="Qui a clôturé, qui a suspendu, qui a exporté Sage." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Utilisateur</th>
              <th className="text-left px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {state.audit.map((a) => (
              <tr key={a.id} className="border-b border-line">
                <td className="px-3 py-2 num whitespace-nowrap">{formatDateTime(a.at)}</td>
                <td className="px-3 py-2">{a.user}</td>
                <td className="px-3 py-2">{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
