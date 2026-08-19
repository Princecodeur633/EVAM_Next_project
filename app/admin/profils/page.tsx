"use client";

import { ROLE_LABEL } from "@/lib/seed";
import type { Role } from "@/lib/types";
import { PageHeader, Panel } from "@/components/ui";

const ROLES = Object.keys(ROLE_LABEL) as Role[];

export default function ProfilsPage() {
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Profils / rôles" description="Les 12 profils métier du dossier UML. Le menu est structurellement différent, pas seulement grisé." />
      <Panel>
        <ul className="divide-y divide-line">
          {ROLES.map((r) => (
            <li key={r} className="px-4 py-2 text-[13px]">
              {ROLE_LABEL[r]}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
