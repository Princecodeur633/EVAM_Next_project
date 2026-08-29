"use client";

import { useParams } from "next/navigation";
import { BlBadge } from "@/components/badges";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function BlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, can } = useStore();
  const bl = state.bonsLivraison.find((b) => b.id === Number(id));
  if (!bl) return <p className="text-[13px] text-muted">Bon de livraison introuvable.</p>;
  const cmd = state.commandes.find((c) => c.id === bl.commande);
  const tournee = bl.tournee ? state.tournees.find((t) => t.id === bl.tournee) : null;
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Bon de livraison"
        title={bl.numero}
        status={<BlBadge status={bl.statut} />}
        description={cmd?.numero}
        actions={can("CONFIRMER_BL") && bl.statut !== "LIVREE" ? (
          <Button onClick={() => void dispatch({ type: "CONFIRMER_BL", id: bl.id })}>Confirmer la livraison</Button>
        ) : null}
      />
      <Panel className="p-4 text-[13px] space-y-1">
        <p>Signature client : {bl.signature_client ? "Oui" : "Non"}</p>
        <p>Tournée : {tournee?.numero ?? "—"}</p>
      </Panel>
    </div>
  );
}
