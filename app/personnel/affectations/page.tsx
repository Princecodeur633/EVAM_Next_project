"use client";

import { useState } from "react";
import { RefCrud } from "@/components/RefCrud";
import { Segmented } from "@/components/Filters";
import { Button, Field, Guard, PageHeader, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { AffectationOuvrier, Ouvrier } from "@/lib/types";
import { dateISO, formatDate } from "@/lib/utils";

/**
 * Affectations des ouvriers : à une étape ou un poste pour une période (un seul poste à la fois),
 * ou à l’équipe d’un OF (plusieurs OF possibles, période reprise du planning si elle est vide).
 * Le backend contrôle le contrat, la compétence et les chevauchements.
 */
export default function AffectationsPage() {
  const { state, can } = useStore();
  const [filtre, setFiltre] = useState<"ACTIVES" | "TOUTES">("ACTIVES");
  const avecSocle = state.etapesStandard.length > 0;
  const writable = can("GERER_AFFECTATIONS") && avecSocle;
  const jour = dateISO();
  const active = (a: AffectationOuvrier) => a.date_debut <= jour && (!a.date_fin || a.date_fin >= jour);
  const items = filtre === "ACTIVES" ? state.affectationsOuvriers.filter(active) : state.affectationsOuvriers;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Personnel"
        title="Affectations"
        description="Qui tient quelle étape, sur quel poste ou dans quelle équipe d’OF."
        actions={
          <Segmented
            label="Période"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "ACTIVES", label: "Actives aujourd’hui", count: state.affectationsOuvriers.filter(active).length },
              { value: "TOUTES", label: "Toutes", count: state.affectationsOuvriers.length },
            ]}
          />
        }
      />
      {can("GERER_AFFECTATIONS") && !avecSocle && (
        <Guard variant="warn" title="Consultation seulement">
          Votre profil n’a pas accès au socle industriel ni aux OF : le Responsable Production ou l’Administrateur SI crée les affectations.
        </Guard>
      )}
      {writable && <OuvriersDisponibles />}
      <RefCrud<AffectationOuvrier>
        titre="Affectations des ouvriers"
        items={items}
        endpoint={endpoints.affectationsOuvriers}
        refresh={["affectationsOuvriers"]}
        writable={writable}
        rechercheDans={(a) => [a.ouvrier_nom, a.ouvrier_matricule, a.etape_libelle, a.poste_code, a.of_numero]}
        libelleItem={(a) => `${a.ouvrier_matricule} · ${a.ouvrier_nom}`}
        supprimable={() => true}
        vide="Aucune affectation."
        valeursInitiales={{ ouvrier: 0, etape: 0, poste: 0, ordre_fabrication: 0, date_debut: "", date_fin: "", observations: "" }}
        colonnes={[
          { cle: "o", label: "Ouvrier", rendu: (a) => `${a.ouvrier_matricule} · ${a.ouvrier_nom}` },
          { cle: "e", label: "Étape / poste", rendu: (a) => [a.etape_libelle, a.poste_code].filter(Boolean).join(" · ") },
          { cle: "f", label: "OF", rendu: (a) => a.of_numero ?? "—" },
          { cle: "p", label: "Période", rendu: (a) => `${formatDate(a.date_debut)} → ${a.date_fin ? formatDate(a.date_fin) : "sans fin"}` },
        ]}
        champs={[
          {
            cle: "ouvrier",
            label: "Ouvrier",
            type: "select",
            requis: true,
            creationSeulement: true,
            pleineLargeur: true,
            options: state.ouvriers.map((o) => ({ value: o.id, label: `${o.matricule} · ${o.nom_complet}${o.actif ? "" : " (parti)"}` })),
          },
          {
            cle: "etape",
            label: "Étape / zone",
            type: "select",
            aide: "Déduite du poste si un poste est choisi.",
            options: state.etapesStandard.map((e) => ({ value: e.id, label: e.libelle })),
          },
          { cle: "poste", label: "Poste précis (facultatif)", type: "select", options: state.postes.map((p) => ({ value: p.id, label: `${p.code} · ${p.designation}` })) },
          {
            cle: "ordre_fabrication",
            label: "OF (facultatif)",
            type: "select",
            creationSeulement: true,
            pleineLargeur: true,
            aide: "Vide = affectation au poste ou à l’étape, hors OF précis.",
            options: state.ofList.filter((o) => o.statut !== "ANNULE").map((o) => ({ value: o.id, label: o.numero })),
          },
          { cle: "date_debut", label: "Du", type: "date", aide: "Vide pour un OF : début planifié de l’OF." },
          { cle: "date_fin", label: "Au", type: "date", aide: "Vide : sans fin prévue (un temporaire est limité à sa fin de contrat)." },
          { cle: "observations", label: "Observations", pleineLargeur: true },
        ]}
      />
    </div>
  );
}

/** Ouvriers actifs, sous contrat, compétents pour l’étape et sans poste ce jour-là. */
function OuvriersDisponibles() {
  const { state } = useStore();
  const [etape, setEtape] = useState(0);
  const [date, setDate] = useState(dateISO());
  const [liste, setListe] = useState<Ouvrier[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function chercher() {
    setErreur(null);
    try {
      setListe(await actions.ouvriersDisponibles(etape, date));
    } catch (e) {
      setListe(null);
      setErreur(e instanceof Error ? e.message : "Recherche impossible.");
    }
  }

  return (
    <div className="rounded-[8px] border border-line bg-surface p-3 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="sm:w-72">
          <Field label="Qui est disponible pour l’étape">
            <select className={inputClass} value={etape} onChange={(e) => setEtape(Number(e.target.value))}>
              <option value={0}>Choisir…</option>
              {state.etapesStandard.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.libelle}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:w-44">
          <Field label="Le">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Button variant="secondary" disabled={!etape || !date} onClick={() => void chercher()}>
          Chercher
        </Button>
      </div>
      {erreur && <p className="text-[12px] text-danger">{erreur}</p>}
      {liste && <p className="text-[12.5px]">{liste.length ? liste.map((o) => `${o.matricule} · ${o.nom_complet}`).join(" — ") : "Aucun ouvrier disponible pour cette étape à cette date."}</p>}
    </div>
  );
}
