"use client";

import { BadgeVersion } from "@/components/eau";
import { RefCrud } from "@/components/RefCrud";
import { PageHeader } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { moisCourant, versionsEnVigueur } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { ParametresEau } from "@/lib/types";
import { formatDa, num } from "@/lib/utils";

/** Seuils et jour de clôture du coût de l'eau, par site, versionnés par mois. */
export default function ParametresEauPage() {
  const { state, can } = useStore();
  const writable = can("PARAM_EAU");
  const enVigueur = versionsEnVigueur(state.parametresEau, (p) => p.usine);
  const usine = (id: number) => state.usines.find((u) => u.id === id)?.nom ?? `Site ${id}`;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Coût de l’eau" title="Paramètres du site eau" description="Chaque modification est une nouvelle version, appliquée au plus tôt le mois suivant." />
      <RefCrud<ParametresEau>
        titre="Seuils et clôture"
        items={[...state.parametresEau].sort((a, b) => b.mois_application.localeCompare(a.mois_application))}
        endpoint={endpoints.parametresEau}
        refresh={["parametresEau"]}
        writable={writable}
        rechercheDans={(p) => [p.usine_code, p.mois_application]}
        libelleItem={(p) => `${usine(p.usine)} · ${p.mois_application}`}
        supprimable={(p) => !p.figee}
        vide="Aucun paramètre."
        valeursInitiales={{
          usine: state.usines[0]?.id ?? 0,
          seuil_ecart_standard_pct: "5",
          seuil_volume_minimal_pct: "50",
          taux_rejet_tolere_pct: "",
          seuil_grosse_reparation: "",
          jour_cloture: "10",
          mois_application: moisCourant(),
          motif: "",
        }}
        colonnes={[
          { cle: "u", label: "Site", rendu: (p) => usine(p.usine) },
          { cle: "e", label: "Écart du standard", className: "text-right", rendu: (p) => <span className="num">{num(p.seuil_ecart_standard_pct)} %</span> },
          { cle: "v", label: "Volume minimal", className: "text-right", rendu: (p) => <span className="num">{num(p.seuil_volume_minimal_pct)} %</span> },
          { cle: "r", label: "Rejet toléré", className: "text-right", rendu: (p) => <span className="num">{p.taux_rejet_tolere_pct != null ? `${num(p.taux_rejet_tolere_pct)} %` : "À fixer"}</span> },
          { cle: "g", label: "Grosse réparation", className: "text-right", rendu: (p) => <span className="num">{p.seuil_grosse_reparation != null ? formatDa(num(p.seuil_grosse_reparation)) : "À fixer"}</span> },
          { cle: "j", label: "Clôture", rendu: (p) => `le ${p.jour_cloture} du mois suivant` },
          { cle: "m", label: "À partir de", rendu: (p) => p.mois_application },
          { cle: "s", label: "", rendu: (p) => <BadgeVersion enVigueur={enVigueur.has(p)} figee={p.figee} avenir={p.mois_application > moisCourant()} /> },
        ]}
        champs={[
          { cle: "usine", label: "Site eau", type: "select", requis: true, creationSeulement: true, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
          { cle: "seuil_ecart_standard_pct", label: "Seuil d’écart du coût standard (%)", type: "number", aide: "Au-delà, un nouveau standard est proposé." },
          { cle: "seuil_volume_minimal_pct", label: "Seuil de volume minimal (% du prévu)", type: "number", aide: "En dessous, le standard n’est pas révisé." },
          { cle: "taux_rejet_tolere_pct", label: "Taux de rejet toléré (%)", type: "number", aide: "Vide = à fixer." },
          { cle: "seuil_grosse_reparation", label: "Seuil de « grosse réparation » (FCFA HT)", type: "number", aide: "Vide = à fixer avec l’expert-comptable." },
          { cle: "jour_cloture", label: "Jour de clôture du mois (1 à 28)", type: "number", requis: true },
          { cle: "mois_application", label: "S’applique à partir de", type: "month", requis: true, creationSeulement: true },
          { cle: "motif", label: "Motif de la modification", pleineLargeur: true },
        ]}
      />
    </div>
  );
}
