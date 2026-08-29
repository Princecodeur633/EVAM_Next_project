"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { MOTIF_PERTE_LABEL } from "@/lib/labels";
import type { MotifPerte } from "@/lib/types";

export default function CausesPertesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Motifs de pertes" description="Casse, non-conformité, panne machine, erreur de manipulation." />
      <Panel>
        <DataTable
          columns={[{ key: "l", label: "Motif" }]}
          rows={(Object.keys(MOTIF_PERTE_LABEL) as MotifPerte[]).map((k) => ({ l: MOTIF_PERTE_LABEL[k] }))}
        />
      </Panel>
    </div>
  );
}
