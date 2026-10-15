"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileSignature, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { api, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ContratClient } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const aujourdhui = () => new Date().toISOString().slice(0, 10);
function dansJours(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

type Etat = "EN_VIGUEUR" | "A_VENIR" | "TERMINE";
const ETAT: Record<Etat, { label: string; tone: "success" | "info" | "neutral" }> = {
  EN_VIGUEUR: { label: "En vigueur", tone: "success" },
  A_VENIR: { label: "À venir", tone: "info" },
  TERMINE: { label: "Terminé", tone: "neutral" },
};
function etat(c: ContratClient): Etat {
  const j = aujourdhui();
  if (c.date_debut > j) return "A_VENIR";
  if (c.date_fin && c.date_fin < j) return "TERMINE";
  return "EN_VIGUEUR";
}

/**
 * Vue d'ensemble des contrats clients : une vente « Contrat » exige un contrat en vigueur ; ses
 * tarifs négociés priment sur le tarif du client et le tarif public. Les tarifs se gèrent sur la
 * fiche du client (clic sur une ligne).
 */
export default function ContratsPage() {
  const { state, can, clientName } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<Etat | "ECHEANCE" | "TOUS">("EN_VIGUEUR");
  const [creation, setCreation] = useState(false);

  const limite = dansJours(30);
  const echeanceProche = (c: ContratClient) => etat(c) === "EN_VIGUEUR" && !!c.date_fin && c.date_fin <= limite;
  const nbTarifs = (c: ContratClient) => state.tarifs.filter((t) => t.contrat === c.id).length;
  const tous = [...state.contratsClients].sort((a, b) => b.date_debut.localeCompare(a.date_debut));
  const rows = tous
    .filter((c) => (filtre === "TOUS" ? true : filtre === "ECHEANCE" ? echeanceProche(c) : etat(c) === filtre))
    .filter((c) => matchSearch(q, clientName(c.client), c.conditions));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Vente"
        title="Contrats clients"
        description="Un client sous contrat achète en vente « Contrat » : tarifs négociés prioritaires, facture émise automatiquement après la livraison. Ouvrez un contrat pour gérer ses tarifs sur la fiche du client."
        actions={
          can("GERER_CONTRATS_CLIENTS") ? (
            <Button onClick={() => setCreation(true)}>
              <Plus size={15} /> Nouveau contrat
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={tous.length} active={!!q || filtre !== "EN_VIGUEUR"} onReset={() => { setQ(""); setFiltre("EN_VIGUEUR"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Client, conditions…" />
          <Segmented
            label="Statut"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "EN_VIGUEUR", label: "En vigueur", count: tous.filter((c) => etat(c) === "EN_VIGUEUR").length },
              { value: "ECHEANCE", label: "Fin sous 30 jours", count: tous.filter(echeanceProche).length },
              { value: "A_VENIR", label: "À venir", count: tous.filter((c) => etat(c) === "A_VENIR").length },
              { value: "TERMINE", label: "Terminés", count: tous.filter((c) => etat(c) === "TERMINE").length },
              { value: "TOUS", label: "Tous" },
            ]}
          />
        </FilterBar>
        <DataTable
          emptyText={tous.length ? "Aucun contrat pour ces filtres." : "Aucun contrat : créez-en un pour vendre en « Contrat »."}
          columns={[
            { key: "c", label: "Client" },
            { key: "s", label: "Statut" },
            { key: "d", label: "Début" },
            { key: "f", label: "Fin" },
            { key: "t", label: "Tarifs négociés", className: "text-right" },
            { key: "k", label: "Conditions" },
          ]}
          rows={rows.map((c) => {
            const e = ETAT[etat(c)];
            return {
              href: `/parametrage/clients/${c.client}`,
              c: <span className="font-medium">{clientName(c.client)}</span>,
              s: (
                <span className="inline-flex flex-col gap-0.5">
                  <StatusBadge tone={e.tone}>{e.label}</StatusBadge>
                  {echeanceProche(c) && <span className="text-[11px] text-warning font-medium">Fin proche</span>}
                </span>
              ),
              d: formatDate(c.date_debut),
              f: c.date_fin ? <span className={cn(echeanceProche(c) && "text-warning font-medium")}>{formatDate(c.date_fin)}</span> : "Sans fin",
              t: <span className="num">{nbTarifs(c)}</span>,
              k: <span className="text-muted">{c.conditions || "—"}</span>,
            };
          })}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
      {creation && <NouveauContratDrawer onClose={() => setCreation(false)} />}
    </div>
  );
}

function NouveauContratDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [client, setClient] = useState(0);
  const [debut, setDebut] = useState(aujourdhui());
  const [fin, setFin] = useState("");
  const [conditions, setConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const clients = [...state.clients].sort((a, b) => Number(a.bloque) - Number(b.bloque) || a.nom.localeCompare(b.nom, "fr"));
  // Un seul contrat en vigueur par client à la fois : on prévient s'il en existe déjà un.
  const enVigueur = state.contratsClients.find((c) => c.client === client && etat(c) === "EN_VIGUEUR");

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () => api.post(endpoints.contratsClients, { client, date_debut: debut, date_fin: fin || null, conditions: conditions.trim() }),
      refresh: ["contratsClients"],
    });
    setSaving(false);
    if (ok) router.push(`/parametrage/clients/${client}`);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau contrat"
      subtitle="La fiche du client s’ouvre ensuite pour ajouter les tarifs négociés."
      icon={<FileSignature size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!client || !debut || (!!fin && fin < debut) || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer et ouvrir le client"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Client">
        <Field label="Client">
          <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir un client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.nom}
                {c.bloque ? " — bloqué" : ""}
              </option>
            ))}
          </select>
        </Field>
        {enVigueur && (
          <p className="text-[12px] text-warning">
            Ce client a déjà un contrat en vigueur (depuis le {formatDate(enVigueur.date_debut)}) : le plus récent sera appliqué.
          </p>
        )}
      </DrawerSection>
      <DrawerSection title="Durée et conditions">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début">
            <input type="date" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} />
          </Field>
          <Field label="Fin (facultatif)">
            <input type="date" className={inputClass} min={debut} value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
        </div>
        <Field label="Conditions particulières">
          <textarea className={cn(inputClass, "h-20 py-2")} value={conditions} onChange={(e) => setConditions(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
