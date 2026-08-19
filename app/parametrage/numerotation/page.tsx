"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function NumerotationPage() {
  const { state } = useStore();
  const s = state.settings;
  return (
    <div>
      <PageHeader eyebrow="Paramétrage" title="Numérotation & préfixes" description="Compteurs non réutilisables. Traçabilité OF / FA / BL / DA." />
      <Panel>
        <table className="w-full text-[13px]">
          <tbody>
            <Row k="Préfixe OF" v={`${s.ofPrefix}${String(s.counters.of).padStart(5, "0")}`} />
            <Row k="Préfixe facture" v={`${s.faPrefix}${String(s.counters.fa).padStart(5, "0")}`} />
            <Row k="Préfixe BL" v={`${s.blPrefix}${String(s.counters.bl).padStart(5, "0")}`} />
            <Row k="Dernier compteur DA" v={String(s.counters.da)} />
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-line">
      <td className="px-4 py-2 text-muted">{k}</td>
      <td className="px-4 py-2 num font-medium">{v}</td>
    </tr>
  );
}
