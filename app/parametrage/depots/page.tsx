"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Depot } from "@/lib/types";

export default function DepotsPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/depots");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Depot["kind"]>("pf");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "ADD_DEPOT", code, name, kind });
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Paramétrage" title="Dépôts / emplacements" description="PF, matières, quarantaine, retours — obligatoires pour tout mouvement." />
      {edit && (
        <Panel className="p-4">
          <form onSubmit={onAdd} className="grid md:grid-cols-4 gap-2 items-end">
            <Field label="Code">
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </Field>
            <Field label="Nom">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as Depot["kind"])}>
                <option value="pf">Produits finis</option>
                <option value="matieres">Matières</option>
                <option value="quarantaine">Quarantaine</option>
                <option value="retours">Retours</option>
              </select>
            </Field>
            <Button type="submit">Ajouter</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-left px-3 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {state.depots.map((d) => (
              <tr key={d.id} className="border-b border-line">
                <td className="px-3 py-2 num">{d.code}</td>
                <td className="px-3 py-2">{d.name}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={d.kind === "quarantaine" ? "danger" : "neutral"}>{d.kind}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
