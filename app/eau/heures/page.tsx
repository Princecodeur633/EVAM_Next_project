"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { MOTIF_ARRET_LABEL, optionsDe } from "@/lib/eau";
import { useStore } from "@/lib/store";
import type { ExceptionHeuresEau, MotifArretEau } from "@/lib/types";
import { dateISO, formatDate } from "@/lib/utils";

/**
 * Exceptions d'heures machine : les heures standard sont reportées chaque jour ; on ne saisit que
 * les heures en moins (arrêt, panne, ligne à l'arrêt), pour un équipement ou une ligne entière.
 */
export default function HeuresMachinePage() {
  const { state, can } = useStore();
  const cible = (x: ExceptionHeuresEau) =>
    x.equipement
      ? (state.equipements.find((e) => e.id === x.equipement)?.designation ?? `Équipement ${x.equipement}`)
      : `Ligne ${state.lignesProduction.find((l) => l.id === x.ligne)?.designation ?? x.ligne}`;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Traitement de l’eau" title="Heures machine" description="Seules les exceptions se saisissent : les heures standard des équipements sont reportées automatiquement chaque jour de marche." />
      <RefCrud<ExceptionHeuresEau>
        titre="Exceptions d’heures"
        items={state.exceptionsHeuresEau}
        endpoint={endpoints.exceptionsHeuresEau}
        refresh={["exceptionsHeuresEau"]}
        writable={can("EXCEPTIONS_HEURES_EAU")}
        rechercheDans={(x) => [cible(x), x.commentaire]}
        libelleItem={(x) => `${cible(x)} · ${formatDate(x.date)}`}
        supprimable={() => true}
        vide="Aucune exception : toutes les heures standard sont retenues."
        valeursInitiales={{ date: dateISO(), equipement: 0, ligne: 0, heures_en_moins: "", motif: "PANNE", commentaire: "" }}
        colonnes={[
          { cle: "d", label: "Jour", rendu: (x) => formatDate(x.date) },
          { cle: "c", label: "Équipement / ligne", rendu: cible },
          { cle: "h", label: "Heures en moins", className: "text-right", rendu: (x) => <span className="num">{x.heures_en_moins} h</span> },
          { cle: "m", label: "Motif", rendu: (x) => `${MOTIF_ARRET_LABEL[x.motif]}${x.commentaire ? ` · ${x.commentaire}` : ""}` },
          { cle: "p", label: "Saisi par", rendu: (x) => x.saisi_par_nom ?? "—" },
        ]}
        champs={[
          { cle: "date", label: "Date", type: "date", requis: true },
          {
            cle: "equipement",
            label: "Équipement",
            type: "select",
            aide: "Ou bien une ligne entière ci-dessous (pas les deux).",
            options: state.equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })),
          },
          { cle: "ligne", label: "Ligne entière", type: "select", options: state.lignesProduction.map((l) => ({ value: l.id, label: l.designation })) },
          { cle: "heures_en_moins", label: "Heures en moins", type: "number", requis: true, aide: "Au plus 24." },
          { cle: "motif", label: "Motif", type: "select", requis: true, options: optionsDe<MotifArretEau>(MOTIF_ARRET_LABEL) },
          { cle: "commentaire", label: "Commentaire", pleineLargeur: true, aide: "Obligatoire pour « Autre »." },
        ]}
      />
    </div>
  );
}
