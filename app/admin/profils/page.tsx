"use client";

import { ROLE_PROFILES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { ACCENT_CLASS, ROLE_ICONS } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

const ROLES = Object.keys(ROLE_PROFILES) as Role[];

export default function ProfilsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Profils métier"
        description="Douze postes. Le menu, la file du jour et les actions suivent le profil — ce n’est pas un simple droit grisé."
      />
      <div className="grid md:grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const p = ROLE_PROFILES[r];
          const Icon = ROLE_ICONS[p.icon];
          return (
            <article key={r} className="evam-card border border-line rounded-[8px] overflow-hidden">
              <div className={cn("h-0.5", ACCENT_CLASS[p.accent])} />
              <div className="p-4">
                <div className="flex items-center gap-2.5">
                  <span className={cn("h-8 w-8 rounded-[6px] text-white flex items-center justify-center", ACCENT_CLASS[p.accent])}>
                    <Icon size={15} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h2 className="text-[14px] font-semibold leading-tight">{p.label}</h2>
                    <p className="text-[11px] text-muted">{p.station}</p>
                  </div>
                </div>
                <p className="text-[13px] mt-3 leading-relaxed">{p.mission}</p>
                <p className="text-[12px] text-muted mt-2">{p.posture}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
