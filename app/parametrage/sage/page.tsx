"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SageMappingPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/sage");
  const [m, setM] = useState(state.sageMapping);

  function onSave(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPDATE_SAGE", patch: m });
  }

  return (
    <div className="max-w-lg">
      <PageHeader eyebrow="Paramétrage" title="Mapping Sage 100" description="Journaux et comptes. Maître : comptabilité." />
      <form onSubmit={onSave}>
        <Panel className="p-4 space-y-3">
          <Field label="Journal ventes">
            <input className={inputClass} value={m.journalVente} onChange={(e) => setM({ ...m, journalVente: e.target.value })} readOnly={!edit} />
          </Field>
          <Field label="Journal achats">
            <input className={inputClass} value={m.journalAchat} onChange={(e) => setM({ ...m, journalAchat: e.target.value })} readOnly={!edit} />
          </Field>
          <Field label="Compte clients">
            <input className={inputClass + " num"} value={m.compteClient} onChange={(e) => setM({ ...m, compteClient: e.target.value })} readOnly={!edit} />
          </Field>
          <Field label="Compte fournisseurs">
            <input className={inputClass + " num"} value={m.compteFournisseur} onChange={(e) => setM({ ...m, compteFournisseur: e.target.value })} readOnly={!edit} />
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
