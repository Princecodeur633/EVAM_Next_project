"use client";

import { DaBadge } from "@/components/badges";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function DemandesAchatPage() {
  const { state, dispatch, materialName, role } = useStore();
  const can = role === "responsable_achats" || role === "administrateur";
  return (
    <div>
      <PageHeader eyebrow="Approvisionnement" title="Demandes d'achat" description="Workflow de validation. Une DA validée peut devenir commande fournisseur." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
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
                  {d.status === "soumise" && can && (
                    <Button onClick={() => dispatch({ type: "VALIDATE_DA", id: d.id })}>Valider</Button>
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
