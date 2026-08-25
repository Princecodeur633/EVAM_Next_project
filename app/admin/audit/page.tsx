"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const { state, userName } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administration" title="Journal des actions" description="Historique des opérations réalisées dans EVAM." />
      <Panel>
        <DataTable
          columns={[{ key: "d", label: "Date" }, { key: "u", label: "Utilisateur" }, { key: "m", label: "Module" }, { key: "a", label: "Action" }, { key: "doc", label: "Document" }]}
          rows={state.journal.map((j) => ({
            d: formatDateTime(j.date_action),
            u: userName(j.utilisateur),
            m: j.module,
            a: j.action,
            doc: j.document_id || "—",
          }))}
        />
      </Panel>
    </div>
  );
}
