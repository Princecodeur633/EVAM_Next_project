"use client";

import { Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function GeneralPage() {
  const { state } = useStore();
  return (
    <div className="max-w-lg">
      <PageHeader eyebrow="Paramétrage" title="Paramètres généraux" description="Société, exercice, formats de lot." />
      <Panel className="p-4 space-y-3">
        <Field label="Raison sociale"><input className={inputClass} readOnly defaultValue={state.settings.company} /></Field>
        <Field label="Exercice"><input className={inputClass} readOnly defaultValue={state.settings.exercice} /></Field>
        <Field label="Format de lot"><input className={inputClass} readOnly defaultValue="L-{FAMILLE}-{JJMM}" /></Field>
      </Panel>
    </div>
  );
}
