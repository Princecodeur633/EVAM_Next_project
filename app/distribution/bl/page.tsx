"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { BlBadge } from "@/components/badges";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function BlListPage() {
  const { role } = useStore();
  return role === "CHAUFFEUR" ? <HistoriqueChauffeur /> : <BlListe />;
}

/** Historique du chauffeur (mobile) : ses BL, regroupés par jour de tournée. */
function HistoriqueChauffeur() {
  const { state } = useStore();
  const date = (b: (typeof state.bonsLivraison)[number]) =>
    state.tournees.find((t) => t.id === b.tournee)?.date_tournee ?? b.date_generation.slice(0, 10);
  const parJour = new Map<string, typeof state.bonsLivraison>();
  [...state.bonsLivraison]
    .sort((a, b) => date(b).localeCompare(date(a)) || b.id - a.id)
    .forEach((b) => parJour.set(date(b), [...(parJour.get(date(b)) ?? []), b]));

  return (
    <div className="max-w-[640px] mx-auto space-y-4 anim-in">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-medium">Tournée</p>
        <h1 className="text-[22px] font-semibold tracking-tight">Historique</h1>
      </div>
      {parJour.size === 0 ? (
        <Panel className="px-5 py-12 text-center text-[14px] text-muted">Aucune livraison pour l’instant.</Panel>
      ) : (
        [...parJour.entries()].map(([jour, bls]) => (
          <section key={jour} className="space-y-2">
            <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted font-semibold">
              {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(jour))} · {bls.length} BL
            </h2>
            <ul className="evam-card divide-y divide-line overflow-hidden">
              {bls.map((b) => (
                <li key={b.id}>
                  <Link href={`/distribution/bl/${b.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 active:bg-primary-soft">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-semibold truncate">{b.client_nom ?? b.numero}</p>
                      <p className="text-[12px] text-muted num">
                        {b.numero}
                        {b.incident_livraison ? " · incident signalé" : ""}
                      </p>
                    </div>
                    {b.statut === "EN_LIVRAISON" && b.signature_client ? <StatusBadge tone="teal">Remis</StatusBadge> : <BlBadge status={b.statut} />}
                    <ChevronRight size={17} className="text-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function BlListe() {
  const { state, dispatch, can } = useStore();
  const router = useRouter();
  const [commande, setCommande] = useState(state.commandes[0]?.id ?? 0);
  const [tournee, setTournee] = useState(state.tournees[0]?.id ?? 0);
  const cmdNum = (id: number) => state.commandes.find((c) => c.id === id)?.numero ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Distribution" title="Bons de livraison" description="Confirmez la livraison et enregistrez la signature du client." />
      {can("CREATE_BL") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Commande">
            <select className={inputClass} value={commande} onChange={(e) => setCommande(Number(e.target.value))}>
              {state.commandes.map((c) => <option key={c.id} value={c.id}>{c.numero}</option>)}
            </select>
          </Field>
          <Field label="Tournée">
            <select className={inputClass} value={tournee} onChange={(e) => setTournee(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.tournees.map((t) => <option key={t.id} value={t.id}>{t.numero}</option>)}
            </select>
          </Field>
          <Button disabled={!commande} onClick={() => void dispatch({ type: "CREATE_BL", commande, tournee: tournee || undefined })}>Créer BL</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "c", label: "Commande" }, { key: "s", label: "Statut" }, { key: "sig", label: "Signature" }]}
          rows={state.bonsLivraison.map((b) => ({
            n: b.numero,
            c: cmdNum(b.commande),
            s: <BlBadge status={b.statut} />,
            sig: b.signature_client ? "Oui" : "Non",
            href: `/distribution/bl/${b.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
