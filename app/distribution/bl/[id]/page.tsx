"use client";

import { useParams } from "next/navigation";
import { BlBadge } from "@/components/badges";
import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { endpoints } from "@/lib/api";
import { Historique } from "@/components/Historique";

export default function BlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, can } = useStore();
  const bl = state.bonsLivraison.find((b) => b.id === Number(id));
  if (!bl) return <p className="text-[13px] text-muted">Bon de livraison introuvable.</p>;
  const cmd = state.commandes.find((c) => c.id === bl.commande);
  const tournee = bl.tournee ? state.tournees.find((t) => t.id === bl.tournee) : null;
  const enCours = bl.statut === "EN_LIVRAISON";
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Bon de livraison"
        title={bl.numero}
        status={<BlBadge status={bl.statut} />}
        description={cmd?.numero}
        actions={
          <div className="flex flex-wrap gap-2">
            {enCours && can("LIVRER_BL") && !bl.signature_client && (
              <Button onClick={() => void dispatch({ type: "LIVRER_BL", id: bl.id })}>
                Marquer remis au client
              </Button>
            )}
            {enCours && can("SIGNALER_PROBLEME_BL") && (
              <Button
                variant="danger"
                onClick={() => {
                  const motif = window.prompt("Décrivez le problème (obligatoire) :");
                  if (motif?.trim()) void dispatch({ type: "SIGNALER_PROBLEME_BL", id: bl.id, motif: motif.trim() });
                }}
              >
                Signaler un problème
              </Button>
            )}
            {can("CONFIRMER_BL") && bl.statut !== "LIVREE" && (
              <Button onClick={() => void dispatch({ type: "CONFIRMER_BL", id: bl.id })}>Confirmer la livraison</Button>
            )}
          </div>
        }
      />
      {bl.incident_livraison && (
        <Guard variant="warn" title="Problème signalé par le chauffeur">
          {bl.incident_livraison}
        </Guard>
      )}
      <Panel className="p-4 text-[13px] space-y-1">
        <p>Signature client : {bl.signature_client ? "Oui" : "Non"}</p>
        <p>Tournée : {tournee?.numero ?? "—"}</p>
      </Panel>
      <Historique endpoint={endpoints.bonsLivraison} id={bl.id} />
    </div>
  );
}
