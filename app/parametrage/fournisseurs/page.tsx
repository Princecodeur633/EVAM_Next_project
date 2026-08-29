"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FournisseursPage() {
  const { state, dispatch, can } = useStore();
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Fournisseurs" description="Fournisseurs de matières premières et d’emballages." />
      {can("CREATE_CF") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Code"><input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
          <Button disabled={!code} onClick={() => void dispatch({ type: "CREATE_FOURNISSEUR", code, nom })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Code" }, { key: "n", label: "Nom" }, { key: "t", label: "Téléphone" }]}
          rows={state.fournisseurs.map((f) => ({ c: f.code, n: f.nom, t: f.telephone || "—" }))}
        />
      </Panel>
    </div>
  );
}
