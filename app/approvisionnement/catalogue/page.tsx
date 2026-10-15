"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

/**
 * Catalogue fournisseurs : qui livre quel article, à quel prix et sous quel délai. Le prix négocié
 * pré-remplit la ligne d'une commande fournisseur ; un seul prix par couple fournisseur / article.
 */
export default function CatalogueFournisseursPage() {
  const { state, can, articleName, fournisseurName } = useStore();
  const writable = can("GERER_CATALOGUE_FOURNISSEURS");
  const achetables = state.articles.filter((a) => a.actif && a.type_article !== "PRODUIT_FINI");
  const contratNumero = (id: number | null) => (id ? (state.contratsFournisseurs.find((c) => c.id === id)?.numero ?? `Contrat n°${id}`) : "—");

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Achats"
        title="Catalogue fournisseurs"
        description="Prix négocié, délai de livraison et référence chez le fournisseur, par article. Ce prix est proposé automatiquement sur les lignes des commandes fournisseurs."
      />
      <RefCrud
        titre="Articles fournis"
        items={[...state.catalogueFournisseurs].sort((a, b) => fournisseurName(a.fournisseur).localeCompare(fournisseurName(b.fournisseur), "fr"))}
        endpoint={endpoints.catalogueFournisseurs}
        refresh={["catalogueFournisseurs"]}
        writable={writable}
        supprimable={() => true}
        rechercheDans={(c) => [fournisseurName(c.fournisseur), articleName(c.article), c.reference_fournisseur]}
        libelleItem={(c) => `${articleName(c.article)} chez ${fournisseurName(c.fournisseur)}`}
        valeursInitiales={{ fournisseur: 0, article: 0, contrat: 0, prix_unitaire: "", delai_livraison_jours: "", reference_fournisseur: "" }}
        champs={[
          { cle: "fournisseur", label: "Fournisseur", type: "select", requis: true, options: state.fournisseurs.filter((f) => f.actif).map((f) => ({ value: f.id, label: f.nom })) },
          { cle: "article", label: "Article fourni", type: "select", requis: true, options: achetables.map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` })) },
          { cle: "prix_unitaire", label: "Prix unitaire négocié (FCFA)", type: "number", requis: true },
          { cle: "delai_livraison_jours", label: "Délai de livraison (jours)", type: "number" },
          { cle: "reference_fournisseur", label: "Référence chez le fournisseur" },
          {
            cle: "contrat",
            label: "Contrat associé",
            type: "select",
            aide: "Contrat du même fournisseur (facultatif).",
            options: state.contratsFournisseurs.map((c) => ({ value: c.id, label: `${c.numero} · ${fournisseurName(c.fournisseur)}` })),
          },
        ]}
        colonnes={[
          { cle: "f", label: "Fournisseur", rendu: (c) => <span className="font-medium">{fournisseurName(c.fournisseur)}</span> },
          { cle: "a", label: "Article", rendu: (c) => articleName(c.article) },
          { cle: "p", label: "Prix négocié", className: "text-right", rendu: (c) => <span className="num">{formatDa(num(c.prix_unitaire))}</span> },
          { cle: "d", label: "Délai", className: "text-right", rendu: (c) => (c.delai_livraison_jours != null ? `${c.delai_livraison_jours} j` : "—") },
          { cle: "r", label: "Réf. fournisseur", rendu: (c) => c.reference_fournisseur || "—" },
          { cle: "c", label: "Contrat", rendu: (c) => contratNumero(c.contrat) },
        ]}
      />
    </div>
  );
}
