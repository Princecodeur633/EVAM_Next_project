"use client";

import { useParams } from "next/navigation";
import { ClaimBadge } from "@/components/badges";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ReclamationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const c = state.claims.find((x) => x.id === id);
  if (!c) return <p>Réclamation introuvable</p>;
  const motif = state.claimReasons.find((m) => m.id === c.motifId);
  return (
    <div className="space-y-4">
      <PageHeader title={c.number} status={<ClaimBadge status={c.status} />} description={motif?.label} />
      <Panel className="p-4 text-[13px] space-y-2">
        <p>{c.notes}</p>
        <p className="text-muted">Lot {c.lot}</p>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={() => dispatch({ type: "DECIDE_CLAIM", id: c.id, status: "quarantaine" })}>
            Quarantaine
          </Button>
          <Button variant="success" onClick={() => dispatch({ type: "DECIDE_CLAIM", id: c.id, status: "acceptee" })}>
            Accepter
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: "DECIDE_CLAIM", id: c.id, status: "rejetee" })}>
            Rejeter
          </Button>
        </div>
      </Panel>
    </div>
  );
}
