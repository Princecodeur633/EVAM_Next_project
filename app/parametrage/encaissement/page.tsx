"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { MODE_PAIEMENT_LABEL } from "@/lib/labels";
import type { ModePaiement } from "@/lib/types";

export default function EncaissementModesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Modes de paiement" description="Espèces, mobile money, virement et chèque." />
      <Panel>
        <DataTable
          columns={[{ key: "l", label: "Mode" }]}
          rows={(Object.keys(MODE_PAIEMENT_LABEL) as ModePaiement[]).map((k) => ({ l: MODE_PAIEMENT_LABEL[k] }))}
        />
      </Panel>
    </div>
  );
}
