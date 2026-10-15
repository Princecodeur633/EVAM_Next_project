"use client";

import { RefCrud } from "@/components/RefCrud";
import { PageHeader, StatusBadge } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { STATUT_CONTRAT_FOURNISSEUR_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { StatutContratFournisseur } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const TONE: Record<StatutContratFournisseur, "neutral" | "success" | "warning" | "danger"> = {
  BROUILLON: "neutral",
  ACTIF: "success",
  EXPIRE: "warning",
  RESILIE: "danger",
};

/** Contrats fournisseurs : durée, conditions (paiement, délais garantis, pénalités) ; les prix du catalogue peuvent s'y rattacher. */
export default function ContratsFournisseursPage() {
  const { state, can, fournisseurName, userName } = useStore();
  const writable = can("GERER_CONTRATS_FOURNISSEURS");
  const nbArticles = (id: number) => state.catalogueFournisseurs.filter((c) => c.contrat === id).length;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Achats"
        title="Contrats fournisseurs"
        description="Conditions négociées avec chaque fournisseur. Le numéro est attribué automatiquement ; rattachez les prix négociés dans le catalogue."
      />
      <RefCrud
        titre="Contrats"
        items={state.contratsFournisseurs}
        endpoint={endpoints.contratsFournisseurs}
        refresh={["contratsFournisseurs"]}
        writable={writable}
        supprimable={(c) => c.statut === "BROUILLON"}
        rechercheDans={(c) => [c.numero, fournisseurName(c.fournisseur), c.conditions]}
        libelleItem={(c) => `${c.numero} · ${fournisseurName(c.fournisseur)}`}
        valeursInitiales={{ fournisseur: 0, date_debut: new Date().toISOString().slice(0, 10), date_fin: "", statut: "BROUILLON", conditions: "" }}
        champs={[
          { cle: "fournisseur", label: "Fournisseur", type: "select", requis: true, creationSeulement: true, options: state.fournisseurs.filter((f) => f.actif).map((f) => ({ value: f.id, label: f.nom })) },
          { cle: "statut", label: "Statut", type: "select", requis: true, options: (Object.keys(STATUT_CONTRAT_FOURNISSEUR_LABEL) as StatutContratFournisseur[]).map((s) => ({ value: s, label: STATUT_CONTRAT_FOURNISSEUR_LABEL[s] })) },
          { cle: "date_debut", label: "Date de début", type: "date", requis: true },
          { cle: "date_fin", label: "Date de fin", type: "date", aide: "Vide = sans échéance." },
          { cle: "conditions", label: "Conditions particulières", type: "textarea", placeholder: "Paiement à 30 jours, délai garanti 10 jours, pénalités…" },
        ]}
        colonnes={[
          { cle: "n", label: "N°", rendu: (c) => <span className="num font-medium">{c.numero}</span> },
          { cle: "f", label: "Fournisseur", rendu: (c) => fournisseurName(c.fournisseur) },
          { cle: "s", label: "Statut", rendu: (c) => <StatusBadge tone={TONE[c.statut]}>{STATUT_CONTRAT_FOURNISSEUR_LABEL[c.statut]}</StatusBadge> },
          { cle: "d", label: "Période", rendu: (c) => `${formatDate(c.date_debut)} → ${c.date_fin ? formatDate(c.date_fin) : "sans fin"}` },
          { cle: "a", label: "Articles", className: "text-right", rendu: (c) => <span className="num">{nbArticles(c.id)}</span> },
          { cle: "g", label: "Négocié par", rendu: (c) => userName(c.gere_par) },
        ]}
      />
    </div>
  );
}
