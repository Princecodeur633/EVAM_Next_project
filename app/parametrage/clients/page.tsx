"use client";

import { FormEvent, useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { ClientType, PaymentMethod } from "@/lib/types";

export default function ParamClientsPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/clients");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ClientType>("comptant");
  const [tariffId, setTariffId] = useState(state.tariffs[0]?.id ?? "t-std");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const methods: PaymentMethod[] = type === "comptant" ? ["especes", "cb"] : ["virement"];
    dispatch({
      type: "UPSERT_CUSTOMER",
      customer: { id: `cl-${Date.now()}`, code, name, type, paymentMethods: methods, tariffId },
    });
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Paramétrage"
        title="Clients"
        description="Référentiel profond. L'écran commercial consomme ces fiches. Le type client détermine les moyens d'encaissement."
      />
      {edit && (
        <Panel className="p-4">
          <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-2 items-end">
            <Field label="Code">
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </Field>
            <Field label="Nom">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as ClientType)}>
                <option value="comptant">Comptant</option>
                <option value="a_terme">À terme</option>
              </select>
            </Field>
            <Field label="Grille">
              <select className={inputClass} value={tariffId} onChange={(e) => setTariffId(e.target.value)}>
                {state.tariffs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Tarif</th>
            </tr>
          </thead>
          <tbody>
            {state.customers.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="px-3 py-2 num">{c.code}</td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2">{c.type}</td>
                <td className="px-3 py-2">{state.tariffs.find((t) => t.id === c.tariffId)?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
