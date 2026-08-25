"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { PROFIL_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function DroitsPage() {
  const { state } = useStore();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administration" title="Droits d'accès" description="Consultez les droits associés à chaque profil métier." />
      <Panel>
        <DataTable
          columns={[
            { key: "p", label: "Profil" },
            { key: "m", label: "Module" },
            { key: "c", label: "Consulter" },
            { key: "cr", label: "Créer" },
            { key: "mo", label: "Modifier" },
            { key: "v", label: "Valider" },
          ]}
          rows={state.droits.map((d) => ({
            p: PROFIL_LABEL[d.profil] ?? d.profil,
            m: d.module,
            c: d.peut_consulter ? "Oui" : "Non",
            cr: d.peut_creer ? "Oui" : "Non",
            mo: d.peut_modifier ? "Oui" : "Non",
            v: d.peut_valider ? "Oui" : "Non",
          }))}
        />
      </Panel>
    </div>
  );
}
