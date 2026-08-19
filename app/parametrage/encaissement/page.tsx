"use client";

import { PageHeader, Panel } from "@/components/ui";

export default function EncaissementParamPage() {
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Modes d'encaissement" description="Espèces, CB, virement — filtrés ensuite par type client." />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Mode</th>
              <th className="text-left px-3 py-2">Comptant</th>
              <th className="text-left px-3 py-2">À terme</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="px-3 py-2">Espèces</td>
              <td className="px-3 py-2">Oui</td>
              <td className="px-3 py-2 text-muted">Non</td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-3 py-2">Carte bancaire</td>
              <td className="px-3 py-2">Oui</td>
              <td className="px-3 py-2">Selon contrat</td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-3 py-2">Virement</td>
              <td className="px-3 py-2 text-muted">Non</td>
              <td className="px-3 py-2">Oui</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
