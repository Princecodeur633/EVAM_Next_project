"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { ROLE_PROFILES } from "@/lib/roles";
import { PROFIL_LABEL } from "@/lib/labels";
import type { Profil } from "@/lib/types";

export default function ProfilsPage() {
  const rows = (Object.keys(PROFIL_LABEL) as Profil[]).map((k) => {
    const p = ROLE_PROFILES[k];
    return { p: PROFIL_LABEL[k], s: p.station, m: p.mission };
  });
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administration" title="Profils métier" description="Les douze postes de l’usine : production, qualité, magasin, ventes, caisse, distribution et finance." />
      <Panel>
        <DataTable columns={[{ key: "p", label: "Profil" }, { key: "s", label: "Station" }, { key: "m", label: "Mission" }]} rows={rows} />
      </Panel>
    </div>
  );
}
