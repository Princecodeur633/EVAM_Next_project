"use client";

import { DonutChart, KpiCard, WidgetCard } from "@/components/charts";
import { Button, Guard, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function BrouillardsPage() {
  const { state, dispatch, can } = useStore();
  const aValider = state.drafts.filter((d) => d.status === "a_valider");
  const exclus = state.drafts.filter((d) => d.status === "exclu");
  const amountPending = aValider.reduce((a, d) => a + d.amount, 0);

  const mix = [
    { label: "À valider", value: aValider.length || 0.001, color: "var(--chart-3)" },
    { label: "Validés", value: state.drafts.filter((d) => d.status === "valide").length, color: "var(--chart-2)" },
    { label: "Exportés", value: state.drafts.filter((d) => d.status === "exporte").length, color: "var(--chart-5)" },
    { label: "Exclus", value: exclus.length || 0.001, color: "var(--danger)" },
  ];

  return (
    <div className="space-y-4 anim-in">
      <PageHeader
        eyebrow="Comptabilité · Finance"
        title="Brouillards"
        description="Générés automatiquement à chaque facture vente/achat. Seule la comptabilité valide. Les suspendues sont exclues."
      />
      <Guard variant="warn" title="Jamais de saisie manuelle d'écriture">
        Le brouillard naît de la commande ou de l'achat. La comptabilité contrôle, elle ne recopie pas.
      </Guard>

      <div className="grid sm:grid-cols-3 gap-3">
        <KpiCard label="À valider" value={aValider.length} tone="warning" hint={formatDa(amountPending)} />
        <KpiCard label="Exclus Sage" value={exclus.length} tone="danger" hint="Factures suspendues" />
        <KpiCard label="Total pièces" value={state.drafts.length} hint="Ventes + achats" />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <WidgetCard title="Pipeline comptable" subtitle="Statuts des brouillards">
          <DonutChart data={mix} centerValue={String(aValider.length)} centerLabel="file" />
        </WidgetCard>

        <Panel>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
                <th className="text-left px-3 py-2">Journal</th>
                <th className="text-left px-3 py-2">Réf</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-right px-3 py-2">Montant</th>
                <th className="text-left px-3 py-2">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.drafts.map((d) => (
                <tr key={d.id} className="border-b border-line">
                  <td className="px-3 py-2 num">{d.journal}</td>
                  <td className="px-3 py-2 num">{d.ref}</td>
                  <td className="px-3 py-2">{d.kind}</td>
                  <td className="px-3 py-2 text-right num">{formatDa(d.amount)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      tone={d.status === "exclu" ? "danger" : d.status === "exporte" ? "success" : d.status === "valide" ? "teal" : "warning"}
                    >
                      {d.status}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    {d.status === "a_valider" && can("VALIDATE_DRAFT") && (
                      <Button onClick={() => dispatch({ type: "VALIDATE_DRAFT", id: d.id })}>Valider</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
