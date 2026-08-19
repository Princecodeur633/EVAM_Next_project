"use client";

import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function DemandesMatieresPage() {
  const { state, dispatch, materialName, role } = useStore();
  const canValidate = role === "magasinier" || role === "administrateur";
  return (
    <div>
      <PageHeader
        eyebrow="Production / Magasin"
        title="Demandes de matières"
        description="Workflow : demandée → validée magasin → sortie de stock. L'atelier ne sort pas lui-même les matières."
      />
      <div className="space-y-3">
        {state.materialRequests.map((r) => (
          <Panel key={r.id} className="p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium num">{r.ofId}</p>
              <ul className="text-[13px] text-muted mt-1">
                {r.lines.map((l) => (
                  <li key={l.materialId}>
                    {materialName(l.materialId)} · {formatQty(l.qty, 1)}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] mt-2 uppercase tracking-wide text-muted">{r.status}</p>
            </div>
            {r.status === "demandee" && canValidate && (
              <Button onClick={() => dispatch({ type: "VALIDATE_MATERIAL_REQUEST", id: r.id })}>Servir (sortie stock)</Button>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
