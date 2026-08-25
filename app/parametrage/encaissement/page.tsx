"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

const ALL: PaymentMethod[] = ["especes", "cb", "virement"];

export default function EncaissementParamPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/encaissement");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Paramétrage"
        title="Modes d'encaissement"
        description="Espèces, CB, virement — filtrés ensuite par type client. Le caissier ne force pas un moyen hors fiche."
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Client</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Moyens autorisés</th>
            </tr>
          </thead>
          <tbody>
            {state.customers.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2">{c.type}</td>
                <td className="px-3 py-2">
                  {edit ? (
                    <div className="flex gap-3">
                      {ALL.map((m) => (
                        <label key={m} className="inline-flex items-center gap-1 text-[12px]">
                          <input
                            type="checkbox"
                            checked={c.paymentMethods.includes(m)}
                            onChange={(e) => {
                              const methods = e.target.checked
                                ? [...c.paymentMethods, m]
                                : c.paymentMethods.filter((x) => x !== m);
                              dispatch({ type: "SET_CUSTOMER_PAYMENTS", customerId: c.id, methods });
                            }}
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                  ) : (
                    c.paymentMethods.join(" · ")
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
