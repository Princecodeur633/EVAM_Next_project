"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Lock, Plus, UserRound } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { TYPE_CLIENT_LABEL } from "@/lib/labels";
import { canReadParam } from "@/lib/roles";
import { statutTarif } from "@/lib/tarifs";
import { useStore } from "@/lib/store";
import type { Client, TypeClient } from "@/lib/types";
import { cn, formatDa, formatDate, num } from "@/lib/utils";

export default function ParamClientsPage() {
  return (
    <Suspense fallback={null}>
      <Clients />
    </Suspense>
  );
}

function Clients() {
  const { state, canEditParam, role } = useStore();
  const params = useSearchParams();
  const writable = canEditParam("/parametrage/clients");
  const [ouvert, setOuvert] = useState<number | "nouveau" | null>(Number(params.get("client")) || null);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("");
  const [fStatut, setFStatut] = useState<"TOUS" | "ACTIFS" | "BLOQUES">("TOUS");

  // Encours utilisé : factures non soldées (si le poste voit les factures).
  const encours = (id: number) =>
    state.factures.filter((f) => f.client === id && (f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE")).reduce((a, f) => a + num(f.montant_total), 0);
  const filtered = state.clients
    .filter((c) => matchSearch(q, c.code, c.nom, c.telephone, c.adresse) && (!fType || c.type_client === fType) && (fStatut === "TOUS" || (fStatut === "BLOQUES" ? c.bloque : !c.bloque)))
    .sort((a, b) => Number(b.bloque) - Number(a.bloque) || a.nom.localeCompare(b.nom, "fr"));
  const client = typeof ouvert === "number" ? state.clients.find((c) => c.id === ouvert) : undefined;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow={role === "COMMERCIAL" ? "Vente" : "Référentiel"}
        title="Clients"
        description="Particuliers, sociétés et clients sous contrat. Un client bloqué ne peut plus commander."
        actions={
          writable ? (
            <Button onClick={() => setOuvert("nouveau")}>
              <Plus size={15} /> Nouveau client
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar shown={filtered.length} total={state.clients.length} active={!!q || !!fType || fStatut !== "TOUS"} onReset={() => { setQ(""); setFType(""); setFStatut("TOUS"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Nom, code, téléphone…" />
          <Segmented
            label="Statut"
            value={fStatut}
            onChange={setFStatut}
            options={[
              { value: "TOUS", label: "Tous" },
              { value: "ACTIFS", label: "Actifs", count: state.clients.filter((c) => !c.bloque).length },
              { value: "BLOQUES", label: "Bloqués", count: state.clients.filter((c) => c.bloque).length },
            ]}
          />
          <FilterSelect label="Type" allLabel="Tous les types" value={fType} onChange={setFType} options={(Object.keys(TYPE_CLIENT_LABEL) as TypeClient[]).map((t) => ({ value: t, label: TYPE_CLIENT_LABEL[t] }))} />
        </FilterBar>
        <DataTable
          emptyText="Aucun client ne correspond à ces filtres."
          columns={[
            { key: "c", label: "Code" },
            { key: "n", label: "Nom" },
            { key: "t", label: "Type" },
            { key: "tel", label: "Téléphone" },
            { key: "e", label: "Encours", className: "text-right" },
            { key: "d", label: "Paiement" },
            { key: "b", label: "Statut" },
          ]}
          rows={filtered.map((c) => {
            const plafond = num(c.encours_autorise);
            const utilise = encours(c.id);
            return {
              c: <span className="num">{c.code}</span>,
              n: <span className="font-medium">{c.nom}</span>,
              t: TYPE_CLIENT_LABEL[c.type_client] ?? c.type_client,
              tel: c.telephone || "—",
              e: (
                <span className={cn("num", plafond > 0 && utilise > plafond && "text-danger font-semibold")}>
                  {state.factures.length ? `${formatDa(utilise)} / ` : ""}
                  {formatDa(plafond)}
                </span>
              ),
              d: c.delai_paiement_jours ? `${c.delai_paiement_jours} j` : "Comptant",
              b: c.bloque ? <StatusBadge tone="danger">Bloqué</StatusBadge> : <StatusBadge tone="success">Actif</StatusBadge>,
              id: String(c.id),
            };
          })}
          onRowClick={(row) => setOuvert(Number(row.id))}
        />
      </Panel>
      {ouvert === "nouveau" && <ClientDrawer onClose={() => setOuvert(null)} />}
      {client && <ClientDrawer key={client.id} client={client} onClose={() => setOuvert(null)} />}
    </div>
  );
}

/** Fiche client en tiroir : identité, conditions (dont « Compte bloqué »), tarifs spécifiques en bas. */
function ClientDrawer({ client, onClose }: { client?: Client; onClose: () => void }) {
  const { state, dispatch, canEditParam, articleName, role } = useStore();
  const writable = canEditParam("/parametrage/clients");
  const voitTarifs = canReadParam(role, "/parametrage/tarifs");
  const [f, setF] = useState({
    nom: client?.nom ?? "",
    type_client: (client?.type_client ?? "SOCIETE") as TypeClient,
    telephone: client?.telephone ?? "",
    adresse: client?.adresse ?? "",
    encours: client ? String(num(client.encours_autorise)) : "0",
    delai: client ? String(client.delai_paiement_jours ?? 0) : "0",
    bloque: client?.bloque ?? false,
  });
  const [saving, setSaving] = useState(false);
  const tarifs = client ? state.tarifs.filter((t) => t.client === client.id).sort((a, b) => articleName(a.article).localeCompare(articleName(b.article), "fr")) : [];
  const dirty =
    !client ||
    f.nom !== client.nom ||
    f.type_client !== client.type_client ||
    f.telephone !== (client.telephone ?? "") ||
    f.adresse !== (client.adresse ?? "") ||
    Number(f.encours) !== num(client.encours_autorise) ||
    Number(f.delai) !== (client.delai_paiement_jours ?? 0) ||
    f.bloque !== client.bloque;

  async function submit() {
    setSaving(true);
    const commun = { nom: f.nom.trim(), type_client: f.type_client, telephone: f.telephone, adresse: f.adresse, encours_autorise: Number(f.encours) || 0, delai_paiement_jours: Number(f.delai) || 0 };
    const ok = client ? await dispatch({ type: "PATCH_CLIENT", id: client.id, ...commun, bloque: f.bloque }) : await dispatch({ type: "CREATE_CLIENT", ...commun });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={client ? client.nom : "Nouveau client"}
      subtitle={client ? <span className="num">{client.code}</span> : "Le code client est généré automatiquement."}
      icon={<UserRound size={17} />}
      footer={
        writable ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button disabled={!f.nom.trim() || !dirty || saving} onClick={() => void submit()}>
              {saving ? "Enregistrement…" : client ? "Enregistrer" : "Créer le client"}
            </Button>
          </>
        ) : undefined
      }
    >
      <DrawerSection title="Identité">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nom / raison sociale">
            <input className={inputClass} disabled={!writable} value={f.nom} onChange={(e) => setF((x) => ({ ...x, nom: e.target.value }))} autoFocus={!client} />
          </Field>
          <Field label="Type">
            <select className={inputClass} disabled={!writable} value={f.type_client} onChange={(e) => setF((x) => ({ ...x, type_client: e.target.value as TypeClient }))}>
              {(Object.keys(TYPE_CLIENT_LABEL) as TypeClient[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_CLIENT_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} disabled={!writable} value={f.telephone} onChange={(e) => setF((x) => ({ ...x, telephone: e.target.value }))} />
          </Field>
          <Field label="Adresse">
            <input className={inputClass} disabled={!writable} value={f.adresse} onChange={(e) => setF((x) => ({ ...x, adresse: e.target.value }))} />
          </Field>
        </div>
      </DrawerSection>

      <DrawerSection title="Conditions commerciales">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Encours autorisé">
            <input type="number" min="0" className={cn(inputClass, "num text-right")} disabled={!writable} value={f.encours} onChange={(e) => setF((x) => ({ ...x, encours: e.target.value }))} />
          </Field>
          <Field label="Délai de paiement (jours, 0 = comptant)">
            <input type="number" min="0" className={cn(inputClass, "num text-right")} disabled={!writable} value={f.delai} onChange={(e) => setF((x) => ({ ...x, delai: e.target.value }))} />
          </Field>
        </div>
        {client && (
          <label
            className={cn(
              "flex items-center justify-between gap-3 rounded-[9px] border px-3.5 py-3",
              f.bloque ? "border-danger/30 bg-danger-soft/50" : "border-line",
              writable && "cursor-pointer",
            )}
          >
            <span className="flex items-start gap-2.5">
              <Lock size={15} className={cn("mt-0.5", f.bloque ? "text-danger" : "text-muted")} />
              <span>
                <span className="block text-[13px] font-medium">Compte bloqué</span>
                <span className="block text-[11.5px] text-muted">Un client bloqué ne peut plus passer de commande.</span>
              </span>
            </span>
            <input type="checkbox" className="h-4 w-4 accent-[var(--danger)]" disabled={!writable} checked={f.bloque} onChange={(e) => setF((x) => ({ ...x, bloque: e.target.checked }))} />
          </label>
        )}
      </DrawerSection>

      {client && voitTarifs && (
        <DrawerSection title="Tarifs spécifiques du client" hint="Prioritaires sur le tarif public tant qu’ils sont en vigueur.">
          <div className="rounded-[9px] border border-line overflow-hidden">
            <DataTable
              emptyText="Aucun tarif spécifique : le tarif public s’applique."
              columns={[
                { key: "a", label: "Article" },
                { key: "p", label: "Prix", className: "text-right" },
                { key: "v", label: "Validité" },
                { key: "s", label: "Statut" },
              ]}
              rows={tarifs.map((t) => {
                const st = statutTarif(t);
                return {
                  a: articleName(t.article),
                  p: <span className="num">{formatDa(num(t.prix_unitaire))}</span>,
                  v: `${formatDate(t.date_debut_validite)} → ${t.date_fin_validite ? formatDate(t.date_fin_validite) : "…"}`,
                  s: <StatusBadge tone={st.tone}>{st.label}</StatusBadge>,
                };
              })}
            />
          </div>
        </DrawerSection>
      )}
    </Drawer>
  );
}
