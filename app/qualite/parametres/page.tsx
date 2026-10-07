"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { FAMILLE_PARAMETRE_LABEL, LABORATOIRE_LABEL, TYPE_RESULTAT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { FamilleParametre, Laboratoire, TypeResultat } from "@/lib/types";
import { formatDate, formatQty, num } from "@/lib/utils";

/** Paramètres qualité (ce qui se mesure ou s’observe) et instruments de mesure avec leur étalonnage. */
export default function ParametresQualitePage() {
  const { state, can } = useStore();
  const writable = can("PARAM_QUALITE");
  const opt = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));
  const aEtalonner = state.instruments.filter((i) => i.actif && i.etalonnage_valide === false).length;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Qualité"
        title="Paramètres et instruments"
        description="Les paramètres (pH, °Brix, température, serrage bouchon, présence étiquette…) alimentent le plan de contrôle. Un instrument dont l’étalonnage est dépassé est refusé à la saisie d’une mesure."
        status={aEtalonner > 0 ? <StatusBadge tone="danger">{aEtalonner} instrument(s) à étalonner</StatusBadge> : undefined}
      />
      <RefCrud
        titre="Paramètres qualité"
        description="Le poids de l’analyse sert à la clé « analyses pondérées » du coût laboratoire (une analyse microbiologique pèse plus qu’un pH)."
        items={[...state.parametresQualite].sort((a, b) => a.famille.localeCompare(b.famille) || a.libelle.localeCompare(b.libelle))}
        endpoint={endpoints.parametresQualite}
        refresh={["parametresQualite"]}
        writable={writable}
        rechercheDans={(p) => [p.code, p.libelle, p.unite, FAMILLE_PARAMETRE_LABEL[p.famille]]}
        libelleItem={(p) => `${p.code} · ${p.libelle}`}
        valeursInitiales={{ libelle: "", famille: "PHYSICO_CHIMIQUE", type_resultat: "NUMERIQUE", unite: "", methode: "", poids_analyse: 1, actif: true }}
        champs={[
          { cle: "libelle", label: "Paramètre", requis: true },
          { cle: "famille", label: "Famille", type: "select", requis: true, options: opt<FamilleParametre>(FAMILLE_PARAMETRE_LABEL) },
          { cle: "type_resultat", label: "Type de résultat", type: "select", requis: true, options: opt<TypeResultat>(TYPE_RESULTAT_LABEL) },
          { cle: "unite", label: "Unité", placeholder: "pH, °Brix, °C, mL…", aide: "Obligatoire pour une valeur mesurée." },
          { cle: "methode", label: "Méthode par défaut" },
          { cle: "poids_analyse", label: "Poids de l’analyse", type: "number" },
          { cle: "actif", label: "Actif", type: "checkbox" },
        ]}
        colonnes={[
          { cle: "c", label: "Code", rendu: (p) => <span className="num font-medium">{p.code}</span> },
          { cle: "l", label: "Paramètre", rendu: (p) => p.libelle },
          { cle: "f", label: "Famille", rendu: (p) => FAMILLE_PARAMETRE_LABEL[p.famille] },
          { cle: "t", label: "Résultat", rendu: (p) => `${TYPE_RESULTAT_LABEL[p.type_resultat]}${p.unite ? ` (${p.unite})` : ""}` },
          { cle: "p", label: "Poids", className: "text-right", rendu: (p) => <span className="num">{formatQty(num(p.poids_analyse), 2)}</span> },
          { cle: "s", label: "Statut", rendu: (p) => (p.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>) },
        ]}
      />
      <RefCrud
        titre="Instruments de mesure"
        items={state.instruments}
        endpoint={endpoints.instruments}
        refresh={["instruments"]}
        writable={writable}
        rechercheDans={(i) => [i.code, i.designation, i.numero_serie]}
        libelleItem={(i) => `${i.code} · ${i.designation}`}
        valeursInitiales={{ designation: "", numero_serie: "", laboratoire: "LIGNE", date_dernier_etalonnage: "", periodicite_etalonnage_jours: "", actif: true }}
        champs={[
          { cle: "designation", label: "Désignation", requis: true, placeholder: "pH-mètre, réfractomètre…" },
          { cle: "numero_serie", label: "N° appareil / série" },
          { cle: "laboratoire", label: "Utilisé", type: "select", options: opt<Laboratoire>(LABORATOIRE_LABEL) },
          { cle: "date_dernier_etalonnage", label: "Dernier étalonnage / vérification", type: "date" },
          { cle: "periodicite_etalonnage_jours", label: "Périodicité d’étalonnage (jours)", type: "number", aide: "Vide = pas d’étalonnage suivi." },
          { cle: "actif", label: "Actif", type: "checkbox" },
        ]}
        colonnes={[
          { cle: "c", label: "Code", rendu: (i) => <span className="num font-medium">{i.code}</span> },
          { cle: "d", label: "Instrument", rendu: (i) => i.designation },
          { cle: "l", label: "Utilisé", rendu: (i) => LABORATOIRE_LABEL[i.laboratoire] },
          { cle: "e", label: "Dernier étalonnage", rendu: (i) => (i.date_dernier_etalonnage ? formatDate(i.date_dernier_etalonnage) : "—") },
          { cle: "p", label: "Prochaine échéance", rendu: (i) => (i.prochaine_echeance ? formatDate(i.prochaine_echeance) : i.periodicite_etalonnage_jours ? "Jamais réalisé" : "Non suivi") },
          {
            cle: "s",
            label: "Étalonnage",
            rendu: (i) => (!i.actif ? <StatusBadge tone="neutral">Inactif</StatusBadge> : i.etalonnage_valide === false ? <StatusBadge tone="danger">À étalonner</StatusBadge> : <StatusBadge tone="success">Valide</StatusBadge>),
          },
        ]}
      />
    </div>
  );
}
