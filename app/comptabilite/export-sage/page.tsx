"use client";

import { Button, Guard, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function ExportSagePage() {
  const { state, dispatch, can } = useStore();
  const ready = state.drafts.filter((d) => d.status === "valide");
  const excluded = state.drafts.filter((d) => d.status === "exclu");
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Interface Sage 100"
        title="Export manuel validé"
        description="V1 : fichier d'export après validation humaine. Pas de synchro automatique. Mapping issu du spike Sprint 1."
      />
      <Guard variant="block" title="Les factures suspendues sont exclues de l'export">
        {excluded.length} pièce(s) exclue(s) — {excluded.map((d) => d.ref).join(", ") || "aucune"}.
      </Guard>
      <Panel className="p-4 space-y-2 text-[13px]">
        <p>
          Journal ventes {state.sageMapping.journalVente} · comptes {state.sageMapping.compteClient} / {state.sageMapping.compteFournisseur}
        </p>
        <p>
          Pièces prêtes : <span className="num font-medium">{ready.length}</span> ·{" "}
          {formatDa(ready.reduce((a, d) => a + d.amount, 0))}
        </p>
        {can("EXPORT_SAGE") && (
          <Button
            onClick={() => {
              if (confirm("Exporter vers Sage 100 les brouillards validés uniquement ?")) dispatch({ type: "EXPORT_SAGE" });
            }}
          >
            Exporter les pièces validées
          </Button>
        )}
      </Panel>
    </div>
  );
}
