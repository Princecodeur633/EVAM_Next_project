"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, inputClass, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function CommandesFournisseursPage() {
  const { state, dispatch, can, materialName } = useStore();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [received, setReceived] = useState<Record<string, number>>({});

  return (
    <div>
      <PageHeader
        eyebrow="Approvisionnement"
        title="Commandes fournisseurs"
        description="Issus des DA validées. La réception mesure l'écart commandé / reçu. Le stock matières suit le reçu, pas le commandé."
      />
      <div className="space-y-3">
        {state.purchaseOrders.map((p) => (
          <Panel key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium num">{p.number}</p>
                <p className="text-[13px] text-muted">
                  {state.suppliers.find((s) => s.id === p.supplierId)?.name} · DA{" "}
                  {state.purchaseRequests.find((d) => d.id === p.daId)?.number} · {formatDa(p.amount)}
                </p>
                <ul className="text-[13px] mt-2">
                  {p.lines.map((l) => (
                    <li key={l.materialId}>
                      {materialName(l.materialId)} · {l.qty} × {formatDa(l.unitPrice)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={p.status === "recue" ? "success" : "warning"}>{p.status}</StatusBadge>
                {p.status !== "recue" && can("CREATE_RECEPTION") && (
                  <Button variant="secondary" onClick={() => setOpenFor(openFor === p.id ? null : p.id)}>
                    Saisir réception
                  </Button>
                )}
              </div>
            </div>
            {openFor === p.id && (
              <form
                className="mt-4 border-t border-line pt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const qty = Object.fromEntries(p.lines.map((l) => [l.materialId, received[l.materialId] ?? l.qty]));
                  dispatch({ type: "CREATE_RECEPTION", poId: p.id, received: qty });
                  setOpenFor(null);
                }}
              >
                {p.lines.map((l) => (
                  <Field key={l.materialId} label={`Reçu — ${materialName(l.materialId)} (commandé ${l.qty})`}>
                    <input
                      type="number"
                      className={inputClass + " num max-w-[160px]"}
                      defaultValue={l.qty}
                      onChange={(e) => setReceived({ ...received, [l.materialId]: Number(e.target.value) })}
                    />
                  </Field>
                ))}
                <Button type="submit">Enregistrer la réception (sans entrée stock)</Button>
                <p className="text-[12px] text-muted">
                  L'entrée magasin se fait ensuite sur la fiche réception, sur la quantité réellement reçue.
                </p>
              </form>
            )}
            {state.receptions
              .filter((r) => r.poId === p.id)
              .map((r) => (
                <p key={r.id} className="text-[12px] mt-2">
                  Réception{" "}
                  <Link className="text-primary num" href={`/approvisionnement/receptions/${r.id}`}>
                    {r.number}
                  </Link>
                </p>
              ))}
          </Panel>
        ))}
      </div>
    </div>
  );
}
