"use client";

import { Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SageMappingPage() {
  const { state } = useStore();
  const m = state.sageMapping;
  return (
    <div className="max-w-lg">
      <PageHeader eyebrow="Paramétrage" title="Mapping Sage 100" description="Journaux et comptes. Issue du spike Sprint 1. Maître : comptabilité." />
      <Panel className="p-4 space-y-3">
        <Field label="Journal ventes"><input className={inputClass} readOnly defaultValue={m.journalVente} /></Field>
        <Field label="Journal achats"><input className={inputClass} readOnly defaultValue={m.journalAchat} /></Field>
        <Field label="Compte clients"><input className={inputClass + " num"} readOnly defaultValue={m.compteClient} /></Field>
        <Field label="Compte fournisseurs"><input className={inputClass + " num"} readOnly defaultValue={m.compteFournisseur} /></Field>
      </Panel>
    </div>
  );
}
