"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CheckCircle2, ChevronRight, ClipboardList, FilePlus2, PackageOpen, Play, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BlBadge, PaiementBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_PREP_LABEL, TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Commande } from "@/lib/types";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

type Etape = "commandes" | "preparations" | "bl" | "livrees";
const ETAPES: Etape[] = ["commandes", "preparations", "bl", "livrees"];

export default function CircuitPage() {
  return (
    <Suspense fallback={null}>
      <Circuit />
    </Suspense>
  );
}

function Circuit() {
  const { state, dispatch, clientName, can } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [creerBl, setCreerBl] = useState<Commande | null>(null);

  const cmd = (id: number) => state.commandes.find((c) => c.id === id);
  const facture = (commande: number) => state.factures.find((f) => f.commande === commande);
  const avecPrep = new Set(state.preparations.map((p) => p.commande));
  const avecBl = new Set(state.bonsLivraison.map((b) => b.commande));

  const aServir = state.commandes.filter((c) => c.statut === "VALIDEE" && !avecPrep.has(c.id));
  const preps = state.preparations.filter((p) => p.statut !== "SORTIE_MAGASIN");
  const blACreer = state.preparations.filter((p) => p.statut === "SORTIE_MAGASIN" && !avecBl.has(p.commande));
  const enLivraison = state.bonsLivraison.filter((b) => b.statut === "EN_LIVRAISON");
  const livrees = state.bonsLivraison.filter((b) => b.statut !== "EN_LIVRAISON");

  const frise: { id: Etape; label: string; count: number; hint: string; icon: LucideIcon }[] = [
    { id: "commandes", label: "Commandes à servir", count: aServir.length, hint: "à lancer", icon: ClipboardList },
    { id: "preparations", label: "Préparations", count: preps.length, hint: "au magasin", icon: PackageOpen },
    { id: "bl", label: "Bons de livraison", count: blACreer.length + enLivraison.length, hint: "à créer ou en route", icon: Truck },
    { id: "livrees", label: "Livrées", count: livrees.length, hint: "terminées", icon: CheckCircle2 },
  ];
  const param = params.get("etape") as Etape | null;
  const etape: Etape = param && ETAPES.includes(param) ? param : (frise.slice(0, 3).find((f) => f.count > 0)?.id ?? "commandes");
  const go = (e: Etape) => {
    setQ("");
    router.replace(`/distribution?etape=${e}`, { scroll: false });
  };
  const m = (commande: number, ...autres: unknown[]) => {
    const c = cmd(commande);
    return matchSearch(q, c?.numero, c ? clientName(c.client) : "", ...autres);
  };

  async function lancer(commande: number) {
    setBusy(commande);
    await dispatch({ type: "CREATE_PREP", commande });
    setBusy(null);
  }

  const cmdCell = (id: number) => {
    const c = cmd(id);
    return (
      <Link href={`/commercial/commandes/${id}`} onClick={(e) => e.stopPropagation()} className="num font-medium text-primary hover:underline">
        {c?.numero ?? `Commande n°${id}`}
      </Link>
    );
  };

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Logistique" title="Circuit de livraison" description="Commande validée → préparation au magasin → bon de livraison → livraison confirmée." />

      <nav aria-label="Étapes du circuit" className="evam-card p-2 overflow-x-auto">
        <ol className="flex items-stretch min-w-max sm:min-w-0">
          {frise.map((f, i) => {
            const actif = f.id === etape;
            const Icon = f.icon;
            return (
              <li key={f.id} className="flex items-center flex-1 min-w-[170px]">
                <button
                  type="button"
                  onClick={() => go(f.id)}
                  aria-current={actif ? "step" : undefined}
                  className={cn("flex-1 flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left transition-colors", actif ? "bg-primary text-white shadow-sm" : "hover:bg-surface-2")}
                >
                  <span className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", actif ? "bg-white/15" : "bg-surface-2 text-muted")}>
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold">{f.label}</span>
                      <span className={cn("num text-[11px] font-semibold px-1.5 rounded-full", actif ? "bg-white text-primary" : f.count && f.id !== "livrees" ? "bg-warning-soft text-warning" : "bg-surface-2 text-muted")}>
                        {f.count}
                      </span>
                    </span>
                    <span className={cn("block text-[11px]", actif ? "text-white/75" : "text-muted")}>{f.hint}</span>
                  </span>
                </button>
                {i < frise.length - 1 && <ChevronRight size={16} className="text-line-strong shrink-0 mx-0.5" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>

      <Panel className="overflow-hidden">
        <FilterBar
          shown={
            etape === "commandes"
              ? aServir.filter((c) => m(c.id)).length
              : etape === "preparations"
                ? preps.filter((p) => m(p.commande)).length
                : etape === "bl"
                  ? blACreer.filter((p) => m(p.commande)).length + enLivraison.filter((b) => m(b.commande, b.numero)).length
                  : livrees.filter((b) => m(b.commande, b.numero)).length
          }
          total={frise.find((f) => f.id === etape)!.count}
          active={!!q}
          onReset={() => setQ("")}
        >
          <SearchInput value={q} onChange={setQ} placeholder="Commande, client, BL…" />
        </FilterBar>

        {etape === "commandes" && (
          <DataTable
            emptyText="Toutes les commandes validées sont lancées."
            columns={[
              { key: "c", label: "Commande" },
              { key: "cl", label: "Client" },
              { key: "t", label: "Type" },
              { key: "d", label: "Date" },
              { key: "p", label: "Paiement" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={aServir
              .filter((c) => m(c.id))
              .map((c) => ({
                c: cmdCell(c.id),
                cl: clientName(c.client),
                t: TYPE_COMMANDE_LABEL[c.type_commande],
                d: formatDate(c.date_commande),
                p: <PaiementBadge facture={facture(c.id)} />,
                x: can("CREATE_PREP") ? (
                  <Button className="h-8 px-3 text-[12.5px]" disabled={busy !== null} onClick={() => void lancer(c.id)}>
                    <Play size={13} /> {busy === c.id ? "Lancement…" : "Lancer la préparation"}
                  </Button>
                ) : (
                  ""
                ),
              }))}
          />
        )}

        {etape === "preparations" && (
          <DataTable
            emptyText="Aucune préparation en cours au magasin."
            columns={[
              { key: "c", label: "Commande" },
              { key: "cl", label: "Client" },
              { key: "s", label: "Statut" },
              { key: "l", label: "Lancée le" },
            ]}
            rows={preps
              .filter((p) => m(p.commande))
              .map((p) => ({
                c: cmdCell(p.commande),
                cl: clientName(cmd(p.commande)?.client),
                s: <StatusBadge tone={p.statut === "EN_PREPARATION" ? "warning" : p.statut === "PRETE" ? "teal" : "info"}>{STATUT_PREP_LABEL[p.statut]}</StatusBadge>,
                l: formatDateTime(p.date_lancement),
                href: `/distribution/preparations/${p.id}`,
              }))}
            onRowClick={(row) => router.push(String(row.href))}
          />
        )}

        {etape === "bl" && (
          <DataTable
            emptyText="Aucun bon de livraison à créer ni en route."
            columns={[
              { key: "n", label: "BL" },
              { key: "c", label: "Commande" },
              { key: "cl", label: "Client" },
              { key: "t", label: "Tournée" },
              { key: "p", label: "Paiement" },
              { key: "s", label: "Statut" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={[
              ...blACreer
                .filter((p) => m(p.commande))
                .map((p) => ({
                  n: <span className="text-muted">À créer</span>,
                  c: cmdCell(p.commande),
                  cl: clientName(cmd(p.commande)?.client),
                  t: "—",
                  p: <PaiementBadge facture={facture(p.commande)} />,
                  s: <StatusBadge tone="teal">Sortie magasin</StatusBadge>,
                  x: can("CREATE_BL") ? (
                    <Button className="h-8 px-3 text-[12.5px]" onClick={() => setCreerBl(cmd(p.commande) ?? null)}>
                      <FilePlus2 size={13} /> Créer le BL
                    </Button>
                  ) : (
                    ""
                  ),
                })),
              ...enLivraison
                .filter((b) => m(b.commande, b.numero))
                .map((b) => ({
                  n: <span className="num font-medium">{b.numero}</span>,
                  c: cmdCell(b.commande),
                  cl: clientName(cmd(b.commande)?.client),
                  t: state.tournees.find((t) => t.id === b.tournee)?.numero ?? <span className="text-warning">Non affecté</span>,
                  p: <PaiementBadge facture={facture(b.commande)} />,
                  s: <BlBadge status={b.statut} />,
                  x: b.incident_livraison ? <StatusBadge tone="warning">Incident</StatusBadge> : "",
                  href: `/distribution/bl/${b.id}`,
                })),
            ]}
            onRowClick={(row) => row.href && router.push(String(row.href))}
          />
        )}

        {etape === "livrees" && (
          <DataTable
            emptyText="Aucune livraison terminée."
            columns={[
              { key: "n", label: "BL" },
              { key: "c", label: "Commande" },
              { key: "cl", label: "Client" },
              { key: "s", label: "Statut" },
              { key: "d", label: "Livré le" },
            ]}
            rows={livrees
              .filter((b) => m(b.commande, b.numero))
              .sort((a, b) => new Date(b.date_livraison ?? b.date_generation).getTime() - new Date(a.date_livraison ?? a.date_generation).getTime())
              .map((b) => ({
                n: <span className="num font-medium">{b.numero}</span>,
                c: cmdCell(b.commande),
                cl: clientName(cmd(b.commande)?.client),
                s: <BlBadge status={b.statut} />,
                d: b.date_livraison ? formatDateTime(b.date_livraison) : "—",
                href: `/distribution/bl/${b.id}`,
              }))}
            onRowClick={(row) => router.push(String(row.href))}
          />
        )}
      </Panel>

      {creerBl && <CreerBlDrawer commande={creerBl} onClose={() => setCreerBl(null)} />}
    </div>
  );
}

function CreerBlDrawer({ commande, onClose }: { commande: Commande; onClose: () => void }) {
  const { state, dispatch, clientName, userName } = useStore();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const tournees = state.tournees.filter((t) => t.date_tournee >= aujourdhui).sort((a, b) => a.date_tournee.localeCompare(b.date_tournee));
  const [tournee, setTournee] = useState(tournees[0]?.id ?? 0);
  const [saving, setSaving] = useState(false);
  const chauffeur = (id: number) => userName(state.chauffeurs.find((c) => c.id === id)?.utilisateur);
  const vehicule = (id: number) => state.vehicules.find((v) => v.id === id)?.immatriculation ?? "—";

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_BL", commande: commande.id, tournee: tournee || undefined });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Créer le bon de livraison"
      subtitle={`${commande.numero} · ${clientName(commande.client)}`}
      icon={<FilePlus2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le BL"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Tournée" hint="Le chauffeur de la tournée verra ce BL. Tournées d’aujourd’hui et à venir.">
        <Field label="Tournée">
          <select className={inputClass} value={tournee} onChange={(e) => setTournee(Number(e.target.value))}>
            <option value={0}>— Affecter plus tard —</option>
            {tournees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.numero} · {formatDate(t.date_tournee)} · {chauffeur(t.chauffeur)} · {vehicule(t.vehicule)}
              </option>
            ))}
          </select>
        </Field>
        {tournees.length === 0 && (
          <p className="text-[12px] text-muted">
            Aucune tournée prévue : <Link href="/distribution/tournees" className="text-primary font-medium hover:underline">créez-en une</Link>.
          </p>
        )}
      </DrawerSection>
    </Drawer>
  );
}
