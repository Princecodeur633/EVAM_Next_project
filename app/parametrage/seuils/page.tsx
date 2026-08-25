"use client";

import { PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function SeuilsPage() {
  const { state, dispatch, productName, materialName, canEditParam, role } = useStore();
  const edit = canEditParam("/parametrage/seuils");
  const canPf = edit && (role === "administrateur" || role === "responsable_production");
  const canMp = edit && (role === "administrateur" || role === "responsable_achats");

  return (
    <div>
      <PageHeader
        eyebrow="Paramétrage"
        title="Seuils d'alerte"
        description="Min par article. Production = seuils PF. Achats = seuils matières. Déclenche le besoin d'achat."
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Article</th>
              <th className="text-right px-3 py-2">Seuil min</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-3 py-2">{productName(p.id)} (PF)</td>
                <td className="px-3 py-2 text-right">
                  {canPf ? (
                    <input
                      type="number"
                      className="h-8 w-28 border border-line-strong rounded-[6px] px-2 text-right num"
                      defaultValue={p.minStock}
                      onBlur={(e) =>
                        dispatch({ type: "SET_THRESHOLD", articleType: "produit", id: p.id, minStock: Number(e.target.value) })
                      }
                    />
                  ) : (
                    <span className="num">{formatQty(p.minStock)}</span>
                  )}
                </td>
              </tr>
            ))}
            {state.materials.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2">{materialName(m.id)}</td>
                <td className="px-3 py-2 text-right">
                  {canMp ? (
                    <input
                      type="number"
                      className="h-8 w-28 border border-line-strong rounded-[6px] px-2 text-right num"
                      defaultValue={m.minStock}
                      onBlur={(e) =>
                        dispatch({ type: "SET_THRESHOLD", articleType: "matiere", id: m.id, minStock: Number(e.target.value) })
                      }
                    />
                  ) : (
                    <span className="num">{formatQty(m.minStock, 1)}</span>
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
