"use client";

import Link from "next/link";
import { Button, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FichesTechniquesPage() {
  const { state, productName, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/fiches-techniques");
  return (
    <div>
      <PageHeader
        eyebrow="Paramétrage"
        title="Fiches techniques"
        description="Une seule FT active par produit. Versionnée. Multi-onglets : composition, emballages, process, rendement, contrôles."
      />
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Produit</th>
              <th className="text-left px-3 py-2">Version</th>
              <th className="text-left px-3 py-2">Statut</th>
              <th className="text-right px-3 py-2">Rendement</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.sheets.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary" href={`/parametrage/fiches-techniques/${s.id}`}>
                    {productName(s.productId)}
                  </Link>
                </td>
                <td className="px-3 py-2 num">v{s.version}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={s.status === "active" ? "success" : "neutral"}>{s.status}</StatusBadge>
                </td>
                <td className="px-3 py-2 text-right num">{s.yieldExpected} %</td>
                <td className="px-3 py-2 text-right">
                  {edit && s.status !== "active" && (
                    <Button variant="ghost" onClick={() => dispatch({ type: "ACTIVATE_SHEET", id: s.id })}>
                      Activer
                    </Button>
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
