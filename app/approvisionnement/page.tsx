"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Check, ChevronRight, FilePlus2, FileText, ListTodo, PackageCheck, Plus, Send, ShoppingCart, Truck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CF_TONE, CommandeFournisseurDrawer, NouvelleDaDrawer, ReceptionDrawer } from "@/components/achats";
import { DaBadge } from "@/components/badges";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { ORIGINE_BESOIN_LABEL, STATUT_CF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { CommandeFournisseur, DemandeAchat } from "@/lib/types";
import { cn, formatDa, formatDate, formatQty, num } from "@/lib/utils";

type Etape = "besoins" | "demandes" | "commandes" | "receptions";
const ETAPES: Etape[] = ["besoins", "demandes", "commandes", "receptions"];

export default function ApprovisionnementPage() {
  return (
    <Suspense fallback={null}>
      <Approvisionnement />
    </Suspense>
  );
}

function Approvisionnement() {
  const { state, dispatch, articleName, fournisseurName, userName, can } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [aTraiter, setATraiter] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [nouvelleDa, setNouvelleDa] = useState(false);
  const [cfOuverte, setCfOuverte] = useState<{ cf?: CommandeFournisseur; da?: DemandeAchat } | null>(null);
  const [reception, setReception] = useState<CommandeFournisseur | null>(null);

  const besoins = state.besoinsAchat.filter((b) => !b.satisfait);
  const daAttente = state.demandesAchat.filter((d) => d.statut === "EN_ATTENTE");
  const daApprouvees = state.demandesAchat.filter((d) => d.statut === "APPROUVEE");
  const cfBrouillon = state.commandesFournisseur.filter((c) => c.statut === "BROUILLON");
  const attendues = state.commandesFournisseur.filter((c) => c.statut === "ENVOYEE" || c.statut === "PARTIELLEMENT_RECUE");

  const frise: { id: Etape; label: string; count: number; hint: string; icon: LucideIcon }[] = [
    { id: "besoins", label: "Besoins", count: besoins.length, hint: "à couvrir", icon: ListTodo },
    { id: "demandes", label: "Demandes", count: daAttente.length + daApprouvees.length, hint: "à traiter", icon: FileText },
    { id: "commandes", label: "Commandes", count: cfBrouillon.length, hint: "à envoyer", icon: ShoppingCart },
    { id: "receptions", label: "Réceptions", count: attendues.length, hint: "attendues", icon: Truck },
  ];
  const param = params.get("etape") as Etape | null;
  const etape: Etape = param && ETAPES.includes(param) ? param : (frise.find((f) => f.count > 0)?.id ?? "besoins");
  const go = (e: Etape) => {
    setQ("");
    setATraiter(true);
    router.replace(`/approvisionnement?etape=${e}`, { scroll: false });
  };

  async function run(key: string, action: Parameters<typeof dispatch>[0]) {
    setBusy(key);
    await dispatch(action);
    setBusy(null);
  }

  const lignesCf = (id: number) => state.lignesCommandeFournisseur.filter((l) => l.commande === id);
  const totalCf = (id: number) => lignesCf(id).reduce((a, l) => a + num(l.quantite_commandee) * num(l.prix_unitaire), 0);

  const listeBesoins = (aTraiter ? besoins : state.besoinsAchat)
    .filter((b) => matchSearch(q, articleName(b.article)))
    .sort((a, b) => Number(a.satisfait) - Number(b.satisfait) || new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
  const listeDa = (aTraiter ? [...daAttente, ...daApprouvees] : state.demandesAchat)
    .filter((d) => matchSearch(q, articleName(d.article), d.motif, `${d.id}`))
    .sort((a, b) => ["EN_ATTENTE", "APPROUVEE"].indexOf(b.statut) - ["EN_ATTENTE", "APPROUVEE"].indexOf(a.statut) || b.id - a.id);
  const listeCf = (aTraiter ? cfBrouillon : state.commandesFournisseur)
    .filter((c) => matchSearch(q, c.numero, fournisseurName(c.fournisseur)))
    .sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime());
  const listeRec = attendues.filter((c) => matchSearch(q, c.numero, fournisseurName(c.fournisseur)));

  const actionEntete =
    etape === "demandes" && can("CREATE_DA") ? (
      <Button onClick={() => setNouvelleDa(true)}>
        <FilePlus2 size={15} /> Nouvelle demande
      </Button>
    ) : etape === "commandes" && can("CREATE_CF") ? (
      <Button onClick={() => setCfOuverte({})}>
        <Plus size={15} /> Nouvelle commande
      </Button>
    ) : null;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Achats"
        title="Approvisionnement"
        description="Du besoin à la réception : couvrez les besoins, traitez les demandes, envoyez les commandes et suivez les livraisons."
        actions={actionEntete}
      />

      {/* Frise de flux : chaque pastille est un onglet */}
      <nav aria-label="Étapes de l’approvisionnement" className="evam-card p-2 overflow-x-auto">
        <ol className="flex items-stretch min-w-max sm:min-w-0">
          {frise.map((f, i) => {
            const actif = f.id === etape;
            const Icon = f.icon;
            return (
              <li key={f.id} className="flex items-center flex-1 min-w-[150px]">
                <button
                  type="button"
                  onClick={() => go(f.id)}
                  aria-current={actif ? "step" : undefined}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left transition-colors",
                    actif ? "bg-primary text-white shadow-sm" : "hover:bg-surface-2",
                  )}
                >
                  <span className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", actif ? "bg-white/15" : "bg-surface-2 text-muted")}>
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold">{f.label}</span>
                      <span
                        className={cn(
                          "num text-[11px] font-semibold px-1.5 rounded-full",
                          actif ? "bg-white text-primary" : f.count ? "bg-warning-soft text-warning" : "bg-surface-2 text-muted",
                        )}
                      >
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
          shown={etape === "besoins" ? listeBesoins.length : etape === "demandes" ? listeDa.length : etape === "commandes" ? listeCf.length : listeRec.length}
          total={etape === "besoins" ? state.besoinsAchat.length : etape === "demandes" ? state.demandesAchat.length : etape === "commandes" ? state.commandesFournisseur.length : attendues.length}
          active={!!q || !aTraiter}
          onReset={() => {
            setQ("");
            setATraiter(true);
          }}
        >
          <SearchInput value={q} onChange={setQ} placeholder={etape === "besoins" || etape === "demandes" ? "Article, motif…" : "N° de commande, fournisseur…"} />
          {etape !== "receptions" && (
            <Segmented
              label="Vue"
              value={aTraiter ? "A" : "T"}
              onChange={(v) => setATraiter(v === "A")}
              options={[
                { value: "A", label: "À traiter" },
                { value: "T", label: "Tout" },
              ]}
            />
          )}
        </FilterBar>

        {etape === "besoins" && (
          <DataTable
            emptyText="Tous les besoins sont couverts."
            columns={[
              { key: "a", label: "Article" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "o", label: "Origine" },
              { key: "d", label: "Depuis le" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={listeBesoins.map((b) => ({
              a: articleName(b.article),
              q: <span className="num">{formatQty(num(b.quantite_besoin), 2)}</span>,
              o: <StatusBadge tone={b.origine === "AUTO_PRODUCTION" ? "info" : "neutral"}>{ORIGINE_BESOIN_LABEL[b.origine] ?? b.origine}</StatusBadge>,
              d: formatDate(b.date_creation),
              x: b.satisfait ? (
                <StatusBadge tone="success">Couvert</StatusBadge>
              ) : can("CREER_DA_DEPUIS_BESOIN") ? (
                <Button className="h-8 px-3 text-[12.5px]" disabled={busy !== null} onClick={() => void run(`b${b.id}`, { type: "CREER_DA_DEPUIS_BESOIN", id: b.id })}>
                  <FilePlus2 size={14} /> Créer la DA
                </Button>
              ) : (
                ""
              ),
            }))}
          />
        )}

        {etape === "demandes" && (
          <DataTable
            emptyText="Aucune demande à traiter."
            columns={[
              { key: "n", label: "N°" },
              { key: "a", label: "Article" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "m", label: "Motif" },
              { key: "u", label: "Demandeur" },
              { key: "s", label: "Statut" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={listeDa.map((d) => ({
              n: <span className="num">{d.id}</span>,
              a: articleName(d.article),
              q: <span className="num">{formatQty(num(d.quantite_demandee), 2)}</span>,
              m: <span className="text-muted">{d.motif || (d.besoin ? "Besoin calculé" : "—")}</span>,
              u: userName(d.demandeur),
              s: <DaBadge status={d.statut} />,
              x:
                d.statut === "EN_ATTENTE" && can("APPROUVER_DA") ? (
                  <span className="flex gap-1.5 justify-end">
                    {can("REJETER_DA") && (
                      <Button variant="secondary" className="h-8 px-2.5 text-[12px] text-danger" disabled={busy !== null} onClick={() => void run(`r${d.id}`, { type: "REJETER_DA", id: d.id })}>
                        <X size={13} /> Rejeter
                      </Button>
                    )}
                    <Button variant="success" className="h-8 px-2.5 text-[12px]" disabled={busy !== null} onClick={() => void run(`a${d.id}`, { type: "APPROUVER_DA", id: d.id })}>
                      <Check size={13} /> Approuver
                    </Button>
                  </span>
                ) : d.statut === "APPROUVEE" && can("CREATE_CF") ? (
                  <Button className="h-8 px-3 text-[12.5px]" onClick={() => setCfOuverte({ da: d })}>
                    <ShoppingCart size={14} /> Créer la commande
                  </Button>
                ) : (
                  ""
                ),
            }))}
          />
        )}

        {etape === "commandes" && (
          <DataTable
            emptyText="Aucune commande à envoyer."
            columns={[
              { key: "n", label: "N°" },
              { key: "f", label: "Fournisseur" },
              { key: "l", label: "Lignes" },
              { key: "t", label: "Total", className: "text-right" },
              { key: "s", label: "Statut" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={listeCf.map((c) => {
              const lignes = lignesCf(c.id);
              return {
                n: <span className="num font-medium">{c.numero}</span>,
                f: fournisseurName(c.fournisseur),
                l: <span className="text-muted">{lignes.length ? `${lignes.length} article${lignes.length > 1 ? "s" : ""}` : "Aucune ligne"}</span>,
                t: <span className="num">{formatDa(totalCf(c.id))}</span>,
                s: <StatusBadge tone={CF_TONE[c.statut]}>{STATUT_CF_LABEL[c.statut]}</StatusBadge>,
                x:
                  c.statut === "BROUILLON" && can("ENVOYER_CF") ? (
                    <Button
                      className="h-8 px-3 text-[12.5px]"
                      disabled={busy !== null || lignes.length === 0}
                      title={lignes.length === 0 ? "Ajoutez au moins une ligne" : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        void run(`e${c.id}`, { type: "ENVOYER_CF", id: c.id });
                      }}
                    >
                      <Send size={13} /> Envoyer
                    </Button>
                  ) : (
                    ""
                  ),
                id: String(c.id),
              };
            })}
            onRowClick={(row) => setCfOuverte({ cf: state.commandesFournisseur.find((c) => String(c.id) === row.id) })}
          />
        )}

        {etape === "receptions" && (
          <DataTable
            emptyText="Aucune livraison attendue."
            columns={[
              { key: "n", label: "Commande" },
              { key: "f", label: "Fournisseur" },
              { key: "d", label: "Commandée le" },
              { key: "r", label: "Avancement", className: "text-right" },
              { key: "s", label: "Statut" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={listeRec.map((c) => {
              const lignes = lignesCf(c.id);
              const commande = lignes.reduce((a, l) => a + num(l.quantite_commandee), 0);
              const recu = lignes.reduce((a, l) => a + num(l.quantite_recue), 0);
              return {
                n: <span className="num font-medium">{c.numero}</span>,
                f: fournisseurName(c.fournisseur),
                d: formatDate(c.date_commande),
                r: <span className="num">{commande ? `${Math.round((recu / commande) * 100)} %` : "—"}</span>,
                s: <StatusBadge tone={CF_TONE[c.statut]}>{STATUT_CF_LABEL[c.statut]}</StatusBadge>,
                x: can("CREATE_RECEPTION") ? (
                  <Button variant="secondary" className="h-8 px-3 text-[12.5px]" onClick={() => setReception(c)}>
                    <PackageCheck size={14} /> Réceptionner
                  </Button>
                ) : (
                  ""
                ),
              };
            })}
          />
        )}
      </Panel>

      {nouvelleDa && <NouvelleDaDrawer onClose={() => setNouvelleDa(false)} />}
      {cfOuverte && <CommandeFournisseurDrawer key={cfOuverte.cf?.id ?? `n${cfOuverte.da?.id ?? 0}`} cf={cfOuverte.cf} da={cfOuverte.da} onClose={() => setCfOuverte(null)} />}
      {reception && <ReceptionDrawer key={reception.id} cf={reception} onClose={() => setReception(null)} />}
    </div>
  );
}
