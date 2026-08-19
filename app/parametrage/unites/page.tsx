"use client";

import { PageHeader, Panel } from "@/components/ui";

const UNITS = [
  ["L", "Litre", "Matières liquides, eau"],
  ["kg", "Kilogramme", "Ingrédients solides"],
  ["g", "Gramme", "Ferments"],
  ["u", "Unité", "Emballages, bouteilles"],
  ["bouteille", "Bouteille PF", "Eau, jus"],
  ["pot", "Pot", "Yaourt"],
  ["pack 6", "Colis vente", "Conditionnement commercial"],
  ["palette", "Palette", "Expédition"],
];

export default function UnitesPage() {
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Unités & conversions" description="Une erreur de conversion = un stock faux. Les masques sont fermés." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Symbole</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-left px-3 py-2">Usage</th>
            </tr>
          </thead>
          <tbody>
            {UNITS.map((u) => (
              <tr key={u[0]} className="border-b border-line">
                <td className="px-3 py-2 num">{u[0]}</td>
                <td className="px-3 py-2">{u[1]}</td>
                <td className="px-3 py-2 text-muted">{u[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
