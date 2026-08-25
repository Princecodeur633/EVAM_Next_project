"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { UNITE_LABEL } from "@/lib/labels";
import type { UniteMesure } from "@/lib/types";

export default function UnitesPage() {
  const rows = (Object.keys(UNITE_LABEL) as UniteMesure[]).map((k) => ({ c: k, l: UNITE_LABEL[k] }));
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Unités de mesure" description="Kilogramme, litre, unité, carton, palette et mètre." />
      <Panel>
        <DataTable columns={[{ key: "l", label: "Unité" }, { key: "c", label: "Abréviation" }]} rows={rows} />
      </Panel>
    </div>
  );
}
