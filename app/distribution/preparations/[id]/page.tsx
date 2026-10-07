"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardCheck, PackageCheck } from "lucide-react";
import { Historique } from "@/components/Historique";
import { Button, DataTable, Guard, PageHeader, Panel, StatusBadge, StatusStepper } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { STATUT_PREP_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { StatutPreparation } from "@/lib/types";
import { formatDateTime, formatQty, num } from "@/lib/utils";

const STEPS: { id: StatutPreparation; label: string }[] = [
  { id: "A_PREPARER", label: "À préparer" },
  { id: "EN_PREPARATION", label: "En préparation" },
  { id: "SORTIE_MAGASIN", label: "Sortie magasin" },
];
const TONE: Record<StatutPreparation, "info" | "warning" | "teal" | "success"> = { A_PREPARER: "info", EN_PREPARATION: "warning", PRETE: "teal", SORTIE_MAGASIN: "success" };

/** Message backend « Stock insuffisant pour X au dépôt « D » : sortie demandée A, disponible B. » */
function lireErreurStock(message: string) {
  const m = message.match(/Stock insuffisant pour (\S+) au dépôt « (.+?) » : sortie demandée ([\d.,]+), disponible ([-\d.,]+)/);
  return m ? { article: m[1], depot: m[2], demande: Number(m[3]), disponible: Number(m[4]) } : null;
}

export default function PreparationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, can, userName, clientName, articleName } = useStore();
  const p = state.preparations.find((x) => x.id === Number(id));
  const [busy, setBusy] = useState(false);
  const [attenteErreur, setAttenteErreur] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // L’échec de la sortie arrive dans state.lastError : on le reprend ici en Guard rouge.
  useEffect(() => {
    if (attenteErreur && state.lastError) {
      setErreur(state.lastError);
      setAttenteErreur(false);
      void dispatch({ type: "CLEAR_ERROR" });
    }
  }, [attenteErreur, state.lastError, dispatch]);

  if (!p) return <p className="text-[13px] text-muted">Préparation introuvable.</p>;
  const cmd = state.commandes.find((c) => c.id === p.commande);
  // Le Magasinier ne lit pas les commandes : la préparation porte ses lignes, son client et son numéro.
  const lignes = p.lignes ?? state.lignesCommande.filter((l) => l.commande === p.commande).map((l) => ({ article: l.article, code: "", designation: "", quantite: l.quantite }));
  const numeroCommande = p.commande_numero ?? cmd?.numero;
  const nomClient = p.client_nom ?? (cmd ? clientName(cmd.client) : undefined);
  // Lieu de sortie de la préparation (stock usine ou dépôt extérieur), sinon le dépôt produits finis.
  const depotSortie = state.depots.find((d) => d.id === p.depot) ?? state.depots.find((d) => d.est_systeme && /produits finis/i.test(d.role || d.nom));
  const dispo = (article: number) =>
    state.stock
      .filter((s) => s.article === article && (!depotSortie || s.depot === depotSortie.id))
      .reduce((a, s) => a + num(s.quantite_physique) - num(s.quantite_bloquee) - num(s.quantite_reservee), 0);

  const peutConfirmer = p.statut === "A_PREPARER" && can("PREP_CONFIRMER");
  const peutSortir = (p.statut === "EN_PREPARATION" || p.statut === "PRETE") && can("PREP_SORTIE");
  const stock = erreur ? lireErreurStock(erreur) : null;

  async function sortir() {
    setBusy(true);
    setErreur(null);
    const ok = await dispatch({ type: "PREP_SORTIE", id: p!.id });
    if (!ok) setAttenteErreur(true);
    setBusy(false);
  }

  async function confirmer() {
    setBusy(true);
    await dispatch({ type: "PREP_CONFIRMER", id: p!.id });
    setBusy(false);
  }

  const infos: [string, string][] = [
    ["Commande", numeroCommande ?? "—"],
    ["Client", nomClient ?? "—"],
    ["Lieu de sortie", p.depot_nom ?? depotSortie?.nom ?? "Dépôt produits finis"],
    ["Lancée par", userName(p.lancee_par)],
    ["Lancée le", formatDateTime(p.date_lancement)],
    ["Préparée par", p.preparee_par ? userName(p.preparee_par) : "—"],
  ];

  return (
    <div className="space-y-4 max-w-[1100px]">
      <Link href="/distribution/preparations" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Préparations
      </Link>
      <PageHeader
        eyebrow="Préparation"
        title={numeroCommande ?? `Préparation n°${p.id}`}
        status={<StatusBadge tone={TONE[p.statut]}>{STATUT_PREP_LABEL[p.statut]}</StatusBadge>}
        description={nomClient}
      />
      <StatusStepper steps={STEPS} current={p.statut === "PRETE" ? "EN_PREPARATION" : p.statut} />

      {erreur && (
        <Guard variant="block" title={stock ? "Stock insuffisant — sortie refusée" : "Sortie impossible"}>
          {stock ? (
            <>
              <span className="font-medium">{stock.article}</span> au dépôt « {stock.depot} » : demandé <span className="num font-semibold">{formatQty(stock.demande, 0)}</span>, disponible réel{" "}
              <span className="num font-semibold text-danger">{formatQty(stock.disponible, 0)}</span>. Aucune sortie n’a été enregistrée.
            </>
          ) : (
            erreur
          )}
        </Guard>
      )}
      {p.statut === "SORTIE_MAGASIN" && (
        <Guard variant="ok" title="Sortie magasin confirmée">
          Le stock a été débité{p.date_confirmation_sortie ? ` le ${formatDateTime(p.date_confirmation_sortie)}` : ""}. La commande peut être livrée.
        </Guard>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 items-start">
        <Panel className="overflow-hidden">
          <dl className="divide-y divide-line">
            {infos.map(([k, v]) => (
              <div key={k} className="px-4 py-2.5 flex justify-between gap-3 text-[13px]">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel className="overflow-hidden">
          <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Articles à sortir</h2>
          <DataTable
            emptyText="Aucune ligne sur cette commande."
            columns={[
              { key: "a", label: "Article" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "d", label: "Disponible", className: "text-right" },
            ]}
            rows={lignes.map((l) => {
              const d = dispo(l.article);
              return {
                a: l.designation ? `${l.code} · ${l.designation}` : articleName(l.article),
                q: <span className="num">{formatQty(num(l.quantite), 0)}</span>,
                d: <span className={d < num(l.quantite) ? "num text-danger font-semibold" : "num"}>{formatQty(d, 0)}</span>,
              };
            })}
          />
        </Panel>
      </div>

      <Historique endpoint={endpoints.preparations} id={p.id} />

      {(peutConfirmer || peutSortir) && (
        <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-4 py-3 border-t sm:border border-line bg-surface/95 backdrop-blur-md sm:rounded-[10px] shadow-[var(--shadow)] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[12px] text-muted flex-1">
            {peutConfirmer ? "Préparez les articles, puis confirmez la préparation." : "Confirmez la sortie : le stock produits finis est débité, tout ou rien."}
          </p>
          {peutConfirmer && (
            <Button disabled={busy} onClick={() => void confirmer()}>
              <ClipboardCheck size={15} /> Confirmer préparation
            </Button>
          )}
          {peutSortir && (
            <Button variant="success" disabled={busy} onClick={() => void sortir()}>
              <PackageCheck size={15} /> {busy ? "Sortie…" : "Confirmer sortie"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
