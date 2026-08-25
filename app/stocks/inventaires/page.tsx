"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_INV_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function InventairesPage() {
  const { state, dispatch, can, userName } = useStore();
  const router = useRouter();
  const [depot, setDepot] = useState(state.depotId ?? state.depots[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const depotName = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Stocks" title="Inventaires" description="Comptage physique par dépôt. Clôturez l’inventaire une fois le contrôle terminé." />
      {can("CREATE_INVENTAIRE") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Dépôt">
            <select className={inputClass} value={depot} onChange={(e) => setDepot(Number(e.target.value))}>
              {state.depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Button disabled={!depot} onClick={() => void dispatch({ type: "CREATE_INVENTAIRE", depot, date_inventaire: date })}>Ouvrir</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "d", label: "Dépôt" }, { key: "dt", label: "Date" }, { key: "s", label: "Statut" }, { key: "c", label: "Créé par" }]}
          rows={state.inventaires.map((i) => ({
            d: depotName(i.depot),
            dt: formatDate(i.date_inventaire),
            s: STATUT_INV_LABEL[i.statut],
            c: userName(i.cree_par),
            href: `/stocks/inventaires/${i.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
