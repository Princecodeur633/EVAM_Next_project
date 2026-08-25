"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_CLIENT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeClient } from "@/lib/types";

export default function ParamClientsPage() {
  const { state, dispatch, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/clients");
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeClient>("SOCIETE");
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Clients" description="Répertoire des particuliers, sociétés et clients sous contrat." />
      {writable && (
        <Panel className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Code"><input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeClient)}>
              <option value="PARTICULIER">Particulier</option>
              <option value="SOCIETE">Société</option>
              <option value="CONTRAT">Contrat</option>
            </select>
          </Field>
          <Button disabled={!code} onClick={() => void dispatch({ type: "CREATE_CLIENT", code, nom, type_client: type })}>Créer</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "c", label: "Code" }, { key: "n", label: "Nom" }, { key: "t", label: "Type" }]}
          rows={state.clients.map((c) => ({ c: c.code, n: c.nom, t: TYPE_CLIENT_LABEL[c.type_client] ?? c.type_client }))}
        />
      </Panel>
    </div>
  );
}
