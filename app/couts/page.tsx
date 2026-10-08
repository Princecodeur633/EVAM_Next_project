"use client";

import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function CoutsPage() {
  const { state, dispatch, ofNumero, can } = useStore();
  const total = (c: (typeof state.coutsReels)[number]) =>
    num(c.cout_matiere_total) + num(c.cout_main_oeuvre_total) + num(c.cout_energie_total) + num(c.cout_amortissement_total) + num(c.cout_charges_reparties);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Coûts" title="Coûts réels" description="Matières, main-d’œuvre, énergie, amortissement et charges réparties par la cascade, par ordre de fabrication. Dès qu’une charge est saisie dans la cascade pour la période, l’ancienne répartition au prorata (énergie, amortissement) n’est plus appliquée." />
      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "m", label: "Matières" }, { key: "mo", label: "MO" }, { key: "e", label: "Énergie" }, { key: "a", label: "Amort." }, { key: "c", label: "Charges réparties" }, { key: "t", label: "Total" }, { key: "act", label: "" }]}
          rows={state.coutsReels.map((c) => ({
            of: ofNumero(c.ordre_fabrication),
            m: formatDa(num(c.cout_matiere_total)),
            mo: formatDa(num(c.cout_main_oeuvre_total)),
            e: formatDa(num(c.cout_energie_total)),
            a: formatDa(num(c.cout_amortissement_total)),
            c: formatDa(num(c.cout_charges_reparties)),
            t: formatDa(total(c)),
            act: can("RECALCULER_COUT") ? (
              <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "RECALCULER_COUT", id: c.id })}>Recalculer</button>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
