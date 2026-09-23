"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function DepotsPage() {
  const { state, dispatch, can } = useStore();
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title="Dépôts"
        description="Magasins de stockage des matières et des produits finis. Les dépôts « Système » (Magasin principal, Dépôt produits finis, Quarantaine) sont utilisés automatiquement par la production, la qualité et les achats : ne changez ni leur nom ni leur statut actif."
      />
      {can("CREATE_DEPOT") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
          <Field label="Adresse"><input className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
          <Button disabled={!nom} onClick={() => void dispatch({ type: "CREATE_DEPOT", nom, adresse })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "Nom" },
            { key: "a", label: "Adresse" },
            { key: "r", label: "Rôle système" },
            { key: "ok", label: "Actif" },
          ]}
          rows={state.depots.map((d) => ({
            n: d.nom,
            a: d.adresse || "—",
            r: d.est_systeme ? <StatusBadge tone="info">{d.role || "Système"}</StatusBadge> : "—",
            ok: d.actif ? "Oui" : "Non",
          }))}
        />
      </Panel>
    </div>
  );
}
