"use client";

import Link from "next/link";
import { FAMILY_LABEL } from "@/lib/seed";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function ProduitsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Produits finis" description="Une fiche = un produit planifiable. Famille = filtre structurant (eau / jus / yaourt)." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-left px-3 py-2">Famille</th>
              <th className="text-left px-3 py-2">Unité</th>
              <th className="text-right px-3 py-2">Prix HT</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/parametrage/produits/${p.id}`}>
                    {p.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{FAMILY_LABEL[p.family]}</td>
                <td className="px-3 py-2">{p.unit}</td>
                <td className="px-3 py-2 text-right num">{formatDa(p.priceHt)}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={p.active ? "success" : "neutral"}>{p.active ? "Actif" : "Inactif"}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
