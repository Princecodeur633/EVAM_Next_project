"use client";

import { FormEvent, useState } from "react";
import { DaBadge } from "@/components/badges";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function DemandesAchatPage() {
  const { state, dispatch, materialName, can } = useStore();
  const [materialId, setMaterialId] = useState(state.materials[0]?.id ?? "");
  const [qty, setQty] = useState(100);
  const [reason, setReason] = useState("Seuil min atteint");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "CREATE_DA", materialId, qty, reason });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Approvisionnement"
        title="Demandes d'achat"
        description="Workflow : soumise → validée ou refusée. Une DA validée peut devenir commande fournisseur. Jamais l'inverse."
      />
      {can("CREATE_DA") && (
        <Panel className="p-4">
          <h2 className="text-[13px] font-semibold mb-3">Nouvelle DA</h2>
          <form onSubmit={onCreate} className="grid md:grid-cols-[1fr_120px_1fr_auto] gap-2 items-end">
            <Field label="Matière">
              <select className={inputClass} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                {state.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qté">
              <input type="number" className={inputClass + " num"} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </Field>
            <Field label="Motif">
              <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <Button type="submit">Soumettre</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">N°</th>
              <th className="text-left px-3 py-2">Matière</th>
              <th className="text-right px-3 py-2">Qté</th>
              <th className="text-left px-3 py-2">Motif</th>
              <th className="text-left px-3 py-2">Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.purchaseRequests.map((d) => (
              <tr key={d.id} className="border-b border-line">
                <td className="px-3 py-2 num">{d.number}</td>
                <td className="px-3 py-2">{materialName(d.materialId)}</td>
                <td className="px-3 py-2 text-right num">{d.qty}</td>
                <td className="px-3 py-2">{d.reason}</td>
                <td className="px-3 py-2">
                  <DaBadge status={d.status} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    {d.status === "soumise" && can("VALIDATE_DA") && (
                      <Button onClick={() => dispatch({ type: "VALIDATE_DA", id: d.id })}>Valider</Button>
                    )}
                    {d.status === "soumise" && can("REFUSE_DA") && (
                      <Button variant="ghost" onClick={() => dispatch({ type: "REFUSE_DA", id: d.id })}>
                        Refuser
                      </Button>
                    )}
                    {d.status === "validee" && can("CREATE_PO") && !state.purchaseOrders.some((p) => p.daId === d.id) && (
                      <CreatePoButton daId={d.id} materialId={d.materialId} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function CreatePoButton({ daId, materialId }: { daId: string; materialId: string }) {
  const { state, dispatch } = useStore();
  const mat = state.materials.find((m) => m.id === materialId);
  const supplierId = mat?.supplierIds[0] ?? state.suppliers[0]?.id ?? "";
  return (
    <Button
      variant="secondary"
      onClick={() => dispatch({ type: "CREATE_PO", daId, supplierId })}
      disabled={!supplierId}
    >
      Émettre CF
    </Button>
  );
}
