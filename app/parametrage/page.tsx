"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    title: "Articles & process",
    blurb: "Ce que l’usine fabrique et comment.",
    items: [
      ["Produits finis", "/parametrage/produits", "Familles eau / jus / yaourt"],
      ["Matières", "/parametrage/matieres", "CMUP en lecture seule"],
      ["Conditionnements", "/parametrage/conditionnements", "Bouteilles, pots, étiquettes"],
      ["Fiches techniques", "/parametrage/fiches-techniques", "Composition, process, qualité"],
      ["Causes de pertes", "/parametrage/causes-pertes", "Liste fermée atelier"],
    ],
  },
  {
    title: "Stock & logistique",
    blurb: "Où ça dort, comment on alerte.",
    items: [
      ["Dépôts", "/parametrage/depots", "PF, matières, quarantaine"],
      ["Unités", "/parametrage/unites", "Conversions fermées"],
      ["Seuils d'alerte", "/parametrage/seuils", "Déclenche l’achat"],
    ],
  },
  {
    title: "Tiers & tarifs",
    blurb: "Qui achète, qui livre, à quel prix.",
    items: [
      ["Clients", "/parametrage/clients", "Comptant / à terme"],
      ["Tarifs", "/parametrage/tarifs", "Grilles par famille"],
      ["Fournisseurs", "/parametrage/fournisseurs", "Délais et articles"],
      ["Modes d'encaissement", "/parametrage/encaissement", "Selon type client"],
    ],
  },
  {
    title: "Gouvernance",
    blurb: "Compteurs, Sage, motifs d’exception.",
    items: [
      ["Motifs de suspension", "/parametrage/motifs-suspension", "Facture hors compta"],
      ["Motifs de réclamation", "/parametrage/motifs-reclamation", "Après-vente"],
      ["Mapping Sage", "/parametrage/sage", "Journaux et comptes"],
      ["Numérotation", "/parametrage/numerotation", "OF, FA, BL"],
      ["Paramètres généraux", "/parametrage/general", "Société, exercice"],
    ],
  },
];

export default function ParametrageHubPage() {
  const { currentUser } = useStore();
  const allow = currentUser ? ROLE_PROFILES[currentUser.role].paramAllow : [];
  const all = currentUser?.role === "administrateur" || allow.includes("*");

  function visible(href: string) {
    if (all) return true;
    return allow.some((p) => href === p || href.startsWith(p + "/"));
  }

  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => visible(i[1])) })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        eyebrow="Référentiel"
        title="Paramétrage"
        description="Saisi une fois, consommé partout. Seuls les objets de votre poste apparaissent ici."
      />
      {groups.length === 0 ? (
        <Panel className="p-6 text-[13px] text-muted">Aucun référentiel à maintenir pour ce profil.</Panel>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Panel key={g.title} className="p-5">
              <h2 className="text-[14px] font-semibold">{g.title}</h2>
              <p className="text-[12px] text-muted mt-0.5 mb-3">{g.blurb}</p>
              <ul className="space-y-1">
                {g.items.map(([label, href, hint]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-baseline justify-between gap-3 rounded-[6px] px-2 py-2 -mx-2 hover:bg-primary-soft",
                      )}
                    >
                      <span className="text-[13px] font-medium text-primary">{label}</span>
                      <span className="text-[12px] text-muted truncate">{hint}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
