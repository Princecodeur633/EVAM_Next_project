"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function GeneralPage() {
  const { state, dispatch, can } = useStore();
  const [company, setCompany] = useState(state.settings.company);
  const [exercice, setExercice] = useState(state.settings.exercice);
  const [lotFormat, setLotFormat] = useState(state.settings.lotFormat);
  const edit = can("UPDATE_SETTINGS");

  function onSave(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPDATE_SETTINGS", patch: { company, exercice, lotFormat } });
  }

  return (
    <div className="max-w-lg">
      <PageHeader eyebrow="Paramétrage" title="Paramètres généraux" description="Société, exercice, formats de lot." />
      <form onSubmit={onSave}>
        <Panel className="p-4 space-y-3">
          <Field label="Raison sociale">
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Exercice">
            <input className={inputClass} value={exercice} onChange={(e) => setExercice(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Format de lot">
            <input className={inputClass} value={lotFormat} onChange={(e) => setLotFormat(e.target.value)} readOnly={!edit} />
          </Field>
        </Panel>
        {edit && (
          <Button type="submit" className="mt-3">
            Enregistrer
          </Button>
        )}
      </form>
    </div>
  );
}
