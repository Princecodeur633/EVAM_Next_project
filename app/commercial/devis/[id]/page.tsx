"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, BadgePercent, Check, FileDown, Plus, RotateCcw, Send, Trash2, X } from "lucide-react";
import { DevisBadge } from "@/components/badges";
import { DerogationDrawer } from "@/components/DerogationDrawer";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, PageHeader, Panel, inputClass } from "@/components/ui";
import { actions, api, endpoints } from "@/lib/api";
import { TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Devis, LigneDevis } from "@/lib/types";
import { cn, formatDa, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, produitsFinis, tarifFor, can, userName } = useStore();
  const devis = state.devis.find((d) => d.id === Number(id));
  const [ajout, setAjout] = useState(false);
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [refus, setRefus] = useState(false);
  const [acceptation, setAcceptation] = useState(false);
  const [derogation, setDerogation] = useState<LigneDevis | null>(null);
  if (!devis) return <p className="text-[13px] text-muted">Devis introuvable.</p>;

  const d = devis;
  const brouillon = d.statut === "BROUILLON";
  const envoye = d.statut === "ENVOYE";
  const gerer = can("GERER_DEVIS");
  // Dérogation : client sous contrat, devis encore modifiable (le backend fige les lignes après envoi).
  const peutDeroger = brouillon && d.type_commande === "CONTRAT" && can("DEROGATION_PRIX");
  const ht = num(d.totaux?.ht ?? d.lignes.reduce((a, l) => a + num(l.quantite) * num(l.prix_unitaire), 0));
  const prix = article ? tarifFor(article, d.client) : 0;

  async function exec(run: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run, refresh: ["devis"] });
    setBusy(false);
    return ok;
  }

  async function ajouter() {
    const ok = await exec(() => actions.ajouterLigneDevis({ devis: d.id, article, quantite: Number(qty) }));
    if (ok) {
      setArticle(0);
      setQty("");
      setAjout(false);
    }
  }

  return (
    <div className="space-y-4 max-w-[1280px]">
      <Link href="/commercial/devis" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Devis
      </Link>
      <PageHeader
        eyebrow="Devis"
        title={d.numero}
        status={<DevisBadge status={d.statut} />}
        description={`${d.client_nom ?? `Client n°${d.client}`} · ${TYPE_COMMANDE_LABEL[d.type_commande] ?? d.type_commande}`}
        actions={
          <Button variant="secondary" onClick={() => void actions.pdf("devis", d.id, d.numero).catch(() => {})}>
            <FileDown size={15} /> PDF
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 items-start">
        <Panel className="overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold">
              Lignes <span className="text-muted font-normal">({d.lignes.length})</span>
            </h2>
            {brouillon && gerer && !ajout && (
              <Button className="h-8 px-3 text-[12.5px]" onClick={() => setAjout(true)}>
                <Plus size={14} /> Ligne
              </Button>
            )}
          </div>
          {brouillon && gerer && ajout && (
            <div className="px-4 py-3 border-b border-line bg-primary-soft/30 grid sm:grid-cols-[minmax(0,1fr)_110px_auto] gap-2 items-end">
              <label className="block min-w-0">
                <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Article</span>
                <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))} autoFocus>
                  <option value={0}>Choisir…</option>
                  {produitsFinis.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} · {a.designation}
                    </option>
                  ))}
                </select>
                {article > 0 && (
                  <span className={cn("block text-[11.5px] mt-1", prix > 0 ? "text-muted" : "text-danger")}>
                    {prix > 0 ? `Tarif en vigueur : ${formatDa(prix)}` : "Aucun tarif en vigueur : la ligne sera refusée."}
                  </span>
                )}
              </label>
              <label className="block">
                <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Quantité</span>
                <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <div className="flex gap-1.5">
                <Button disabled={!article || !(Number(qty) > 0) || busy} onClick={() => void ajouter()}>
                  <Check size={14} /> Ajouter
                </Button>
                <Button variant="ghost" onClick={() => setAjout(false)} aria-label="Annuler">
                  <X size={14} />
                </Button>
              </div>
            </div>
          )}
          {d.lignes.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-muted">Aucune ligne.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-line">
                    <th className="px-4 py-2 font-medium">Article</th>
                    <th className="px-3 py-2 font-medium text-right">Quantité</th>
                    <th className="px-3 py-2 font-medium text-right">Prix unitaire</th>
                    <th className="px-3 py-2 font-medium text-right">Montant HT</th>
                    {d.lignes.some((l) => l.quantite_acceptee != null) && <th className="px-3 py-2 font-medium text-right">Acceptée</th>}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.lignes.map((l) => {
                    const derogee = l.prix_tarif != null && num(l.prix_tarif) !== num(l.prix_unitaire);
                    return (
                      <tr key={l.id}>
                        <td className="px-4 py-2">
                          {l.article_code} · {l.article_designation}
                          {derogee && (
                            <span className="block text-[11.5px] text-warning">
                              Dérogation (tarif {formatDa(num(l.prix_tarif))}) : {l.motif_derogation}
                              {l.derogation_autorisee_par != null && ` — ${userName(l.derogation_autorisee_par)}`}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right num">{formatQty(num(l.quantite), 0)}</td>
                        <td className="px-3 py-2 text-right num">{formatDa(num(l.prix_unitaire))}</td>
                        <td className="px-3 py-2 text-right num">{formatDa(num(l.montant_ht ?? num(l.quantite) * num(l.prix_unitaire)))}</td>
                        {d.lignes.some((x) => x.quantite_acceptee != null) && (
                          <td className="px-3 py-2 text-right num">{l.quantite_acceptee != null ? formatQty(num(l.quantite_acceptee), 0) : "—"}</td>
                        )}
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {peutDeroger && (
                            <Button variant="ghost" className="h-7 px-2" aria-label="Dérogation de prix" onClick={() => setDerogation(l)}>
                              <BadgePercent size={14} />
                            </Button>
                          )}
                          {brouillon && gerer && (
                            <Button variant="ghost" className="h-7 px-2" aria-label="Supprimer la ligne" disabled={busy} onClick={() => void exec(() => actions.supprimerLigneDevis(l.id))}>
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4 space-y-2 text-[13px]">
            <Ligne label="Total HT" value={formatDa(ht)} />
            {d.totaux?.taxes != null && <Ligne label="Taxes estimées" value={formatDa(num(d.totaux.taxes))} />}
            {d.totaux?.ttc != null && <Ligne label="Total TTC" value={formatDa(num(d.totaux.ttc))} fort />}
            <div className="border-t border-line pt-2 space-y-1.5">
              <Ligne label="Valable jusqu’au" value={formatDate(d.date_validite)} />
              <Ligne label="Établi le" value={formatDateTime(d.date_creation)} />
              {d.date_envoi && <Ligne label="Envoyé le" value={formatDateTime(d.date_envoi)} />}
              {d.date_reponse && <Ligne label="Réponse le" value={formatDateTime(d.date_reponse)} />}
            </div>
            {d.conditions && <p className="border-t border-line pt-2 text-[12.5px] text-muted whitespace-pre-line">{d.conditions}</p>}
            {d.motif_refus && <p className="border-t border-line pt-2 text-[12.5px] text-danger">Refusé : {d.motif_refus}</p>}
            {(d.commandes?.length ?? 0) > 0 && (
              <p className="border-t border-line pt-2 text-[12.5px]">
                Commande{d.commandes!.length > 1 ? "s" : ""} créée{d.commandes!.length > 1 ? "s" : ""} :{" "}
                {d.commandes!.map((n) => {
                  const c = state.commandes.find((x) => x.numero === n);
                  return c ? (
                    <Link key={n} href={`/commercial/commandes/${c.id}`} className="num text-primary hover:underline mr-2">
                      {n}
                    </Link>
                  ) : (
                    <span key={n} className="num mr-2">
                      {n}
                    </span>
                  );
                })}
              </p>
            )}
          </Panel>

          {gerer && (brouillon || envoye) && (
            <Panel className="p-4 space-y-2">
              {brouillon && (
                <>
                  <Button className="w-full" disabled={d.lignes.length === 0 || busy} onClick={() => void exec(() => actions.envoyerDevis(d.id))}>
                    <Send size={14} /> Marquer comme envoyé au client
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-danger"
                    disabled={busy}
                    onClick={async () => {
                      if (await exec(() => api.del(`${endpoints.devis}${d.id}/`))) router.push("/commercial/devis");
                    }}
                  >
                    <Trash2 size={14} /> Supprimer le brouillon
                  </Button>
                </>
              )}
              {envoye && (
                <>
                  <Button className="w-full" disabled={busy} onClick={() => setAcceptation(true)}>
                    <Check size={14} /> Acceptation du client
                  </Button>
                  <Button variant="secondary" className="w-full" disabled={busy} onClick={() => void exec(() => actions.reviserDevis(d.id))}>
                    <RotateCcw size={14} /> Repasser en brouillon (modification)
                  </Button>
                  <Button variant="ghost" className="w-full text-danger" disabled={busy} onClick={() => setRefus(true)}>
                    <X size={14} /> Refus du client
                  </Button>
                </>
              )}
            </Panel>
          )}
        </div>
      </div>

      {refus && <RefusDrawer onClose={() => setRefus(false)} onSave={(motif) => exec(() => actions.refuserDevis(d.id, motif))} />}
      {acceptation && <AcceptationDrawer devis={d} onClose={() => setAcceptation(false)} />}
      {derogation && (
        <DerogationDrawer
          ligne={derogation}
          libelle={`${derogation.article_code ?? ""} · ${derogation.article_designation ?? ""}`}
          onClose={() => setDerogation(null)}
          onSave={(prixUnitaire, motif) => exec(() => actions.autoriserPrixLigneDevis(derogation.id, prixUnitaire, motif))}
        />
      )}
    </div>
  );
}

function Ligne({ label, value, fort }: { label: string; value: string; fort?: boolean }) {
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={cn("num", fort && "font-semibold text-[14px]")}>{value}</span>
    </p>
  );
}

function RefusDrawer({ onClose, onSave }: { onClose: () => void; onSave: (motif: string) => Promise<boolean> }) {
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Drawer
      open
      onClose={onClose}
      title="Refus du client"
      icon={<X size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const ok = await onSave(motif.trim());
              setBusy(false);
              if (ok) onClose();
            }}
          >
            Enregistrer le refus
          </Button>
        </>
      }
    >
      <DrawerSection title="Motif" hint="Le devis refusé est figé.">
        <textarea className={cn(inputClass, "h-24 py-2")} value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus />
      </DrawerSection>
    </Drawer>
  );
}

/** Acceptation totale ou partielle : la commande (brouillon) est créée avec les quantités acceptées. */
function AcceptationDrawer({ devis, onClose }: { devis: Devis; onClose: () => void }) {
  const { dispatch } = useStore();
  const router = useRouter();
  const [qtes, setQtes] = useState<Record<number, string>>(() => Object.fromEntries(devis.lignes.map((l) => [l.id, String(num(l.quantite))])));
  const [busy, setBusy] = useState(false);
  const valide =
    devis.lignes.every((l) => qtes[l.id] !== "" && Number(qtes[l.id]) >= 0 && Number(qtes[l.id]) <= num(l.quantite)) &&
    devis.lignes.some((l) => Number(qtes[l.id]) > 0);

  async function accepter() {
    setBusy(true);
    let commande: number | null = null;
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        const r = await actions.accepterDevis(devis.id, Object.fromEntries(devis.lignes.map((l) => [String(l.id), Number(qtes[l.id])])));
        commande = r.commande.id;
      },
      refresh: ["devis", "commandes", "lignesCommande"],
    });
    setBusy(false);
    if (ok && commande != null) router.push(`/commercial/commandes/${commande}`);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Acceptation du client"
      subtitle="Quantité 0 = ligne refusée par le client."
      icon={<Check size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valide || busy} onClick={() => void accepter()}>
            {busy ? "Création…" : "Créer la commande"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Quantités acceptées" hint="Les prix du devis sont repris sur la commande, qui s’ouvre en brouillon.">
        <ul className="rounded-[8px] border border-line divide-y divide-line">
          {devis.lignes.map((l) => (
            <li key={l.id} className="px-3 py-2 flex items-center gap-3">
              <span className="min-w-0 flex-1 text-[12.5px] truncate">
                {l.article_code} · {l.article_designation}
              </span>
              <span className="text-[11.5px] text-muted num">/ {formatQty(num(l.quantite), 0)}</span>
              <input
                type="number"
                min="0"
                max={num(l.quantite)}
                step="any"
                aria-label={`Quantité acceptée ${l.article_code ?? ""}`}
                className={cn(inputClass, "h-8 w-[100px] num text-right")}
                value={qtes[l.id] ?? ""}
                onChange={(e) => setQtes((q) => ({ ...q, [l.id]: e.target.value }))}
              />
            </li>
          ))}
        </ul>
      </DrawerSection>
    </Drawer>
  );
}
