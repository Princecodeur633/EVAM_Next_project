"use client";

import { useParams } from "next/navigation";
import { Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function ReceptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, materialName } = useStore();
  const r = state.receptions.find((x) => x.id === id);
  if (!r) return <p>Réception introuvable</p>;
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Réception" title={r.number} />
      {r.status === "ecart" && (
        <Guard variant="warn" title="Écart commandé / reçu">
          L'entrée stock matières se fait sur la quantité réellement reçue. L'écart reste tracé.
        </Guard>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line">
              <th className="text-left px-3 py-2">Matière</th>
              <th className="text-right px-3 py-2">Commandé</th>
              <th className="text-right px-3 py-2">Reçu</th>
              <th className="text-right px-3 py-2">Écart</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l) => (
              <tr key={l.materialId} className="border-b border-line">
                <td className="px-3 py-2">{materialName(l.materialId)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(l.ordered)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(l.received)}</td>
                <td className="px-3 py-2 text-right num text-warning">{formatQty(l.received - l.ordered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
