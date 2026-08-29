"use client";

import { useParams } from "next/navigation";
import { Button, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { STATUT_PREP_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function PreparationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, can, userName, clientName } = useStore();
  const p = state.preparations.find((x) => x.id === Number(id));
  if (!p) return <p className="text-[13px] text-muted">Préparation introuvable.</p>;
  const cmd = state.commandes.find((c) => c.id === p.commande);
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Préparation"
        title={cmd?.numero ?? `Préparation ${p.id}`}
        status={<StatusBadge tone="info">{STATUT_PREP_LABEL[p.statut]}</StatusBadge>}
        description={cmd ? clientName(cmd.client) : undefined}
        actions={
          <>
            {p.statut === "A_PREPARER" && can("PREP_CONFIRMER") && <Button onClick={() => void dispatch({ type: "PREP_CONFIRMER", id: p.id })}>Confirmer préparation</Button>}
            {can("PREP_SORTIE") && <Button onClick={() => void dispatch({ type: "PREP_SORTIE", id: p.id })}>Confirmer sortie magasin</Button>}
          </>
        }
      />
      <Panel className="p-4 text-[13px] space-y-1">
        <p>Lancée par {userName(p.lancee_par)}</p>
        <p>Préparée par {p.preparee_par ? userName(p.preparee_par) : "—"}</p>
      </Panel>
    </div>
  );
}
