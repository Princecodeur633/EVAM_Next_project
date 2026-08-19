"use client";

import Link from "next/link";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FichesTechniquesPage() {
  const { state, productName } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Fiches techniques" description="Une seule FT active par produit. Versionnée. Multi-onglets : composition, emballages, process, rendement, contrôles." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Produit</th>
              <th className="text-left px-3 py-2">Version</th>
              <th className="text-left px-3 py-2">Statut</th>
              <th className="text-right px-3 py-2">Rendement</th>
            </tr>
          </thead>
          <tbody>
            {state.sheets.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary" href={`/parametrage/fiches-techniques/${s.id}`}>
                    {productName(s.productId)}
                  </Link>
                </td>
                <td className="px-3 py-2 num">v{s.version}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={s.status === "active" ? "success" : "neutral"}>{s.status}</StatusBadge>
                </td>
                <td className="px-3 py-2 text-right num">{s.yieldExpected} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
