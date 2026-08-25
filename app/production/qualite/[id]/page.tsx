"use client";

import { useParams } from "next/navigation";
import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { OfBadge } from "@/components/badges";
import { useStore } from "@/lib/store";

export default function QualiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, productName, can } = useStore();
  const of = state.ofList.find((o) => o.id === decodeURIComponent(id));
  const sheet = of ? state.sheets.find((s) => s.productId === of.productId && s.status === "active") : undefined;
  if (!of) return <p>Lot introuvable</p>;

  const waiting = of.status === "fin_production" || of.status === "controle_qualite";

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Contrôle qualité" title={of.lot ?? of.id} status={<OfBadge status={of.status} />} description={productName(of.productId)} />
      {of.status === "bloque" && (
        <Guard variant="block" title="Non conforme — stock PF non alimenté">
          {of.qualityNotes}
        </Guard>
      )}
      {of.status === "cloture" && (
        <Guard variant="ok" title="Lot conforme entré en stock">
          Disponible à la vente.
        </Guard>
      )}
      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-3">Critères de la fiche technique</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted">
              <th className="text-left py-1">Contrôle</th>
              <th className="text-left py-1">Seuils</th>
              <th className="text-left py-1">Obligatoire</th>
            </tr>
          </thead>
          <tbody>
            {sheet?.qualityChecks.map((c) => (
              <tr key={c.name} className="border-t border-line">
                <td className="py-1.5">{c.name}</td>
                <td className="py-1.5 num">
                  {c.min ?? "—"} / {c.max ?? "—"} {c.unit}
                </td>
                <td className="py-1.5">{c.required ? "Oui" : "Informe"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {waiting && can("QUALITY_CLOSE") && (
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => dispatch({ type: "QUALITY_BLOCK", ofId: of.id, notes: "Hors tolérance — lot en quarantaine" })}>
            Non conforme — bloquer
          </Button>
          <Button variant="success" onClick={() => dispatch({ type: "QUALITY_CLOSE", ofId: of.id })}>
            Conforme — clôturer et entrer en stock
          </Button>
        </div>
      )}
    </div>
  );
}
