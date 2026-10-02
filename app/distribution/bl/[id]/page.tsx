"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, HandHelping, PackageCheck } from "lucide-react";
import { BlBadge, PaiementBadge } from "@/components/badges";
import { Historique } from "@/components/Historique";
import { RemiseDrawer, SignalerDrawer } from "@/components/livraison";
import { Button, DataTable, Guard, PageHeader, Panel } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { canAccess } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { cn, formatDa, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

export default function BlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, can, clientName, articleName, userName, role } = useStore();
  const bl = state.bonsLivraison.find((b) => b.id === Number(id));
  const [busy, setBusy] = useState(false);
  const [signaler, setSignaler] = useState(false);
  const [remise, setRemise] = useState(false);
  if (!bl) return <p className="text-[13px] text-muted">Bon de livraison introuvable.</p>;

  const cmd = state.commandes.find((c) => c.id === bl.commande);
  const facture = state.factures.find((f) => f.commande === bl.commande);
  const lignes = state.lignesCommande.filter((l) => l.commande === bl.commande);
  const tournee = bl.tournee ? state.tournees.find((t) => t.id === bl.tournee) : null;
  const chauffeur = tournee ? state.chauffeurs.find((c) => c.id === tournee.chauffeur) : null;
  const vehicule = tournee ? state.vehicules.find((v) => v.id === tournee.vehicule) : null;
  const enCours = bl.statut === "EN_LIVRAISON";

  // Comptant : la livraison ne se confirme qu’une fois la facture soldée.
  const comptant = cmd?.type_commande === "COMPTANT";
  const soldee = facture?.statut === "PAYEE";
  const bloqueParPaiement = comptant && !soldee;
  const peutConfirmer = can("CONFIRMER_BL") && bl.statut !== "LIVREE";
  const peutRemettre = enCours && can("LIVRER_BL") && !bl.signature_client;
  const peutSignaler = enCours && can("SIGNALER_PROBLEME_BL");

  async function run(action: Parameters<typeof dispatch>[0]) {
    setBusy(true);
    await dispatch(action);
    setBusy(false);
  }

  const resume: [string, React.ReactNode][] = [
    ["Commande", cmd && role !== "CHAUFFEUR" ? <Link href={`/commercial/commandes/${cmd.id}`} className="text-primary hover:underline num">{cmd.numero}</Link> : (bl.commande_numero ?? "—")],
    ["Client", cmd ? clientName(cmd.client) : (bl.client_nom ?? "—")],
    ...(bl.client_adresse ? ([["Adresse", bl.client_adresse]] as [string, React.ReactNode][]) : []),
    ["Type", cmd ? TYPE_COMMANDE_LABEL[cmd.type_commande] : "—"],
    ["Tournée", tournee ? `${tournee.numero} · ${formatDate(tournee.date_tournee)}` : "Non affecté"],
    ["Chauffeur / véhicule", tournee ? `${userName(chauffeur?.utilisateur)} · ${vehicule?.immatriculation ?? "—"}` : "—"],
    ["Signature client", bl.signature_client ? `Oui${bl.date_signature ? ` · ${formatDateTime(bl.date_signature)}` : ""}` : "Non"],
    ["Généré le", formatDateTime(bl.date_generation)],
  ];

  return (
    <div className="space-y-4 max-w-[1200px]">
      <Link href={role && canAccess(role, "/distribution") ? "/distribution?etape=bl" : "/distribution/bl"} className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Bons de livraison
      </Link>
      <PageHeader eyebrow="Bon de livraison" title={bl.numero} status={<BlBadge status={bl.statut} />} description={cmd ? `${cmd.numero} · ${clientName(cmd.client)}` : bl.client_nom} />

      {bl.incident_livraison && (
        <Guard variant="warn" title="Incident signalé par le chauffeur">
          {bl.incident_livraison}
        </Guard>
      )}
      {bl.statut === "LIVREE" && (
        <Guard variant="ok" title="Livraison confirmée">
          {bl.date_livraison ? `Le ${formatDateTime(bl.date_livraison)}` : ""}
          {bl.confirme_par ? ` par ${userName(bl.confirme_par)}.` : "."}
        </Guard>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          {/* Paiement mis en évidence (le chauffeur ne voit pas les factures) */}
          {role !== "CHAUFFEUR" && (
          <Panel className={cn("p-4 border-l-4", soldee ? "border-l-success" : bloqueParPaiement ? "border-l-danger" : "border-l-warning")}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">Paiement de la facture</p>
              <PaiementBadge facture={facture} />
            </div>
            <p className="text-[22px] font-semibold num mt-1">{facture ? formatDa(num(facture.montant_total)) : "—"}</p>
            <p className="text-[12px] text-muted">
              {facture ? `${facture.numero} · ` : ""}
              {comptant ? "Commande au comptant : à solder avant confirmation." : "Commande sous contrat : livraison possible avant paiement."}
            </p>
          </Panel>
          )}
          <Panel className="overflow-hidden">
            <dl className="divide-y divide-line">
              {resume.map(([k, v]) => (
                <div key={k} className="px-4 py-2.5 flex justify-between gap-3 text-[13px]">
                  <dt className="text-muted shrink-0">{k}</dt>
                  <dd className="text-right min-w-0 break-words font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
        <Panel className="overflow-hidden min-w-0">
          <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Articles livrés</h2>
          <DataTable
            emptyText="Le détail des lignes n’est pas transmis à ce poste."
            columns={[
              { key: "a", label: "Article" },
              { key: "q", label: "Quantité", className: "text-right" },
            ]}
            rows={
              lignes.length
                ? lignes.map((l) => ({ a: articleName(l.article), q: <span className="num">{formatQty(num(l.quantite), 0)}</span> }))
                : (bl.articles ?? []).map((l) => ({ a: l.designation, q: <span className="num">{formatQty(num(l.quantite), 0)}</span> }))
            }
          />
        </Panel>
      </div>

      <Historique endpoint={endpoints.bonsLivraison} id={bl.id} />

      {(peutConfirmer || peutRemettre || peutSignaler) && (
        <div className={cn("sticky z-20", role === "CHAUFFEUR" ? "bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-0" : "bottom-0")}>
        <div className="-mx-3 sm:mx-0 px-3 sm:px-4 py-3 border-t sm:border border-line bg-surface/95 backdrop-blur-md sm:rounded-[10px] shadow-[var(--shadow)] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className={cn("text-[12px] flex-1", peutConfirmer && bloqueParPaiement ? "text-danger font-medium" : "text-muted")}>
            {peutConfirmer && bloqueParPaiement ? "Facture non soldée : la livraison d’une commande au comptant ne peut pas être confirmée." : peutConfirmer ? "Confirmez une fois le client livré." : "Indiquez la remise au client ou signalez un problème."}
          </p>
          {peutSignaler && (
            <Button variant="secondary" className="text-warning" disabled={busy} onClick={() => setSignaler(true)}>
              <AlertTriangle size={14} /> Signaler un problème
            </Button>
          )}
          {peutRemettre && (
            <Button variant={peutConfirmer ? "secondary" : "success"} disabled={busy} onClick={() => setRemise(true)}>
              <HandHelping size={14} /> Remis au client
            </Button>
          )}
          {peutConfirmer && (
            <Button variant="success" disabled={busy || bloqueParPaiement} title={bloqueParPaiement ? "Facture non soldée" : undefined} onClick={() => void run({ type: "CONFIRMER_BL", id: bl.id })}>
              {bloqueParPaiement ? <PackageCheck size={15} /> : <CheckCircle2 size={15} />} {bloqueParPaiement ? "Facture non soldée" : "Confirmer la livraison"}
            </Button>
          )}
        </div>
        </div>
      )}

      {signaler && <SignalerDrawer blId={bl.id} numero={bl.numero} onClose={() => setSignaler(false)} />}
      {remise && <RemiseDrawer bl={bl} onClose={() => setRemise(false)} />}
    </div>
  );
}
