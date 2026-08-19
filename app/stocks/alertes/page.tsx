"use client";

import Link from "next/link";
import { Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function AlertesPage() {
  const { state, materialName } = useStore();
  const alerts = state.materials
    .map((m) => {
      const qty = state.stock.filter((s) => s.articleId === m.id).reduce((a, s) => a + s.qty, 0);
      return { m, qty, gap: qty - m.minStock };
    })
    .filter((a) => a.gap < 0);

  return (
    <div>
      <PageHeader eyebrow="Stocks" title="Alertes seuils" description="Seuil min atteint → besoin d'achat. Liste actionnable, pas un simple voyant." />
      {alerts.length === 0 ? (
        <Guard variant="ok" title="Aucun article sous seuil">
          Les matières sont au-dessus des minimums paramétrés.
        </Guard>
      ) : (
        <Panel>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
                <th className="text-left px-3 py-2">Matière</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-right px-3 py-2">Seuil</th>
                <th className="text-right px-3 py-2">Écart</th>
                <th className="text-left px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.m.id} className="border-b border-line">
                  <td className="px-3 py-2">{materialName(a.m.id)}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(a.qty, 1)}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(a.m.minStock, 1)}</td>
                  <td className="px-3 py-2 text-right num text-danger">{formatQty(a.gap, 1)}</td>
                  <td className="px-3 py-2">
                    <Link className="text-primary" href="/approvisionnement/besoins">
                      Créer un besoin d'achat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
