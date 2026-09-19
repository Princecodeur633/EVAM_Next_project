"use client";

import { useEffect, useState } from "react";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { fetchImpayes, type FactureImpayee } from "@/lib/api";
import { formatDa, formatDate, num } from "@/lib/utils";

export default function ImpayesPage() {
  const [rows, setRows] = useState<FactureImpayee[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchImpayes()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les impayés.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Impayés"
        description="Factures de clients à crédit non soldées, échéance dépassée, triées par retard décroissant (§8.5)."
      />
      <Panel>
        {error ? (
          <p className="p-4 text-[13px] text-danger">{error}</p>
        ) : (
          <DataTable
            columns={[
              { key: "f", label: "Facture" },
              { key: "c", label: "Client" },
              { key: "e", label: "Échéance" },
              { key: "m", label: "Montant" },
              { key: "p", label: "Payé" },
              { key: "r", label: "Restant" },
              { key: "j", label: "Retard" },
            ]}
            rows={(rows ?? []).map((f) => ({
              f: f.facture,
              c: f.client,
              e: f.echeance ? formatDate(f.echeance) : "—",
              m: formatDa(num(f.montant)),
              p: formatDa(num(f.paye)),
              r: formatDa(num(f.restant)),
              j: <StatusBadge tone={f.jours_retard > 30 ? "danger" : "warning"}>{f.jours_retard} j</StatusBadge>,
            }))}
          />
        )}
      </Panel>
    </div>
  );
}
