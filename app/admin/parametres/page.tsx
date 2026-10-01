"use client";

import { useState } from "react";
import { Globe2, Hash, ListChecks, Lock } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { PageHeader, Panel } from "@/components/ui";
import { MODE_PAIEMENT_LABEL, MOTIF_PERTE_LABEL, MOTIF_RETOUR_LABEL, TYPE_PROBLEME_LABEL } from "@/lib/labels";

type Onglet = "listes" | "numerotation" | "generaux";

const LISTES: { titre: string; usage: string; valeurs: string[] }[] = [
  { titre: "Motifs de pertes", usage: "Saisie des pertes en atelier", valeurs: Object.values(MOTIF_PERTE_LABEL) },
  { titre: "Modes de paiement", usage: "Encaissements en caisse", valeurs: Object.values(MODE_PAIEMENT_LABEL) },
  { titre: "Motifs de retour", usage: "Retours fournisseurs et clients", valeurs: Object.values(MOTIF_RETOUR_LABEL) },
  { titre: "Problèmes de livraison", usage: "Réclamations sur bon de livraison", valeurs: Object.values(TYPE_PROBLEME_LABEL) },
];

// Préfixes générés par le backend (apps/core/models.py : generer_numero), sur 6 chiffres.
const NUMEROTATION: { doc: string; exemple: string }[] = [
  { doc: "Ordres de fabrication", exemple: "OF-000001" },
  { doc: "Lots de production", exemple: "LOT-000001" },
  { doc: "Commandes clients", exemple: "CMD-000001" },
  { doc: "Factures", exemple: "FACT-000001" },
  { doc: "Encaissements", exemple: "ENC-000001" },
  { doc: "Avoirs", exemple: "AVO-000001" },
  { doc: "Bons de livraison", exemple: "BL-000001" },
  { doc: "Tournées", exemple: "TRN-000001" },
  { doc: "Commandes fournisseurs", exemple: "CMF-000001" },
  { doc: "Mouvements de stock", exemple: "MVT-000001" },
  { doc: "Réclamations", exemple: "RCL-000001" },
  { doc: "Clients", exemple: "CLI-000001" },
  { doc: "Fournisseurs", exemple: "FRS-000001" },
  { doc: "Matières premières", exemple: "MP-000001" },
  { doc: "Produits finis", exemple: "EAU70P8 (famille + parfum + format + unité)" },
];

const GENERAUX: { label: string; valeur: string }[] = [
  { label: "Société", valeur: "EVAM — eau, jus et yaourts" },
  { label: "Fuseau horaire", valeur: "Afrique/Brazzaville (UTC+1)" },
  { label: "Devise", valeur: "Franc CFA (FCFA)" },
  { label: "Langue", valeur: "Français" },
];

export default function ParametresPage() {
  const [onglet, setOnglet] = useState<Onglet>("listes");

  return (
    <div className="space-y-4 max-w-[1200px]">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Listes fixes, numérotation des documents et réglages généraux de l’usine."
      />

      <Tabs
        label="Paramètres"
        value={onglet}
        onChange={setOnglet}
        items={[
          { value: "listes", label: "Listes fixes", icon: ListChecks, count: LISTES.length },
          { value: "numerotation", label: "Numérotation", icon: Hash },
          { value: "generaux", label: "Généraux", icon: Globe2 },
        ]}
      />

      <p className="text-[12.5px] text-muted flex items-center gap-1.5">
        <Lock size={13} className="shrink-0" /> Lecture seule : ces valeurs sont fixées par l’application.
      </p>

      {onglet === "listes" && (
        <div className="grid md:grid-cols-2 gap-3">
          {LISTES.map((l) => (
            <Panel key={l.titre} className="overflow-hidden">
              <header className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[13px] font-semibold">{l.titre}</h2>
                  <p className="text-[11.5px] text-muted mt-0.5">{l.usage}</p>
                </div>
                <span className="text-[11px] num font-semibold px-1.5 py-0.5 rounded-[5px] bg-surface-2 text-muted shrink-0">{l.valeurs.length}</span>
              </header>
              <ul className="p-3 flex flex-wrap gap-1.5">
                {l.valeurs.map((v) => (
                  <li key={v} className="text-[12px] px-2 py-1 rounded-[6px] border border-line bg-surface-2">
                    {v}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      {onglet === "numerotation" && (
        <Panel className="overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">Numéros attribués automatiquement</h2>
            <p className="text-[11.5px] text-muted mt-0.5">Chaque document reçoit son numéro à la création ; il ne se modifie pas.</p>
          </div>
          <ul className="divide-y divide-line">
            {NUMEROTATION.map((n) => (
              <li key={n.doc} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <span className="text-[13px]">{n.doc}</span>
                <span className="font-mono text-[12px] text-muted">{n.exemple}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {onglet === "generaux" && (
        <Panel className="overflow-hidden">
          <dl className="divide-y divide-line">
            {GENERAUX.map((g) => (
              <div key={g.label} className="px-4 py-3 grid sm:grid-cols-[200px_minmax(0,1fr)] gap-1 sm:gap-4">
                <dt className="text-[11px] uppercase tracking-wide text-muted font-medium sm:pt-0.5">{g.label}</dt>
                <dd className="text-[13px] font-medium">{g.valeur}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}
    </div>
  );
}
