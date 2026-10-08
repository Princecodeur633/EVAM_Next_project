"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { FilePlus2, Plus } from "lucide-react";
import { OrderBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_CMD_LABEL, TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { contratActif } from "@/lib/tarifs";
import type { StatutCommande, TypeCommande } from "@/lib/types";
import { cn, formatDa, formatDateTime, num } from "@/lib/utils";

const STATUTS: StatutCommande[] = ["BROUILLON", "VALIDEE", "EN_PREPARATION", "LIVREE", "FACTUREE", "ANNULEE"];

export default function CommandesPage() {
  return (
    <Suspense fallback={null}>
      <Commandes />
    </Suspense>
  );
}

function Commandes() {
  const { state, clientName, can } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [creating, setCreating] = useState(params.get("nouvelle") === "1" && can("CREATE_COMMANDE"));
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<StatutCommande | "EN_COURS" | "TOUTES">("EN_COURS");

  const total = (id: number) => state.lignesCommande.filter((l) => l.commande === id).reduce((a, l) => a + num(l.quantite) * num(l.prix_unitaire), 0);
  const enCours = (s: StatutCommande) => s !== "FACTUREE" && s !== "ANNULEE";
  const rows = state.commandes
    .filter((c) => (statut === "TOUTES" ? true : statut === "EN_COURS" ? enCours(c.statut) : c.statut === statut))
    .filter((c) => matchSearch(q, c.numero, clientName(c.client)))
    .sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime());

  const chips = [
    { value: "EN_COURS" as const, label: "En cours", count: state.commandes.filter((c) => enCours(c.statut)).length },
    ...STATUTS.map((s) => ({ value: s, label: STATUT_CMD_LABEL[s], count: state.commandes.filter((c) => c.statut === s).length })).filter((c) => c.count > 0),
    { value: "TOUTES" as const, label: "Toutes", count: state.commandes.length },
  ];

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Vente"
        title="Commandes clients"
        description="De la saisie à la facturation : créez la commande, ajoutez les lignes, validez, puis facturez."
        actions={
          can("CREATE_COMMANDE") ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Nouvelle commande
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
        <FilterBar shown={rows.length} total={state.commandes.length} active={!!q || statut !== "EN_COURS"} onReset={() => { setQ(""); setStatut("EN_COURS"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="N°, client…" />
        </FilterBar>
        <DataTable
          emptyText={state.commandes.length ? "Aucune commande pour ces filtres." : "Aucune commande."}
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Client" },
            { key: "t", label: "Type" },
            { key: "m", label: "Montant", className: "text-right" },
            { key: "s", label: "Statut" },
            { key: "d", label: "Date" },
          ]}
          rows={rows.map((c) => ({
            n: <span className="num font-medium">{c.numero}</span>,
            c: clientName(c.client),
            t: TYPE_COMMANDE_LABEL[c.type_commande] ?? c.type_commande,
            m: <span className="num">{formatDa(total(c.id))}</span>,
            s: <OrderBadge status={c.statut} />,
            d: formatDateTime(c.date_commande),
            href: `/commercial/commandes/${c.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
      {creating && <NouvelleCommandeDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}

/** Client (bloqués grisés) + type ; ouvre directement la fiche de la commande créée. */
function NouvelleCommandeDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [client, setClient] = useState(0);
  const [type, setType] = useState<TypeCommande>("COMPTANT");
  const [saving, setSaving] = useState(false);
  const clients = [...state.clients].sort((a, b) => Number(a.bloque) - Number(b.bloque) || a.nom.localeCompare(b.nom, "fr"));
  // Vente « contrat » : refusée par le backend sans contrat en vigueur pour ce client.
  const contrat = contratActif(state.contratsClients, client || null);
  const typeRefuse = type === "CONTRAT" && !!client && !contrat;

  // Après création, on ouvre la nouvelle commande dès qu’elle apparaît dans la liste rechargée.
  const attente = useRef<{ client: number; maxId: number } | null>(null);
  useEffect(() => {
    const a = attente.current;
    if (!a) return;
    const nouvelle = state.commandes.filter((c) => c.client === a.client && c.id > a.maxId).sort((x, y) => y.id - x.id)[0];
    if (nouvelle) {
      attente.current = null;
      router.push(`/commercial/commandes/${nouvelle.id}`);
    }
  }, [state.commandes, router]);

  async function submit() {
    setSaving(true);
    attente.current = { client, maxId: Math.max(0, ...state.commandes.map((c) => c.id)) };
    const ok = await dispatch({ type: "CREATE_COMMANDE", client, type_commande: type });
    setSaving(false);
    if (!ok) attente.current = null;
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouvelle commande"
      subtitle="Les lignes s’ajoutent ensuite sur la fiche de la commande."
      icon={<FilePlus2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!client || typeRefuse || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer et ouvrir"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Client" hint="Un client bloqué ne peut plus commander.">
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
      <DrawerSection title="Type de commande">
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
        {client > 0 && (
          <p className={cn("text-[12px]", typeRefuse ? "text-danger" : "text-muted")}>
            {contrat
              ? `Contrat en vigueur depuis le ${contrat.date_debut} : tarifs du contrat appliqués, facture émise après la livraison.`
              : typeRefuse
                ? "Ce client n’a pas de contrat en vigueur : vente au comptant uniquement."
                : "Vente au comptant : tarif imposé, facture à encaisser en caisse."}
          </p>
        )}
      </DrawerSection>
    </Drawer>
  );
}
