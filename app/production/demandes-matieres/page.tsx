"use client";

import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { materialAvail } from "@/lib/engine";
import { formatQty } from "@/lib/utils";

export default function DemandesMatieresPage() {
  const { state, dispatch, materialName, can } = useStore();
  return (
    <div>
      <PageHeader
        eyebrow="Production / Magasin"
        title="Demandes de matières"
        description="Workflow : demandée → validée magasin → sortie de stock. L'atelier ne sort pas lui-même les matières. Le magasinier ne saisit pas d'entrée PF."
      />
      <div className="space-y-3">
        {state.materialRequests.map((r) => (
          <Panel key={r.id} className="p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium num">{r.ofId}</p>
              <ul className="text-[13px] text-muted mt-1">
                {r.lines.map((l) => {
                  const avail = materialAvail(state, l.materialId);
                  const short = avail < l.qty;
                  return (
                    <li key={l.materialId} className={short ? "text-danger" : undefined}>
                      {materialName(l.materialId)} · besoin {formatQty(l.qty, 1)} · dispo {formatQty(avail, 1)}
                      {short ? " — insuffisant" : ""}
                    </li>
                  );
                })}
              </ul>
              <p className="text-[12px] mt-2 uppercase tracking-wide text-muted">{r.status}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {r.status === "demandee" && can("ACK_MATERIAL_REQUEST") && (
                <Button onClick={() => dispatch({ type: "ACK_MATERIAL_REQUEST", id: r.id })}>Valider la demande</Button>
              )}
              {r.status === "validee" && can("SERVE_MATERIAL_REQUEST") && (
                <Button variant="success" onClick={() => dispatch({ type: "SERVE_MATERIAL_REQUEST", id: r.id })}>
                  Servir (sortie stock)
                </Button>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
