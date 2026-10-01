"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackageOpen, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_PREP_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { StatutPreparation } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const PREP_TONE: Record<StatutPreparation, "info" | "warning" | "teal" | "success"> = {
  A_PREPARER: "info",
  EN_PREPARATION: "warning",
  PRETE: "teal",
  SORTIE_MAGASIN: "success",
};

type Filtre = "A_TRAITER" | "SORTIES" | "TOUTES";

export default function PreparationsPage() {
  const { state, can, clientName, userName } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("A_TRAITER");
  const [lancer, setLancer] = useState(false);
  const cmd = (id: number) => state.commandes.find((c) => c.id === id);
  const aTraiter = (s: StatutPreparation) => s !== "SORTIE_MAGASIN";

  const rows = state.preparations
    .filter((p) => (filtre === "TOUTES" ? true : filtre === "SORTIES" ? p.statut === "SORTIE_MAGASIN" : aTraiter(p.statut)))
    .filter((p) => {
      const c = cmd(p.commande);
      return matchSearch(q, c?.numero, c ? clientName(c.client) : "");
    })
    .sort((a, b) => new Date(a.date_lancement).getTime() - new Date(b.date_lancement).getTime());

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Magasin"
        title="Préparations"
        description="Préparez chaque commande, confirmez la préparation, puis la sortie magasin : le stock est débité à la sortie."
        actions={
          can("CREATE_PREP") ? (
            <Button onClick={() => setLancer(true)}>
              <Plus size={15} /> Lancer une préparation
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.preparations.length} active={!!q || filtre !== "A_TRAITER"} onReset={() => { setQ(""); setFiltre("A_TRAITER"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Commande, client…" />
          <Segmented
            label="Statut"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "A_TRAITER", label: "À traiter", count: state.preparations.filter((p) => aTraiter(p.statut)).length },
              { value: "SORTIES", label: "Sorties", count: state.preparations.filter((p) => p.statut === "SORTIE_MAGASIN").length },
              { value: "TOUTES", label: "Toutes" },
            ]}
          />
        </FilterBar>
        <DataTable
          emptyText={state.preparations.length ? "Aucune préparation pour ces filtres." : "Aucune préparation."}
          columns={[
            { key: "c", label: "Commande" },
            { key: "cl", label: "Client" },
            { key: "s", label: "Statut" },
            { key: "l", label: "Lancée" },
            { key: "p", label: "Préparée par" },
          ]}
          rows={rows.map((p) => {
            const c = cmd(p.commande);
            return {
              c: <span className="num font-medium">{c?.numero ?? `Commande n°${p.commande}`}</span>,
              cl: c ? clientName(c.client) : "—",
              s: <StatusBadge tone={PREP_TONE[p.statut]}>{STATUT_PREP_LABEL[p.statut]}</StatusBadge>,
              l: formatDateTime(p.date_lancement),
              p: p.preparee_par ? userName(p.preparee_par) : "—",
              href: `/distribution/preparations/${p.id}`,
            };
          })}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
      {lancer && <LancerDrawer onClose={() => setLancer(false)} />}
    </div>
  );
}

function LancerDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, clientName } = useStore();
  const dejaLancees = new Set(state.preparations.map((p) => p.commande));
  const commandes = state.commandes.filter((c) => c.statut === "VALIDEE" && !dejaLancees.has(c.id));
  const [commande, setCommande] = useState(0);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_PREP", commande });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Lancer une préparation"
      icon={<PackageOpen size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!commande || saving} onClick={() => void submit()}>
            {saving ? "Lancement…" : "Lancer"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Commande" hint="Commandes validées sans préparation en cours.">
        <Field label="Commande">
          <select className={inputClass} value={commande} onChange={(e) => setCommande(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir…</option>
            {commandes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.numero} · {clientName(c.client)}
              </option>
            ))}
          </select>
        </Field>
        {commandes.length === 0 && <p className="text-[12px] text-muted">Aucune commande validée en attente de préparation.</p>}
      </DrawerSection>
    </Drawer>
  );
}
