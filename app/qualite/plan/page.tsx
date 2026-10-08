"use client";

import { useState } from "react";
import { CopyPlus, Power, PowerOff } from "lucide-react";
import { DrawerSection } from "@/components/Drawer";
import { Segmented } from "@/components/Filters";
import { RefCrud } from "@/components/RefCrud";
import { Button, PageHeader, StatusBadge } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { DECLENCHEUR_LABEL, LABORATOIRE_LABEL, STATUT_POINT_CONTROLE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Declencheur, Laboratoire, PointControle, StatutPointControle } from "@/lib/types";
import { formatQty, num } from "@/lib/utils";

const TONE: Record<StatutPointControle, "warning" | "success" | "neutral"> = { BROUILLON: "warning", ACTIF: "success", INACTIF: "neutral" };

function critere(p: PointControle) {
  const m: string[] = [];
  if (p.valeur_min != null) m.push(`min ${formatQty(num(p.valeur_min), 3)}`);
  if (p.valeur_max != null) m.push(`max ${formatQty(num(p.valeur_max), 3)}`);
  if (p.valeur_cible != null) m.push(`cible ${formatQty(num(p.valeur_cible), 3)}${p.tolerance != null ? ` ± ${formatQty(num(p.tolerance), 3)}` : ""}`);
  return m.join(", ");
}

/**
 * Plan de contrôle : quoi contrôler, où (étape, poste, machine, point de prélèvement), pour quoi
 * (activité, format, recette), selon quels critères, quand (déclencheur, fréquence), comment
 * (échantillon, méthode, instrument) et avec quelle conséquence (bloquant). Rien n’est inventé :
 * un contrôle mesuré ne s’active qu’avec ses critères, repris de la fiche qualité validée.
 */
