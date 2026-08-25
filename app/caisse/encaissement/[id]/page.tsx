"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Guard, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { formatDa } from "@/lib/utils";

export default function EncaissementPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, customerName, can } = useStore();
  const router = useRouter();
  const invoice = state.invoices.find((i) => i.id === id);
  const order = state.orders.find((o) => o.id === invoice?.orderId);
  const customer = state.customers.find((c) => c.id === order?.customerId);
  const [method, setMethod] = useState<PaymentMethod>(customer?.paymentMethods[0] ?? "especes");
  const [reason, setReason] = useState(state.suspendReasons[0]?.label ?? "");

  if (!invoice || !order || !customer) return <p>Facture introuvable</p>;
  if (invoice.status !== "a_payer") {
    return (
      <div className="space-y-3">
        <PageHeader title={invoice.number} />
        <Guard variant={invoice.status === "payee" ? "ok" : "block"} title={invoice.status === "payee" ? "Déjà encaissée" : "Facture suspendue"}>
          {invoice.suspendReason}
        </Guard>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl">
      <PageHeader eyebrow="Encaissement" title={invoice.number} description={`${customerName(customer.id)} · ${formatDa(invoice.amount)}`} />
      <Panel className="p-4 space-y-3">
        <Field label="Moyen (selon type client)">
          <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {customer.paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-[12px] text-muted">
          Client {customer.type}. Les moyens non autorisés n'apparaissent pas — le caissier ne « force » pas un virement comptant.
        </p>
        {can("PAY_INVOICE") ? (
          <>
            <div className="flex gap-2 pt-2">
              <Button
                variant="success"
                onClick={() => {
                  dispatch({ type: "PAY_INVOICE", invoiceId: invoice.id, method, success: true });
                  router.push("/caisse");
                }}
              >
                Paiement réussi
              </Button>
            </div>
            <div className="border-t border-line pt-3 space-y-2">
              <p className="text-[12px] font-medium">Échec de paiement</p>
              <p className="text-[12px] text-muted">
                La commande est annulée, le stock réservé libéré, la facture suspendue (motif obligatoire). Jamais Sage.
              </p>
              <Field label="Motif de suspension">
                <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)}>
                  {state.suspendReasons.map((r) => (
                    <option key={r.id} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                variant="danger"
                onClick={() => {
                  dispatch({ type: "PAY_INVOICE", invoiceId: invoice.id, method, success: false, reason });
                  router.push("/caisse/suspendues");
                }}
              >
                Enregistrer l'échec — annuler la commande
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-muted">Lecture — seul le caissier encaisse.</p>
        )}
      </Panel>
    </div>
  );
}
