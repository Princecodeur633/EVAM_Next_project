"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { RelevePressionEau } from "@/lib/types";
import { dateISO, formatDate } from "@/lib/utils";

/** Pression des membranes : au-delà de la pression maximale de l'équipement, les techniciens sont alertés. */
export default function PressionsPage() {
  const { state, can } = useStore();
  // Membranes : équipements dont la pression maximale est paramétrée.
  const avecSeuil = new Set(state.caracteristiquesEquipements.filter((c) => c.pression_max_bar).map((c) => c.equipement));
  const equipements = state.equipements.filter((e) => avecSeuil.size === 0 || avecSeuil.has(e.id));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Traitement de l’eau" title="Pressions des membranes" description="Une pression au-dessus du maximum de l’équipement signale un encrassement : notification immédiate aux techniciens." />
      <RefCrud<RelevePressionEau>
        titre="Relevés de pression"
        items={state.relevesPressionEau}
        endpoint={endpoints.relevesPressionEau}
        refresh={["relevesPressionEau"]}
        writable={can("RELEVER_EAU")}
        rechercheDans={(r) => [r.equipement_code, r.observations]}
        libelleItem={(r) => `${r.equipement_code} · ${formatDate(r.date)}`}
        supprimable={() => true}
        vide="Aucun relevé."
        valeursInitiales={{ equipement: 0, date: dateISO(), pression_bar: "", observations: "" }}
        colonnes={[
          { cle: "d", label: "Jour", rendu: (r) => formatDate(r.date) },
          { cle: "e", label: "Équipement", rendu: (r) => r.equipement_code },
          { cle: "p", label: "Pression", className: "text-right", rendu: (r) => <span className="num">{r.pression_bar} bar</span> },
          { cle: "m", label: "Maximum", className: "text-right", rendu: (r) => <span className="num">{r.pression_max ? `${r.pression_max} bar` : "—"}</span> },
          { cle: "s", label: "", rendu: (r) => (r.au_dessus_du_seuil ? <StatusBadge tone="danger">Trop haute</StatusBadge> : <StatusBadge tone="success">Normale</StatusBadge>) },
          { cle: "o", label: "Observations", rendu: (r) => r.observations || "—" },
        ]}
        champs={[
          { cle: "equipement", label: "Membrane / équipement", type: "select", requis: true, options: equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })) },
          { cle: "date", label: "Date", type: "date", requis: true },
          { cle: "pression_bar", label: "Pression (bar)", type: "number", requis: true },
          { cle: "observations", label: "Observations", pleineLargeur: true },
        ]}
      />
    </div>
  );
}
