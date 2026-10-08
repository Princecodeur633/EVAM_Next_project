"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePlus2, Plus } from "lucide-react";
import { DevisBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { api, endpoints } from "@/lib/api";
import { STATUT_DEVIS_LABEL, TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { contratActif } from "@/lib/tarifs";
import type { Devis, StatutDevis, TypeCommande } from "@/lib/types";
import { cn, formatDa, formatDate, num } from "@/lib/utils";

const EN_COURS: StatutDevis[] = ["BROUILLON", "ENVOYE"];

export default function DevisPage() {
  const { state, can } = useStore();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<StatutDevis | "EN_COURS" | "TOUS">("EN_COURS");

  const rows = state.devis
    .filter((d) => (statut === "TOUS" ? true : statut === "EN_COURS" ? EN_COURS.includes(d.statut) : d.statut === statut))
    .filter((d) => matchSearch(q, d.numero, d.client_nom ?? ""))
    .sort((a, b) => b.date_creation.localeCompare(a.date_creation));
  const chips = [
    { value: "EN_COURS" as const, label: "En cours", count: state.devis.filter((d) => EN_COURS.includes(d.statut)).length },
    ...(Object.keys(STATUT_DEVIS_LABEL) as StatutDevis[])
      .map((s) => ({ value: s, label: STATUT_DEVIS_LABEL[s], count: state.devis.filter((d) => d.statut === s).length }))
      .filter((c) => c.count > 0),
    { value: "TOUS" as const, label: "Tous", count: state.devis.length },
  ];

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Vente"
        title="Devis"
        description="Brouillon → envoyé au client → accepté (en tout ou partie, la commande est créée) / refusé / expiré. Les prix viennent du tarif en vigueur."
        actions={
          can("GERER_DEVIS") ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Nouveau devis
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <div className="px-3 sm:px-4 pt-3 flex flex-wrap gap-1.5" role="group" aria-label="Statut">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setStatut(c.value)}
              aria-pressed={statut === c.value}
              className={cn(
                "h-7 px-2.5 inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium border transition-colors",
                statut === c.value ? "bg-primary text-white border-primary" : "bg-surface text-muted border-line hover:text-ink hover:border-line-strong",
              )}
            >
              {c.label}
              <span className={cn("num text-[11px]", statut === c.value ? "text-white/80" : "text-muted")}>{c.count}</span>
            </button>
          ))}
        </div>
        <FilterBar shown={rows.length} total={state.devis.length} active={!!q || statut !== "EN_COURS"} onReset={() => { setQ(""); setStatut("EN_COURS"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="N°, client…" />
        </FilterBar>
        <DataTable
          emptyText={state.devis.length ? "Aucun devis pour ces filtres." : "Aucun devis."}
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Client" },
            { key: "t", label: "Type" },
            { key: "m", label: "Montant HT", className: "text-right" },
            { key: "v", label: "Valable jusqu’au" },
            { key: "s", label: "Statut" },
          ]}
          rows={rows.map((d) => ({
            n: <span className="num font-medium">{d.numero}</span>,
            c: d.client_nom ?? `Client n°${d.client}`,
            t: TYPE_COMMANDE_LABEL[d.type_commande] ?? d.type_commande,
            m: <span className="num">{formatDa(num(d.totaux?.ht ?? d.lignes.reduce((a, l) => a + num(l.quantite) * num(l.prix_unitaire), 0)))}</span>,
            v: formatDate(d.date_validite),
            s: <DevisBadge status={d.statut} />,
            href: `/commercial/devis/${d.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
      {creating && <NouveauDevisDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}

function dansJours(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Client (bloqués grisés), type de vente, validité ; ouvre le devis créé pour y ajouter les lignes. */
function NouveauDevisDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [client, setClient] = useState(0);
  const [type, setType] = useState<TypeCommande>("COMPTANT");
  const [validite, setValidite] = useState(dansJours(30));
  const [conditions, setConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const clients = [...state.clients].sort((a, b) => Number(a.bloque) - Number(b.bloque) || a.nom.localeCompare(b.nom, "fr"));
  const contrat = contratActif(state.contratsClients, client || null);
  const typeRefuse = type === "CONTRAT" && !!client && !contrat;

  async function submit() {
    setSaving(true);
    let cree: Devis | null = null;
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        cree = await api.post<Devis>(endpoints.devis, { client, type_commande: type, date_validite: validite, conditions: conditions.trim() });
      },
      refresh: ["devis"],
    });
    setSaving(false);
    if (ok && cree) router.push(`/commercial/devis/${(cree as Devis).id}`);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau devis"
      subtitle="Les lignes s’ajoutent ensuite sur la fiche du devis."
      icon={<FilePlus2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!client || !validite || typeRefuse || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer et ouvrir"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Client" hint="Un client bloqué ne peut pas recevoir de devis.">
        <Field label="Client">
          <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir un client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} disabled={c.bloque}>
                {c.code} · {c.nom}
                {c.bloque ? " — bloqué" : ""}
              </option>
            ))}
          </select>
        </Field>
      </DrawerSection>
      <DrawerSection title="Type de vente">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TYPE_COMMANDE_LABEL) as TypeCommande[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              aria-pressed={type === k}
              className={cn("h-10 rounded-[8px] border text-[13px] font-medium transition-colors", type === k ? "bg-primary text-white border-primary" : "border-line-strong bg-surface hover:bg-surface-2")}
            >
              {TYPE_COMMANDE_LABEL[k]}
            </button>
          ))}
        </div>
        {typeRefuse && <p className="text-[12px] text-danger">Ce client n’a pas de contrat en vigueur : devis au comptant uniquement.</p>}
      </DrawerSection>
      <DrawerSection title="Conditions">
        <Field label="Valable jusqu’au">
          <input type="date" className={inputClass} min={dansJours(0)} value={validite} onChange={(e) => setValidite(e.target.value)} />
        </Field>
        <Field label="Conditions / remarques">
          <textarea className={cn(inputClass, "h-20 py-2")} value={conditions} onChange={(e) => setConditions(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
