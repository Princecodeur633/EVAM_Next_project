"use client";

import { useState } from "react";
import { Segmented } from "@/components/Filters";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, formatDa, formatDateTime, num } from "@/lib/utils";

/** Écarts de caisse constatés à la clôture des sessions (lecture : un écart ne se supprime jamais). */
export default function EcartsCaissePage() {
  const { state, userName } = useStore();
  const [vue, setVue] = useState<"A_VALIDER" | "TOUS">("A_VALIDER");
  const session = (id: number) => state.sessionsCaisse.find((s) => s.id === id);
  const caisse = (id?: number) => state.caisses.find((c) => c.id === id)?.nom;
  const rows = state.ecartsCaisse
    .filter((e) => vue === "TOUS" || e.valide_par == null)
    .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
  const total = rows.reduce((a, e) => a + num(e.montant_ecart), 0);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Contrôle"
        title="Écarts de caisse"
        description="Différences entre le solde compté et le solde théorique, constatées à la clôture des sessions. Ils ne se suppriment jamais."
      />
      <Panel className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Vue"
            value={vue}
            onChange={setVue}
            options={[
              { value: "A_VALIDER", label: "À valider", count: state.ecartsCaisse.filter((e) => e.valide_par == null).length },
              { value: "TOUS", label: "Tous", count: state.ecartsCaisse.length },
            ]}
          />
          <span className="text-[12.5px] text-muted">
            Total <span className={cn("num font-semibold", total < 0 ? "text-danger" : "text-ink")}>{formatDa(total)}</span>
          </span>
        </div>
        <DataTable
          emptyText="Aucun écart de caisse."
          columns={[
            { key: "d", label: "Constaté le" },
            { key: "c", label: "Caisse" },
            { key: "k", label: "Caissier" },
            { key: "m", label: "Écart", className: "text-right" },
            { key: "j", label: "Justification" },
            { key: "v", label: "Validation" },
          ]}
          rows={rows.map((e) => {
            const s = session(e.session_caisse);
            const m = num(e.montant_ecart);
            return {
              d: formatDateTime(e.date_creation),
              c: caisse(s?.caisse) ?? `Session n°${e.session_caisse}`,
              k: s ? userName(s.caissier) : "—",
              m: <span className={cn("num font-semibold", m < 0 ? "text-danger" : "text-warning")}>{formatDa(m)}</span>,
              j: <span className="whitespace-normal block max-w-[420px]">{e.justification || <span className="text-danger">Sans justification</span>}</span>,
              v: e.valide_par ? <StatusBadge tone="success">Validé · {userName(e.valide_par)}</StatusBadge> : <StatusBadge tone="warning">À valider</StatusBadge>,
            };
          })}
        />
      </Panel>
    </div>
  );
}
