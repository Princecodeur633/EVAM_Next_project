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
        title="Paramètres, instruments et bibliothèque"
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
        rechercheDans={(i) => [i.code, i.designation, i.numero_serie, i.type_instrument, i.grandeur_mesuree]}
        libelleItem={(i) => `${i.code} · ${i.designation}`}
        valeursInitiales={{
          designation: "",
          type_instrument: "",
          grandeur_mesuree: "",
          unite: "",
          activite: 0,
          numero_serie: "",
          laboratoire: "LIGNE",
          date_dernier_etalonnage: "",
          periodicite_etalonnage_jours: "",
          actif: true,
        }}
        champs={[
          { cle: "designation", label: "Désignation", requis: true, placeholder: "pH-mètre ligne 1…" },
          { cle: "type_instrument", label: "Type", placeholder: "pH-mètre, réfractomètre, sonde, balance, couplemètre…" },
          { cle: "grandeur_mesuree", label: "Mesure", placeholder: "pH, °Brix, température, couple…" },
          { cle: "unite", label: "Unité" },
          { cle: "activite", label: "Activité", type: "select", aide: "Vide = commun à toutes les activités.", options: state.activites.map((a) => ({ value: a.id, label: a.designation })) },
          { cle: "numero_serie", label: "N° appareil / série" },
          { cle: "laboratoire", label: "Utilisé", type: "select", options: opt<Laboratoire>(LABORATOIRE_LABEL) },
          { cle: "date_dernier_etalonnage", label: "Dernier étalonnage / vérification", type: "date" },
          { cle: "periodicite_etalonnage_jours", label: "Périodicité d’étalonnage (jours)", type: "number", aide: "Vide = pas d’étalonnage suivi." },
          { cle: "actif", label: "Actif", type: "checkbox" },
        ]}
        colonnes={[
          { cle: "c", label: "Code", rendu: (i) => <span className="num font-medium">{i.code}</span> },
          {
            cle: "d",
            label: "Instrument",
            rendu: (i) => (
              <span className="inline-flex flex-col">
                <span>{i.designation}</span>
                {(i.type_instrument || i.grandeur_mesuree) && (
                  <span className="text-[11.5px] text-muted">{[i.type_instrument, i.grandeur_mesuree && `${i.grandeur_mesuree}${i.unite ? ` (${i.unite})` : ""}`].filter(Boolean).join(" · ")}</span>
                )}
              </span>
            ),
          },
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
      <RefCrud
        titre="Bibliothèque de contrôles"
        description="Contrôles types enregistrés une fois (paramètre, instrument, méthode, échantillon, obligatoire / bloquant) : un point du plan créé depuis un modèle reprend ces valeurs."
        items={state.modelesControle}
        endpoint={endpoints.modelesControle}
        refresh={["modelesControle"]}
        writable={writable}
        rechercheDans={(m) => [m.code, m.designation, m.parametre_libelle, m.methode]}
        libelleItem={(m) => `${m.code} · ${m.designation}`}
        valeursInitiales={{
          designation: "",
          parametre: 0,
          instrument: 0,
          methode: "",
          laboratoire: "LIGNE",
          type_echantillon: "",
          quantite_echantillon: "",
          nombre_echantillons: 1,
          obligatoire: false,
          bloquant: false,
          actions_si_non_conforme: "",
          actif: true,
        }}
        champs={[
          { cle: "designation", label: "Désignation", requis: true },
          { cle: "parametre", label: "Paramètre", type: "select", requis: true, options: state.parametresQualite.filter((p) => p.actif).map((p) => ({ value: p.id, label: `${p.libelle}${p.unite ? ` (${p.unite})` : ""}` })) },
          { cle: "instrument", label: "Instrument", type: "select", options: state.instruments.filter((i) => i.actif).map((i) => ({ value: i.id, label: `${i.code} · ${i.designation}` })) },
          { cle: "laboratoire", label: "Réalisé", type: "select", options: opt<Laboratoire>(LABORATOIRE_LABEL) },
          { cle: "methode", label: "Méthode" },
          { cle: "type_echantillon", label: "Type d’échantillon" },
          { cle: "quantite_echantillon", label: "Quantité d’échantillon" },
          { cle: "nombre_echantillons", label: "Nombre d’échantillons", type: "number" },
          { cle: "obligatoire", label: "Obligatoire par défaut", type: "checkbox" },
          { cle: "bloquant", label: "Bloquant par défaut", type: "checkbox" },
          { cle: "actions_si_non_conforme", label: "Actions en cas de non-conformité", type: "textarea" },
          { cle: "actif", label: "Actif", type: "checkbox" },
        ]}
        colonnes={[
          { cle: "c", label: "Code", rendu: (m) => <span className="num font-medium">{m.code}</span> },
          { cle: "d", label: "Contrôle", rendu: (m) => m.designation },
          { cle: "p", label: "Paramètre", rendu: (m) => m.parametre_libelle ?? "—" },
          { cle: "l", label: "Réalisé", rendu: (m) => LABORATOIRE_LABEL[m.laboratoire] },
          {
            cle: "s",
            label: "Par défaut",
            rendu: (m) => [m.obligatoire && "Obligatoire", m.bloquant && "Bloquant"].filter(Boolean).join(" · ") || "—",
          },
          { cle: "a", label: "Statut", rendu: (m) => (m.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>) },
        ]}
      />
    </div>
  );
}
