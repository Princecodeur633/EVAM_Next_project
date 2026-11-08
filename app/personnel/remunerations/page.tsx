"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { MODE_REMUNERATION_LABEL, PERIODICITE_PAIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ConditionRemuneration, ModeRemuneration, PeriodicitePaie } from "@/lib/types";
import { dateISO, formatDa, formatDate, num } from "@/lib/utils";

const opt = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));

/**
 * Rémunération des ouvriers, historisée par date d’effet : une augmentation est une nouvelle
 * condition, les périodes déjà pointées et validées gardent leur taux.
 */
export default function RemunerationsPage() {
  const { state, can } = useStore();
  const writable = can("GERER_REMUNERATIONS");
  const jour = dateISO();
  // Condition en vigueur : la plus récente déjà entrée en vigueur pour chaque ouvrier.
  const enVigueur = new Set(
    Object.values(
      state.remunerations
        .filter((c) => c.date_effet <= jour)
        .reduce<Record<number, ConditionRemuneration>>((acc, c) => {
          if (!acc[c.ouvrier] || acc[c.ouvrier].date_effet < c.date_effet) acc[c.ouvrier] = c;
          return acc;
        }, {}),
    ).map((c) => c.id),
  );

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Personnel" title="Rémunérations" description="Salaire mensuel fixe ou taux journalier, paie hebdomadaire ou mensuelle, à partir d’une date d’effet." />
      <RefCrud<ConditionRemuneration>
        titre="Conditions de rémunération"
        items={state.remunerations}
        endpoint={endpoints.remunerations}
        refresh={["remunerations"]}
        writable={writable}
        rechercheDans={(c) => [c.ouvrier_nom]}
        libelleItem={(c) => c.ouvrier_nom}
        supprimable={() => true}
        vide="Aucune condition de rémunération."
        valeursInitiales={{ ouvrier: 0, mode: "JOURNALIER", montant: "", periodicite_paie: "MENSUELLE", date_effet: jour }}
        colonnes={[
          { cle: "o", label: "Ouvrier", rendu: (c) => c.ouvrier_nom },
          { cle: "m", label: "Mode", rendu: (c) => MODE_REMUNERATION_LABEL[c.mode] },
          { cle: "a", label: "Montant", className: "text-right", rendu: (c) => <span className="num">{formatDa(num(c.montant))}</span> },
          { cle: "p", label: "Paie", rendu: (c) => PERIODICITE_PAIE_LABEL[c.periodicite_paie] },
          { cle: "d", label: "À partir du", rendu: (c) => formatDate(c.date_effet) },
          { cle: "s", label: "", rendu: (c) => (enVigueur.has(c.id) ? <StatusBadge tone="success">En vigueur</StatusBadge> : c.date_effet > jour ? <StatusBadge tone="info">À venir</StatusBadge> : <StatusBadge tone="neutral">Ancienne</StatusBadge>) },
        ]}
        champs={[
          {
            cle: "ouvrier",
            label: "Ouvrier",
            type: "select",
            requis: true,
            creationSeulement: true,
            pleineLargeur: true,
            options: state.ouvriers.map((o) => ({ value: o.id, label: `${o.matricule} · ${o.nom_complet}` })),
          },
          { cle: "mode", label: "Mode de rémunération", type: "select", requis: true, options: opt<ModeRemuneration>(MODE_REMUNERATION_LABEL) },
          { cle: "montant", label: "Montant (FCFA)", type: "number", requis: true, aide: "Salaire du mois, ou montant par jour travaillé." },
          { cle: "periodicite_paie", label: "Paie", type: "select", requis: true, options: opt<PeriodicitePaie>(PERIODICITE_PAIE_LABEL) },
          { cle: "date_effet", label: "En vigueur à partir du", type: "date", requis: true },
        ]}
      />
    </div>
  );
}
