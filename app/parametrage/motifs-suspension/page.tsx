"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function MotifsSuspensionPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/motifs-suspension");
  const [label, setLabel] = useState("");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "ADD_SUSPEND_REASON", label });
    setLabel("");
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Paramétrage" title="Motifs de suspension" description="Liste fermée. Une facture suspendue n'est jamais exportable Sage." />
      {edit && (
        <form onSubmit={onAdd} className="flex gap-2 max-w-lg">
          <Field label="Nouveau motif">
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} required />
          </Field>
          <Button type="submit" className="mt-5">
            Ajouter
          </Button>
        </form>
      )}
      <Panel>
        <ul className="divide-y divide-line">
          {state.suspendReasons.map((c) => (
            <li key={c.id} className="px-4 py-2 text-[13px]">
              {c.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
