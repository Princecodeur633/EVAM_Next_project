"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function ApproBesoinsPage() {
  const { state, materialName } = useStore();
  const rows = state.materials
    .map((m) => {
      const qty = state.stock.filter((s) => s.articleId === m.id).reduce((a, s) => a + s.qty, 0);
      return { m, qty, need: Math.max(0, m.minStock * 1.2 - qty) };
    })
    .filter((r) => r.need > 0);

  return (
    <div>
      <PageHeader eyebrow="Approvisionnement" title="Besoins" description="Calcul automatique depuis les seuils et les OF. Le responsable achats ne recalcule pas dans Excel." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Matière</th>
              <th className="text-right px-3 py-2">Stock</th>
              <th className="text-right px-3 py-2">Besoin proposé</th>
              <th className="text-left px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.m.id} className="border-b border-line">
                <td className="px-3 py-2">{materialName(r.m.id)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(r.qty, 1)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(r.need, 1)}</td>
                <td className="px-3 py-2">
                  <Link className="text-primary" href="/approvisionnement/demandes">
                    Demande d'achat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
