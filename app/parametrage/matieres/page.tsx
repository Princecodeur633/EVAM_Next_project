"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatQty } from "@/lib/utils";

export default function MatieresPage() {
  const { state } = useStore();
  const items = state.materials.filter((m) => m.kind !== "emballage");
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Matières" description="CMUP courant en lecture seule — jamais saisi à la main." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-right px-3 py-2">Seuil</th>
              <th className="text-right px-3 py-2">CMUP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/parametrage/matieres/${m.id}`}>
                    {m.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">{m.kind}</td>
                <td className="px-3 py-2 text-right num">{formatQty(m.minStock, 1)}</td>
                <td className="px-3 py-2 text-right num">{formatDa(m.cmup)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
