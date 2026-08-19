"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty } from "@/lib/utils";

export default function InventaireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, productName } = useStore();
  const inv = state.inventories.find((i) => i.id === id);
  const [counts, setCounts] = useState<Record<string, number>>({});
  if (!inv) return <p>Session introuvable</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Inventaire"
        title={inv.id}
        description="Le théorique n'est pas éditable. Le physique est saisi par le magasinier. La validation écrit l'ajustement."
        actions={
          <>
            {inv.status === "ouvert" && (
              <Button onClick={() => dispatch({ type: "COUNT_INVENTORY", id: inv.id, counts })}>Enregistrer le comptage</Button>
            )}
            {inv.status === "compte" && (
              <Button variant="success" onClick={() => dispatch({ type: "VALIDATE_INVENTORY", id: inv.id })}>
                Valider les écarts
              </Button>
            )}
          </>
        }
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
              <th className="text-left px-3 py-2">Article</th>
              <th className="text-right px-3 py-2">Théorique</th>
              <th className="text-right px-3 py-2">Physique</th>
              <th className="text-right px-3 py-2">Écart</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => {
              const phys = l.physical ?? counts[l.articleId] ?? l.theoretical;
              return (
                <tr key={l.articleId} className="border-b border-line">
                  <td className="px-3 py-2">{productName(l.articleId)}</td>
                  <td className="px-3 py-2 text-right num">{formatQty(l.theoretical)}</td>
                  <td className="px-3 py-2 text-right">
                    {inv.status === "ouvert" ? (
                      <input
                        type="number"
                        className="h-8 w-28 border border-line-strong rounded-[6px] px-2 text-right num"
                        defaultValue={l.theoretical}
                        onChange={(e) => setCounts({ ...counts, [l.articleId]: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="num">{phys}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right num">{formatQty(phys - l.theoretical)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
