"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { CAUSE_PERTE_EAU_LABEL, TYPE_PERTE_EAU_LABEL, optionsDe } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { CausePerteEau, PerteEau, TypePerteEau } from "@/lib/types";
import { dateISO, formatDate, formatQty, num } from "@/lib/utils";

/**
 * Pertes d'eau : un volume estimé, ou un nombre de bouteilles d'un format. Le type découle de la
 * cause (rinçage, lavages, CIP, rejets UF = normales ; fuite, débordement, lot rejeté, casse =
 * anormales) ; pour « Autre », on le choisit avec un commentaire.
 */
export default function PertesEauPage() {
  const { state, can } = useStore();
  const usine = (id: number) => state.usines.find((u) => u.id === id)?.nom ?? `Site ${id}`;
  const formats = state.articles.filter((a) => a.type_article === "PRODUIT_FINI" && a.contenance && a.unite_contenance === "L");

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Traitement de l’eau" title="Pertes d’eau" description="Les pertes normales sont absorbées dans le coût au m³ ; les anormales sont suivies à part." />
      <RefCrud<PerteEau>
        titre="Déclarations"
        items={state.pertesEau}
        endpoint={endpoints.pertesEau}
        refresh={["pertesEau"]}
        writable={can("DECLARER_PERTE_EAU")}
        rechercheDans={(p) => [CAUSE_PERTE_EAU_LABEL[p.cause], p.commentaire]}
        libelleItem={(p) => `${CAUSE_PERTE_EAU_LABEL[p.cause]} · ${formatDate(p.date)}`}
        supprimable={() => true}
        vide="Aucune perte déclarée."
        valeursInitiales={{ usine: state.usines[0]?.id ?? 0, date: dateISO(), cause: "RINCAGE_BOUTEILLES", type_perte: "", volume_estime_m3: "", article: 0, nombre_bouteilles: "", commentaire: "" }}
        colonnes={[
          { cle: "d", label: "Jour", rendu: (p) => formatDate(p.date) },
          { cle: "u", label: "Site", rendu: (p) => usine(p.usine) },
          { cle: "c", label: "Cause", rendu: (p) => `${CAUSE_PERTE_EAU_LABEL[p.cause]}${p.commentaire ? ` · ${p.commentaire}` : ""}` },
          { cle: "t", label: "Type", rendu: (p) => <StatusBadge tone={p.type_perte === "ANORMALE" ? "danger" : "neutral"}>{TYPE_PERTE_EAU_LABEL[p.type_perte]}</StatusBadge> },
          {
            cle: "v",
            label: "Volume",
            className: "text-right",
            rendu: (p) => (
              <span className="inline-flex flex-col items-end">
                <span className="num">{p.volume_m3 != null ? `${formatQty(num(p.volume_m3), 3)} m³` : "—"}</span>
                {p.nombre_bouteilles != null && <span className="text-[11.5px] text-muted">{p.nombre_bouteilles} bouteilles</span>}
              </span>
            ),
          },
          { cle: "p", label: "Saisi par", rendu: (p) => p.saisi_par_nom ?? "—" },
        ]}
        champs={[
          { cle: "usine", label: "Site eau", type: "select", requis: true, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
          { cle: "date", label: "Date", type: "date", requis: true },
          { cle: "cause", label: "Cause", type: "select", requis: true, options: optionsDe<CausePerteEau>(CAUSE_PERTE_EAU_LABEL) },
          { cle: "type_perte", label: "Type", type: "select", requis: true, visible: (f) => f.cause === "AUTRE", options: optionsDe<TypePerteEau>(TYPE_PERTE_EAU_LABEL) },
          { cle: "volume_estime_m3", label: "Volume estimé (m³)", type: "number", aide: "Ou bien un nombre de bouteilles d’un format (pas les deux)." },
          { cle: "article", label: "Format des bouteilles", type: "select", visible: () => formats.length > 0, options: formats.map((a) => ({ value: a.id, label: `${a.code} · ${a.contenance} L` })) },
          { cle: "nombre_bouteilles", label: "Nombre de bouteilles", type: "number", visible: () => formats.length > 0 },
          { cle: "commentaire", label: "Commentaire", pleineLargeur: true, aide: "Obligatoire pour « Autre »." },
        ]}
      />
    </div>
  );
}
