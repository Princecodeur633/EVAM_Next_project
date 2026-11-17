"use client";

import { BadgeVersion } from "@/components/eau";
import { RefCrud } from "@/components/RefCrud";
import { Guard, PageHeader } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { moisCourant, versionsEnVigueur } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { PrevisionCaptageEau, PrevisionVolumeEau } from "@/lib/types";
import { formatQty, num } from "@/lib/utils";

const MOTIF = { cle: "motif", label: "Motif de la modification", pleineLargeur: true };
const MOIS = { cle: "mois_application", label: "S’applique à partir de", type: "month" as const, requis: true, aide: "Une modification s’applique au plus tôt le mois suivant." };

/**
 * Prévisionnel du coût de l'eau : bouteilles prévues par format (volume = bouteilles × contenance)
 * et partage du forage entre le site eau et les autres sites.
 */
export default function PrevisionsEauPage() {
  const { state, can } = useStore();
  const volumes = can("PREVOIR_VOLUMES_EAU");
  const captage = can("PARAM_EAU");
  const vVolumes = versionsEnVigueur(state.previsionsVolumesEau, (p) => `${p.usine}-${p.article}`);
  const vCaptage = versionsEnVigueur(state.previsionsCaptageEau, (p) => p.usine);
  const usine = (id: number) => state.usines.find((u) => u.id === id)?.nom ?? `Site ${id}`;
  // Formats : produits finis dont la contenance est en litres (volume = bouteilles × contenance ÷ 1 000).
  const formats = state.articles.filter((a) => a.type_article === "PRODUIT_FINI" && a.contenance && a.unite_contenance === "L");
  const badge = (v: { mois_application: string; figee: boolean }, enVigueur: boolean) => <BadgeVersion enVigueur={enVigueur} figee={v.figee} avenir={v.mois_application > moisCourant()} />;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Coût de l’eau" title="Prévisions" description="Volume d’eau du mois et part du site eau dans le forage : les deux bases du coût au m³." />
      {volumes && formats.length === 0 && (
        <Guard variant="warn" title="Aucun format disponible">
          Les formats sont les produits finis dont la contenance est renseignée en litres (Référentiel › Articles › fiche industrielle).
        </Guard>
      )}
      <RefCrud<PrevisionVolumeEau>
        titre="Bouteilles prévues par mois et par format"
        items={[...state.previsionsVolumesEau].sort((a, b) => a.article_code.localeCompare(b.article_code) || b.mois_application.localeCompare(a.mois_application))}
        endpoint={endpoints.previsionsVolumesEau}
        refresh={["previsionsVolumesEau"]}
        writable={volumes && formats.length > 0}
        rechercheDans={(p) => [p.article_code, p.mois_application]}
        libelleItem={(p) => `${p.article_code} · ${p.mois_application}`}
        supprimable={(p) => !p.figee}
        vide="Aucune prévision : le calcul est impossible sans volume."
        valeursInitiales={{ usine: state.usines[0]?.id ?? 0, article: 0, bouteilles_par_mois: "", mois_application: moisCourant(), motif: "" }}
        colonnes={[
          { cle: "a", label: "Format", rendu: (p) => p.article_code },
          { cle: "u", label: "Site", rendu: (p) => usine(p.usine) },
          { cle: "b", label: "Bouteilles / mois", className: "text-right", rendu: (p) => <span className="num">{formatQty(p.bouteilles_par_mois, 0)}</span> },
          { cle: "v", label: "Volume (m³)", className: "text-right", rendu: (p) => <span className="num">{formatQty(num(p.volume_m3), 3)}</span> },
          { cle: "m", label: "À partir de", rendu: (p) => p.mois_application },
          { cle: "s", label: "", rendu: (p) => badge(p, vVolumes.has(p)) },
        ]}
        champs={[
          { cle: "usine", label: "Site eau", type: "select", requis: true, creationSeulement: true, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
          { cle: "article", label: "Format", type: "select", requis: true, creationSeulement: true, options: formats.map((a) => ({ value: a.id, label: `${a.code} · ${a.contenance} L` })) },
          { cle: "bouteilles_par_mois", label: "Bouteilles prévues par mois", type: "number", requis: true, aide: "Format abandonné : nouvelle version à 0." },
          { ...MOIS, creationSeulement: true },
          MOTIF,
        ]}
      />
      {(captage || state.previsionsCaptageEau.length > 0) && (
        <RefCrud<PrevisionCaptageEau>
          titre="Partage du forage (m³ captés par mois)"
          description="Part du site eau = m³ vers le site eau ÷ m³ captés au total ; elle s’applique à toutes les charges du forage."
          items={[...state.previsionsCaptageEau].sort((a, b) => b.mois_application.localeCompare(a.mois_application))}
          endpoint={endpoints.previsionsCaptageEau}
          refresh={["previsionsCaptageEau"]}
          writable={captage}
          rechercheDans={(p) => [p.mois_application]}
          libelleItem={(p) => `${usine(p.usine)} · ${p.mois_application}`}
          supprimable={(p) => !p.figee}
          vide="Aucun partage : le coût du forage ne peut pas être calculé."
          valeursInitiales={{ usine: state.usines[0]?.id ?? 0, volume_site_eau_m3: "", volume_autres_sites_m3: "", mois_application: moisCourant(), motif: "" }}
          colonnes={[
            { cle: "u", label: "Site", rendu: (p) => usine(p.usine) },
            { cle: "e", label: "Vers le site eau", className: "text-right", rendu: (p) => <span className="num">{formatQty(num(p.volume_site_eau_m3), 3)} m³</span> },
            { cle: "o", label: "Vers les autres sites", className: "text-right", rendu: (p) => <span className="num">{formatQty(num(p.volume_autres_sites_m3), 3)} m³</span> },
            { cle: "p", label: "Part du site eau", className: "text-right", rendu: (p) => <span className="num">{formatQty(num(p.part_site_eau) * 100, 2)} %</span> },
            { cle: "m", label: "À partir de", rendu: (p) => p.mois_application },
            { cle: "s", label: "", rendu: (p) => badge(p, vCaptage.has(p)) },
          ]}
          champs={[
            { cle: "usine", label: "Site eau", type: "select", requis: true, creationSeulement: true, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
            { cle: "volume_site_eau_m3", label: "Eau captée vers le site eau (m³/mois)", type: "number", requis: true },
            { cle: "volume_autres_sites_m3", label: "Eau captée vers les autres sites (m³/mois)", type: "number", requis: true },
            { ...MOIS, creationSeulement: true },
            MOTIF,
          ]}
        />
      )}
    </div>
  );
}
