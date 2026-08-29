"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeCommande } from "@/lib/types";

export default function NouvelleCommandePage() {
  const { state, dispatch, can } = useStore();
  const router = useRouter();
  const [client, setClient] = useState(state.clients[0]?.id ?? 0);
  const [type, setType] = useState<TypeCommande>("COMPTANT");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Ventes" title="Nouvelle commande" description="Choisissez le client, puis ajoutez les lignes sur la fiche commande." />
      <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end max-w-3xl">
        <Field label="Client">
          <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))}>
            {state.clients.map((c) => (
              <option key={c.id} value={c.id} disabled={c.bloque}>{c.code} · {c.nom}{c.bloque ? " (bloqué)" : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeCommande)}>
            {(Object.keys(TYPE_COMMANDE_LABEL) as TypeCommande[]).map((k) => <option key={k} value={k}>{TYPE_COMMANDE_LABEL[k]}</option>)}
          </select>
        </Field>
        <Button
          disabled={!client || !can("CREATE_COMMANDE")}
          onClick={async () => {
            await dispatch({ type: "CREATE_COMMANDE", client, type_commande: type });
            router.push("/commercial/commandes");
          }}
        >
          Créer
        </Button>
      </Panel>
    </div>
  );
}
