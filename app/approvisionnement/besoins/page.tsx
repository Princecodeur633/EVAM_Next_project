"use client";

import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function ApproBesoinsPage() {
  const { state, dispatch, materialName, can } = useStore();
  const rows = state.materials
    .map((m) => {
      const qty = state.stock.filter((s) => s.articleId === m.id && s.depotId === "dep-mp").reduce((a, s) => a + s.qty, 0);
      const ofNeed = state.materialRequests
        .filter((r) => r.status !== "servie")
        .flatMap((r) => r.lines)
        .filter((l) => l.materialId === m.id)
        .reduce((a, l) => a + l.qty, 0);
      const need = Math.max(0, m.minStock * 1.2 + ofNeed - qty);
      return { m, qty, ofNeed, need };
    })
    .filter((r) => r.need > 0);

  return (
    <div>
      <PageHeader
        eyebrow="Approvisionnement"
        title="Besoins"
        description="Calcul automatique : seuils + demandes OF non servies. Le responsable achats transforme un besoin en DA — pas un tableur parallèle."
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Matière</th>
              <th className="text-right px-3 py-2">Stock MP</th>
              <th className="text-right px-3 py-2">OF en attente</th>
              <th className="text-right px-3 py-2">Besoin proposé</th>
              <th className="text-left px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.m.id} className="border-b border-line">
                <td className="px-3 py-2">{materialName(r.m.id)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(r.qty, 1)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(r.ofNeed, 1)}</td>
                <td className="px-3 py-2 text-right num">{formatQty(r.need, 1)}</td>
                <td className="px-3 py-2">
                  {can("CREATE_DA") ? (
                    <Button
                      onClick={() =>
                        dispatch({
                          type: "CREATE_DA",
                          materialId: r.m.id,
                          qty: Math.ceil(r.need),
                          reason: "Besoin auto (seuil + OF)",
                        })
                      }
                    >
                      Créer une DA
                    </Button>
                  ) : (
                    <span className="text-[12px] text-muted">Lecture</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
