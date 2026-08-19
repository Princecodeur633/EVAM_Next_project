"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";

const GROUPS = [
  {
    title: "Articles & process",
    items: [
      ["Produits finis", "/parametrage/produits"],
      ["Matières", "/parametrage/matieres"],
      ["Conditionnements", "/parametrage/conditionnements"],
      ["Fiches techniques", "/parametrage/fiches-techniques"],
      ["Causes de pertes", "/parametrage/causes-pertes"],
    ],
  },
  {
    title: "Stock & logistique",
    items: [
      ["Dépôts", "/parametrage/depots"],
      ["Unités", "/parametrage/unites"],
      ["Seuils d'alerte", "/parametrage/seuils"],
    ],
  },
  {
    title: "Tiers & tarifs",
    items: [
      ["Clients", "/parametrage/clients"],
      ["Tarifs", "/parametrage/tarifs"],
      ["Fournisseurs", "/parametrage/fournisseurs"],
      ["Modes d'encaissement", "/parametrage/encaissement"],
    ],
  },
  {
    title: "Gouvernance",
    items: [
      ["Motifs de suspension", "/parametrage/motifs-suspension"],
      ["Motifs de réclamation", "/parametrage/motifs-reclamation"],
      ["Mapping Sage", "/parametrage/sage"],
      ["Numérotation", "/parametrage/numerotation"],
      ["Paramètres généraux", "/parametrage/general"],
    ],
  },
];

export default function ParametrageHubPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Paramétrage"
        description="Saisi une fois, consommé partout. On ne mélange jamais un CRUD de référentiel avec une saisie atelier."
      />
      <div className="grid md:grid-cols-2 gap-4">
        {GROUPS.map((g) => (
          <Panel key={g.title} className="p-4">
            <h2 className="text-[13px] font-semibold mb-2">{g.title}</h2>
            <ul className="space-y-1">
              {g.items.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-primary hover:underline">
                    {label}
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
