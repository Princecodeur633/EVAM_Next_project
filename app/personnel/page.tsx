"use client";

import { RefCrud } from "@/components/RefCrud";
import { Guard, PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { TYPE_CONTRAT_LABEL, TYPE_PIECE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Ouvrier, TypeContrat, TypePiece } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const opt = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));

/**
 * Registre des ouvriers : ils travaillent aux étapes de production sans jamais avoir de compte.
 * Le matricule est généré ; un départ se fait en décochant « Actif », avec un motif.
 */
export default function OuvriersPage() {
  const { state, can } = useStore();
  const writable = can("GERER_OUVRIERS");
  // Le backend n’ouvre pas le socle industriel au RH : site et compétences ne se choisissent que s’il est chargé.
  const avecSocle = state.etapesStandard.length > 0;
  const nomUsine = (id: number | null) => state.usines.find((u) => u.id === id)?.nom;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Personnel" title="Ouvriers" description="Fiches des personnes qui travaillent dans le processus de production, sans accès à l’application." />
      {writable && !avecSocle && (
        <Guard variant="warn" title="Site et zones de compétence : à compléter par l’Administrateur SI">
          Votre profil n’a pas accès au socle industriel (usines, étapes). Créez la fiche ici, l’Administrateur SI y ajoute le site et les zones de compétence, sans lesquels l’ouvrier ne peut pas être affecté.
        </Guard>
      )}
      <RefCrud<Ouvrier>
        titre="Registre des ouvriers"
        items={state.ouvriers}
        endpoint={endpoints.ouvriers}
        refresh={["ouvriers", "affectationsOuvriers"]}
        writable={writable}
        rechercheDans={(o) => [o.matricule, o.nom_complet, o.telephone]}
        libelleItem={(o) => `${o.matricule} · ${o.nom_complet}`}
        supprimable={() => true}
        vide="Aucun ouvrier enregistré."
        valeursInitiales={{
          nom: "",
          prenom: "",
          date_naissance: "",
          telephone: "",
          adresse: "",
          type_piece: "",
          numero_piece: "",
          type_contrat: "PERMANENT",
          date_entree: "",
          date_fin_contrat: "",
          usine: 0,
          competences: [],
          actif: true,
          motif_sortie: "",
          observations: "",
        }}
        colonnes={[
          { cle: "m", label: "Matricule", rendu: (o) => <span className="num">{o.matricule}</span> },
          { cle: "n", label: "Nom", rendu: (o) => o.nom_complet },
          {
            cle: "c",
            label: "Contrat",
            rendu: (o) => (
              <span className="inline-flex flex-col">
                <span>{TYPE_CONTRAT_LABEL[o.type_contrat]}</span>
                <span className="text-[11.5px] text-muted">
                  Depuis le {formatDate(o.date_entree)}
                  {o.date_fin_contrat ? ` · fin le ${formatDate(o.date_fin_contrat)}` : ""}
                </span>
              </span>
            ),
          },
          { cle: "u", label: "Site", rendu: (o) => nomUsine(o.usine) ?? "—" },
          { cle: "z", label: "Zones de compétence", rendu: (o) => o.competences_libelles.join(", ") || "—" },
          {
            cle: "s",
            label: "Statut",
            rendu: (o) =>
              !o.actif ? <StatusBadge tone="neutral">Parti</StatusBadge> : o.sous_contrat ? <StatusBadge tone="success">Sous contrat</StatusBadge> : <StatusBadge tone="warning">Hors contrat</StatusBadge>,
          },
        ]}
        champs={[
          { cle: "nom", label: "Nom", requis: true },
          { cle: "prenom", label: "Prénom(s)", requis: true },
          { cle: "date_naissance", label: "Date de naissance", type: "date" },
          { cle: "telephone", label: "Téléphone" },
          { cle: "adresse", label: "Adresse / quartier", pleineLargeur: true },
          { cle: "type_piece", label: "Type de pièce d’identité", type: "select", options: opt<TypePiece>(TYPE_PIECE_LABEL) },
          { cle: "numero_piece", label: "N° de pièce d’identité" },
          { cle: "type_contrat", label: "Type de contrat", type: "select", requis: true, options: opt<TypeContrat>(TYPE_CONTRAT_LABEL) },
          { cle: "date_entree", label: "Date d’entrée", type: "date", requis: true },
          {
            cle: "date_fin_contrat",
            label: "Fin de contrat",
            type: "date",
            aide: "Obligatoire pour un temporaire. Pour un permanent : date de départ prévue, sinon vide.",
          },
          { cle: "usine", label: "Site de rattachement", type: "select", visible: () => avecSocle, options: state.usines.map((u) => ({ value: u.id, label: u.nom })) },
          {
            cle: "competences",
            label: "Zones de compétence",
            type: "multi",
            aide: "Étapes que l’ouvrier sait tenir : il ne peut être affecté qu’à celles-ci.",
            visible: () => avecSocle,
            options: state.etapesStandard.filter((e) => e.actif).map((e) => ({ value: e.id, label: e.libelle })),
          },
          { cle: "actif", label: "Actif (décocher au départ de l’ouvrier)", type: "checkbox", pleineLargeur: true },
          { cle: "motif_sortie", label: "Motif de sortie", requis: true, pleineLargeur: true, visible: (f) => !f.actif },
          { cle: "observations", label: "Observations", type: "textarea" },
        ]}
      />
    </div>
  );
}
