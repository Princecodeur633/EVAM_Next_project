"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function UnitesPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/unites");
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "ADD_UNIT", code, label });
    setCode("");
    setLabel("");
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Paramétrage" title="Unités & conversions" description="Une erreur de conversion = un stock faux. Les masques sont fermés." />
      {edit && (
        <form onSubmit={onAdd} className="flex gap-2 max-w-lg">
          <Field label="Symbole">
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
          </Field>
          <Field label="Libellé">
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} required />
          </Field>
          <Button type="submit" className="mt-5">
            Ajouter
          </Button>
        </form>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Symbole</th>
              <th className="text-left px-3 py-2">Libellé</th>
            </tr>
          </thead>
          <tbody>
            {state.units.map((u) => (
              <tr key={u.id} className="border-b border-line">
                <td className="px-3 py-2 num">{u.code}</td>
                <td className="px-3 py-2">{u.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