export default function PlanControlePage() {
  const { state, can, articleName } = useStore();
  const writable = can("PARAM_QUALITE");
  const [vue, setVue] = useState<"ACTIFS" | "BROUILLONS" | "TOUS">("ACTIFS");
  const items = state.planControle
    .filter((p) => (vue === "ACTIFS" ? p.statut === "ACTIF" : vue === "BROUILLONS" ? p.statut === "BROUILLON" : true))
    .sort((a, b) => (a.activite_code ?? "").localeCompare(b.activite_code ?? "") || a.code.localeCompare(b.code));
  const opt = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));
  const etapes = [...state.etapesStandard].sort((a, b) => a.ordre_reference - b.ordre_reference).map((e) => ({ value: e.id, label: e.libelle }));
  const run = useRun();

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Qualité"
        title="Plan de contrôle"
        description="Chaque ligne du plan génère les contrôles à réaliser : à la réception d’un lot matière, au démarrage de l’OF, une fois par OF, à chaque lot, périodiquement ou après un changement de série. Un contrôle ayant des résultats ne change plus : désactivez-le et créez une nouvelle version."
      />
      <Segmented
        label="Statut"
        value={vue}
        onChange={setVue}
        options={[
          { value: "ACTIFS", label: "Actifs", count: state.planControle.filter((p) => p.statut === "ACTIF").length },
          { value: "BROUILLONS", label: "Brouillons", count: state.planControle.filter((p) => p.statut === "BROUILLON").length },
          { value: "TOUS", label: "Tous", count: state.planControle.length },
        ]}
      />
      <RefCrud
        titre="Points de contrôle"
        items={items}
        endpoint={endpoints.planControle}
        refresh={["planControle"]}
        writable={writable}
        rechercheDans={(p) => [p.code, p.designation, p.parametre_libelle, p.activite_code, p.etape_libelle, p.point_prelevement]}
        libelleItem={(p) => `${p.code} v${p.version} · ${p.designation}`}
        supprimable={(p) => p.statut === "BROUILLON"}
        valeursInitiales={{
          modele: 0,
          designation: "",
          parametre: 0,
          activite: 0,
          article: 0,
          fiche_technique: 0,
          etape: 0,
          poste: 0,
          equipement: 0,
          point_prelevement: "",
          valeur_cible: "",
          valeur_min: "",
          valeur_max: "",
          tolerance: "",
          bloquant: false,
          obligatoire: false,
          declencheur: "CHAQUE_OF",
          frequence_minutes: "",
          frequence_quantite: "",
          type_echantillon: "",
          quantite_echantillon: "",
          nombre_echantillons: 1,
          echantillon_conserve: false,
          methode: "",
          instrument: 0,
          laboratoire: "LIGNE",
          actions_si_non_conforme: "",
          document_reference: "",
          date_debut: "",
          date_fin: "",
        }}
        champs={[
          {
            cle: "modele",
            label: "Depuis la bibliothèque",
            type: "select",
            creationSeulement: true,
            pleineLargeur: true,
            aide: "Paramètre, instrument, méthode, échantillon, obligatoire / bloquant repris du modèle pour les champs laissés vides.",
            options: state.modelesControle.filter((m) => m.actif).map((m) => ({ value: m.id, label: `${m.code} · ${m.designation}` })),
          },
          { cle: "designation", label: "Désignation", aide: "Vide : celle du modèle." },
          { cle: "parametre", label: "Paramètre contrôlé", type: "select", aide: "Obligatoire sans modèle.", options: state.parametresQualite.filter((p) => p.actif).map((p) => ({ value: p.id, label: `${p.libelle}${p.unite ? ` (${p.unite})` : ""}` })) },
          { cle: "declencheur", label: "Fréquence / déclenchement", type: "select", requis: true, options: opt<Declencheur>(DECLENCHEUR_LABEL) },
          { cle: "frequence_minutes", label: "Toutes les (minutes)", type: "number", visible: (f) => f.declencheur === "PERIODIQUE" },
          {
            cle: "frequence_quantite",
            label: "Toutes les (quantité produite)",
            type: "number",
            requis: true,
            aide: "Quantité saisie à l’étape du contrôle : unités, litres ou m³ (ex. 5 000).",
            visible: (f) => f.declencheur === "PAR_QUANTITE",
          },
          { cle: "activite", label: "Activité (sauf contrôle de réception)", type: "select", options: state.activites.map((a) => ({ value: a.id, label: a.designation })) },
          {
            cle: "article",
            label: "Format / matière (vide = tous les formats)",
            type: "select",
            options: state.articles.filter((a) => a.actif).map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` })),
          },
          { cle: "fiche_technique", label: "Recette (version)", type: "select", options: state.fichesTechniques.filter((f) => f.statut !== "ARCHIVEE").map((f) => ({ value: f.id, label: `${articleName(f.article)} v${f.version}` })) },
          { cle: "etape", label: "Étape du circuit", type: "select", options: etapes },
          { cle: "poste", label: "Poste", type: "select", options: state.postes.map((p) => ({ value: p.id, label: p.code })) },
          { cle: "equipement", label: "Machine / équipement", type: "select", options: state.equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })) },
          { cle: "point_prelevement", label: "Point de prélèvement", placeholder: "sortie UV, cuve tampon…" },
          { cle: "valeur_min", label: "Valeur minimale", type: "number" },
          { cle: "valeur_max", label: "Valeur maximale", type: "number" },
          { cle: "valeur_cible", label: "Valeur cible", type: "number" },
          { cle: "tolerance", label: "Tolérance (±)", type: "number", aide: "S’applique autour de la valeur cible." },
          { cle: "bloquant", label: "Contrôle bloquant (bloque le lot et la clôture de l’OF tant que la NC n’est pas traitée)", type: "checkbox", pleineLargeur: true },
          { cle: "obligatoire", label: "Contrôle obligatoire (le lot n’est pas libéré, ni l’OF clôturé, tant qu’il n’est pas réalisé)", type: "checkbox", pleineLargeur: true },
          { cle: "type_echantillon", label: "Type d’échantillon" },
          { cle: "quantite_echantillon", label: "Quantité d’échantillon" },
          { cle: "nombre_echantillons", label: "Nombre d’échantillons", type: "number" },
          { cle: "laboratoire", label: "Réalisé", type: "select", options: opt<Laboratoire>(LABORATOIRE_LABEL) },
          { cle: "instrument", label: "Instrument", type: "select", options: state.instruments.filter((i) => i.actif).map((i) => ({ value: i.id, label: `${i.code} · ${i.designation}` })) },
          { cle: "methode", label: "Méthode" },
          { cle: "echantillon_conserve", label: "Échantillon témoin conservé", type: "checkbox" },
          { cle: "date_debut", label: "Applicable à partir du", type: "date" },
          { cle: "date_fin", label: "Applicable jusqu’au", type: "date" },
          { cle: "document_reference", label: "Procédure / fiche de référence", pleineLargeur: true },
          { cle: "actions_si_non_conforme", label: "Actions en cas de non-conformité", type: "textarea" },
        ]}
        colonnes={[
          { cle: "c", label: "Code", rendu: (p) => <span className="num font-medium">{p.code} v{p.version}</span> },
          {
            cle: "d",
            label: "Contrôle",
            rendu: (p) => (
              <span className="inline-flex flex-col">
                <span className="font-medium">{p.designation}</span>
                <span className="text-[11.5px] text-muted">
                  {p.parametre_libelle}
                  {p.unite ? ` (${p.unite})` : ""}
                </span>
              </span>
            ),
          },
          { cle: "o", label: "Où", rendu: (p) => [p.activite_code, p.article ? articleName(p.article) : null, p.etape_libelle].filter(Boolean).join(" · ") || "Réception" },
          { cle: "k", label: "Critère", rendu: (p) => critere(p) || <span className="text-warning">À renseigner</span> },
          {
            cle: "q",
            label: "Quand",
            rendu: (p) =>
              `${DECLENCHEUR_LABEL[p.declencheur]}${p.declencheur === "PERIODIQUE" && p.frequence_minutes ? ` (${p.frequence_minutes} min)` : ""}${
                p.declencheur === "PAR_QUANTITE" && p.frequence_quantite ? ` (${formatQty(num(p.frequence_quantite), 0)})` : ""
              }`,
          },
          {
            cle: "s",
            label: "Statut",
            rendu: (p) => (
              <span className="inline-flex flex-col gap-0.5">
                <StatusBadge tone={TONE[p.statut]}>{STATUT_POINT_CONTROLE_LABEL[p.statut]}</StatusBadge>
                {p.bloquant && <span className="text-[11px] text-danger font-medium">Bloquant</span>}
                {p.obligatoire && !p.bloquant && <span className="text-[11px] text-warning font-medium">Obligatoire</span>}
              </span>
            ),
          },
        ]}
        actionsDrawer={(p, fermer) =>
          writable ? (
            <DrawerSection title="Statut et version" hint="Un contrôle mesuré ne s’active qu’avec ses critères (min / max ou cible ± tolérance).">
              <div className="flex flex-wrap gap-2">
                {p.statut !== "ACTIF" && (
                  <Button variant="success" onClick={() => void run(() => actions.activerPointControle(p.id), fermer)}>
                    <Power size={14} /> Activer
                  </Button>
                )}
                {p.statut === "ACTIF" && (
                  <Button variant="secondary" onClick={() => void run(() => actions.desactiverPointControle(p.id), fermer)}>
                    <PowerOff size={14} /> Désactiver
                  </Button>
                )}
                {p.statut !== "BROUILLON" && (
                  <Button variant="secondary" onClick={() => void run(() => actions.nouvelleVersionPointControle(p.id), fermer)}>
                    <CopyPlus size={14} /> Nouvelle version
                  </Button>
                )}
              </div>
            </DrawerSection>
          ) : null
        }
      />
    </div>
  );
}

function useRun() {
  const { dispatch } = useStore();
  return async (fn: () => Promise<unknown>, fermer: () => void) => {
    if (await dispatch({ type: "EXEC", run: fn, refresh: ["planControle"] })) fermer();
  };
}
