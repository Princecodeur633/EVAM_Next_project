"use client";

import Link from "next/link";
import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function AlertesPage() {
  const { state, dispatch, materialName, productName, can, role } = useStore();
  const matAlerts = state.materials
    .map((m) => {
      const qty = state.stock.filter((s) => s.articleId === m.id && s.depotId === "dep-mp").reduce((a, s) => a + s.qty, 0);
      return { kind: "matiere" as const, id: m.id, name: materialName(m.id), qty, min: m.minStock, gap: qty - m.minStock };
    })
    .filter((a) => a.gap < 0);
  const pfAlerts = state.products
    .map((p) => {
      const qty = state.stock.filter((s) => s.articleId === p.id && s.depotId === "dep-pf").reduce((a, s) => a + s.qty, 0);
      return { kind: "produit" as const, id: p.id, name: productName(p.id), qty, min: p.minStock, gap: qty - p.minStock };
    })
    .filter((a) => a.gap < 0);

  const alerts = [...pfAlerts, ...matAlerts];

  return (
    <div>
      <PageHeader
        eyebrow="Stocks"
        title="Alertes seuils"
        description="Seuil min atteint. Action : planifier (PF) ou créer une DA (matières) — selon votre poste."
      />
      {alerts.length === 0 ? (
        <Guard variant="ok" title="Aucun article sous seuil">
          Les stocks sont au-dessus des minimums paramétrés.
        </Guard>
      ) : (
        <Panel>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
                <th className="text-left px-3 py-2">Article</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-right px-3 py-2">Seuil</th>
                <th className="text-right px-3 py-2">Écart</th>
                <th className="text-left px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-line">
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2">{a.kind === "produit" ? "PF vendable" : "Matière"}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(a.qty, 1)}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(a.min, 1)}</td>
                  <td className="px-3 py-2 text-right num text-danger">{formatQty(a.gap, 1)}</td>
                  <td className="px-3 py-2">
                    {a.kind === "matiere" && can("CREATE_DA") ? (
                      <Button
                        onClick={() =>
                          dispatch({
                            type: "CREATE_DA",
                            materialId: a.id,
                            qty: Math.ceil(Math.abs(a.gap) * 1.2),
                            reason: "Alerte seuil",
                          })
                        }
                      >
                        Créer une DA
                      </Button>
                    ) : a.kind === "produit" && role === "responsable_production" ? (
                      <Link className="text-primary" href="/production/planning">
                        Planifier
                      </Link>
                    ) : (
                      <span className="text-[12px] text-muted">Signalé — hors votre action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
