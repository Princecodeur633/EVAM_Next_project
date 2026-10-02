"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_INV_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function InventairesPage() {
  const { state, can, userName } = useStore();
  const router = useRouter();
  const [ouvrir, setOuvrir] = useState(false);
  const depotName = (id: number) => state.depots.find((d) => d.id === id)?.nom ?? `#${id}`;
  const rows = [...state.inventaires].sort((a, b) => Number(b.statut === "EN_COURS") - Number(a.statut === "EN_COURS") || (a.date_inventaire < b.date_inventaire ? 1 : -1));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Stocks"
        title="Inventaires"
        description="Comptage physique par dépôt. Clôturez l’inventaire une fois le contrôle terminé : les écarts ajustent le stock."
        actions={
          can("CREATE_INVENTAIRE") ? (
            <Button onClick={() => setOuvrir(true)}>
              <Plus size={15} /> Ouvrir un inventaire
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <DataTable
          emptyText="Aucun inventaire."
          columns={[
            { key: "d", label: "Dépôt" },
            { key: "dt", label: "Date" },
            { key: "s", label: "Statut" },
            { key: "c", label: "Ouvert par" },
          ]}
          rows={rows.map((i) => ({
            d: depotName(i.depot),
            dt: formatDate(i.date_inventaire),
            s: <StatusBadge tone={i.statut === "EN_COURS" ? "warning" : "success"}>{STATUT_INV_LABEL[i.statut]}</StatusBadge>,
            c: userName(i.cree_par),
            href: `/stocks/inventaires/${i.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
      {ouvrir && <OuvrirDrawer onClose={() => setOuvrir(false)} />}
    </div>
  );
}

function OuvrirDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [depot, setDepot] = useState(state.depotId ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_INVENTAIRE", depot, date_inventaire: date });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Ouvrir un inventaire"
      icon={<ClipboardCheck size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!depot || !date || saving} onClick={() => void submit()}>
            {saving ? "Ouverture…" : "Ouvrir"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Inventaire">
        <Field label="Dépôt">
          <select className={inputClass} value={depot} onChange={(e) => setDepot(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {state.depots.filter((d) => d.actif).map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date du comptage">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
