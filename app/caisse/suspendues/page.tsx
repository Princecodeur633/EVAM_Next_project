"use client";

import { Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function SuspenduesPage() {
  const { state } = useStore();
  const list = state.invoices.filter((i) => i.status === "suspendue");
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Caisse" title="Factures suspendues" description="Jamais transférables en comptabilité. Stock réservé déjà libéré." />
      <Guard variant="block" title="Exclusion Sage systématique">
        Une facture suspendue n'apparaît pas dans l'export, même si un utilisateur tente de la forcer.
      </Guard>
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Facture</th>
              <th className="text-right px-3 py-2">Montant</th>
              <th className="text-left px-3 py-2">Motif</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-b border-line">
                <td className="px-3 py-2 num">{i.number}</td>
                <td className="px-3 py-2 text-right num">{formatDa(i.amount)}</td>
                <td className="px-3 py-2">{i.suspendReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
