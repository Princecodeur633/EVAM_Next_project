"use client";

import { BlBadge } from "@/components/badges";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function TourneesPage() {
  const { state, dispatch, customerName, can } = useStore();
  const tour = state.deliveryNotes.filter((b) => b.status === "valide" || b.status === "livre");
  return (
    <div>
      <PageHeader
        eyebrow="Logistique"
        title="Tournées / suivi livraison"
        description="Cible tablette livreur : statut, signature, preuve. Un BL verrouillé n'entre pas en tournée."
      />
      <div className="space-y-3">
        {tour.map((b) => {
          const order = state.orders.find((o) => o.id === b.orderId);
          return (
            <Panel key={b.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium num">{b.number}</p>
                <p className="text-[13px] text-muted">{order ? customerName(order.customerId) : ""}</p>
                <div className="mt-1">
                  <BlBadge status={b.status} />
                </div>
              </div>
              {b.status === "valide" && order && can("DELIVER") && (
                <Button onClick={() => dispatch({ type: "DELIVER", orderId: order.id })}>Signature + preuve — livrer</Button>
              )}
              {b.status === "livre" && <p className="text-[12px] text-success">Signé · preuve jointe</p>}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
