"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { ROLE_PROFILES } from "@/lib/roles";
import type { Profil } from "@/lib/types";

const PROFILS = Object.keys(ROLE_PROFILES) as Profil[];

export default function DroitsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Profils & accès"
        description="La matrice MatriceDroit a été retirée du backend. Les droits sont désormais fixés par profil dans le code (ViewSets Django + menus frontend)."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "p", label: "Profil" },
            { key: "s", label: "Poste" },
            { key: "o", label: "Possède" },
            { key: "n", label: "Ne fait pas" },
            { key: "param", label: "Référentiel" },
          ]}
          rows={PROFILS.map((profil) => {
            const r = ROLE_PROFILES[profil];
            return {
              p: r.label,
              s: r.station,
              o: r.owns.join(" · "),
              n: r.never.join(" · "),
              param: r.paramAllow.includes("*")
                ? "Tout"
                : r.paramAllow.length || r.paramRead?.length
                  ? [...r.paramAllow, ...(r.paramRead ?? [])].join(", ")
                  : "—",
            };
          })}
        />
      </Panel>
    </div>
  );
}
