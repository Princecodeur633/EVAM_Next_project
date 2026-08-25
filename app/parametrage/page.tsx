"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    title: "Référentiel articles",
    items: [
      ["Articles", "/parametrage/produits", "Eau, jus, yaourts"],
      ["Matières", "/parametrage/matieres", "Matières premières"],
      ["Conditionnements", "/parametrage/conditionnements", "Cartons et palettes"],
      ["Fiches techniques", "/parametrage/fiches-techniques", "Recettes de fabrication"],
    ],
  },
  {
    title: "Stocks & tiers",
    items: [
      ["Dépôts", "/parametrage/depots", "Magasins"],
      ["Unités de mesure", "/parametrage/unites", "Litre, kg, carton…"],
      ["Clients", "/parametrage/clients", "Fiches clients"],
      ["Tarifs", "/parametrage/tarifs", "Prix de vente"],
      ["Fournisseurs", "/parametrage/fournisseurs", "Fournisseurs matières"],
    ],
  },
];

export default function ParametrageHubPage() {
  const { currentUser } = useStore();
  const allow = currentUser ? ROLE_PROFILES[currentUser.role].paramAllow : [];
  const all = currentUser?.role === "ADMIN_SI" || allow.includes("*");

  function visible(href: string) {
    if (all) return true;
    return allow.some((p) => href === p || href.startsWith(p + "/"));
  }

  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => visible(i[1])) })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader eyebrow="Référentiel" title="Paramétrage" description="Articles, matières, fiches techniques, dépôts, clients, tarifs et fournisseurs." />
      <div className="grid md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <Panel key={g.title} className="p-5">
            <h2 className="text-[14px] font-semibold">{g.title}</h2>
            <ul className="space-y-1 mt-3">
              {g.items.map(([label, href, hint]) => (
                <li key={href}>
                  <Link href={href} className={cn("flex items-baseline justify-between gap-3 rounded-[6px] px-2 py-2 -mx-2 hover:bg-primary-soft")}>
                    <span className="text-[13px] font-medium text-primary">{label}</span>
                    <span className="text-[12px] text-muted truncate">{hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
