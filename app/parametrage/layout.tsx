"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ITEM_ICONS } from "@/components/icons";
import { Tabs } from "@/components/Tabs";
import { flattenNav, REF_TABS } from "@/lib/nav";
import { canReadParam } from "@/lib/roles";
import { useStore } from "@/lib/store";

/** Hub « Référentiel » : en-tête commun et onglets au-dessus de chaque page du référentiel. */
export default function ParametrageLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const role = currentUser?.role ?? null;
  const hub = role != null && flattenNav(role).some((i) => i.href === "/parametrage");
  const tabs = REF_TABS.filter((t) => canReadParam(role, t.href)).map((t) => ({ value: t.href, href: t.href, label: t.label, icon: ITEM_ICONS[t.href] }));
  const current = tabs.find((t) => pathname === t.value || pathname.startsWith(t.value + "/"));

  if (!hub || !current) return <>{children}</>;

  return (
    <div className="space-y-5">
      <div className="anim-in">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-1 font-medium">Configuration</p>
        <h1 className="text-[20px] sm:text-[24px] leading-tight font-semibold tracking-tight">Référentiel</h1>
        <Tabs label="Référentiel" items={tabs} value={current.value} className="mt-3" />
      </div>
      {children}
    </div>
  );
}
