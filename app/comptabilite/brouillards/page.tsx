"use client";

import { Button, Guard, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function BrouillardsPage() {
  const { state, dispatch, role } = useStore();
  const can = role === "comptabilite" || role === "administrateur";
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Brouillards"
        description="Générés automatiquement à chaque facture vente/achat. Seule la comptabilité valide. Les suspendues sont exclues."
      />
      <Guard variant="warn" title="Jamais de saisie manuelle d'écriture">
        Le brouillard naît de la commande ou de l'achat. La comptabilité contrôle, elle ne recopie pas.
      </Guard>
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-[#f8fafb]">
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
                  {d.status === "a_valider" && can && (
                    <Button onClick={() => dispatch({ type: "VALIDATE_DRAFT", id: d.id })}>Valider</Button>
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
