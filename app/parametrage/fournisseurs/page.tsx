"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FournisseursPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/fournisseurs");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [delayDays, setDelayDays] = useState(7);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPSERT_SUPPLIER", supplier: { id: `s-${Date.now()}`, code, name, delayDays } });
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Paramétrage" title="Fournisseurs" description="Identité, délais, articles liés. Maître : achats." />
      {edit && (
        <Panel className="p-4">
          <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-2 items-end">
            <Field label="Code">
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </Field>
            <Field label="Nom">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Délai (j)">
              <input type="number" className={inputClass + " num"} value={delayDays} onChange={(e) => setDelayDays(Number(e.target.value))} />
            </Field>
            <Button type="submit">Créer</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-right px-3 py-2">Délai (j)</th>
            </tr>
          </thead>
          <tbody>
            {state.suppliers.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="px-3 py-2 num">{s.code}</td>
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 text-right num">{s.delayDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
