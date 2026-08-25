"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function MotifsReclamationPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/motifs-reclamation");
  const [label, setLabel] = useState("");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "ADD_CLAIM_REASON", label });
    setLabel("");
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Paramétrage" title="Motifs de réclamation" description="Qualité, casse, écart de quantité, délai." />
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
          {state.claimReasons.map((c) => (
            <li key={c.id} className="px-4 py-2 text-[13px]">
              {c.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
