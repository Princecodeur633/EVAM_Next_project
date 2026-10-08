"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, BadgePercent, Check, FileDown, Plus, Receipt, X } from "lucide-react";
import { OrderBadge } from "@/components/badges";
import { DerogationDrawer } from "@/components/DerogationDrawer";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Historique } from "@/components/Historique";
import { SfecFacture } from "@/components/sfec";
import { Button, Guard, ORDER_STEPS, PageHeader, Panel, StatusBadge, StatusStepper, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { stockDisponible } from "@/lib/engine";
import { telechargerFacturePdf } from "@/lib/facturePdf";
import { STATUT_FACTURE_LABEL, TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { LigneCommande } from "@/lib/types";
import { cn, formatDa, formatDate, formatQty, num } from "@/lib/utils";

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, clientName, articleName, produitsFinis, tarifFor, can } = useStore();
  const cmd = state.commandes.find((c) => c.id === Number(id));
  const [ajout, setAjout] = useState(false);
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [apercu, setApercu] = useState(false);
  const [derogation, setDerogation] = useState<LigneCommande | null>(null);
  if (!cmd) return <p className="text-[13px] text-muted">Commande introuvable.</p>;

  const lignes = state.lignesCommande.filter((l) => l.commande === cmd.id);
  const facture = state.factures.find((f) => f.commande === cmd.id);
  const lignesFacture = state.lignesFacture.filter((l) => l.facture === facture?.id);
  const client = state.clients.find((c) => c.id === cmd.client);
  const total = lignes.reduce((a, l) => a + num(l.quantite) * num(l.prix_unitaire), 0);
  const dispo = (articleId: number) => state.stock.filter((s) => s.article === articleId).reduce((a, s) => a + stockDisponible(s), 0);

  // Encours du client : factures non soldées, comparées à l’encours autorisé.
  const encours = state.factures
    .filter((f) => f.client === cmd.client && (f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE"))
    .reduce((a, f) => a + num(f.montant_total), 0);
  const plafond = num(client?.encours_autorise);
  const ratio = plafond > 0 ? Math.min(100, (encours / plafond) * 100) : 0;
  const depasse = plafond > 0 && encours + (facture ? 0 : total) > plafond;

  const brouillon = cmd.statut === "BROUILLON";
  const peutLignes = brouillon && can("CREATE_COMMANDE");
  const peutValider = brouillon && can("CREATE_COMMANDE") && lignes.length > 0;
  // Client sous contrat : la facture est émise automatiquement après la confirmation de livraison.
  const sousContrat = cmd.type_commande === "CONTRAT";
  const peutFacturer = !facture && !brouillon && !sousContrat && cmd.statut !== "ANNULEE" && can("CREATE_FACTURE") && lignes.length > 0;
  const peutDeroger = sousContrat && can("DEROGATION_PRIX") && cmd.statut !== "FACTUREE" && cmd.statut !== "ANNULEE";
  const pdfPret = !!facture && !!client && lignesFacture.length > 0;
  const prix = article ? tarifFor(article, cmd.client) : 0;

  async function ajouter() {
    setBusy(true);
    const ok = await dispatch({ type: "ADD_LIGNE_COMMANDE", commande: cmd!.id, article, quantite: Number(qty) });
    setBusy(false);
    if (ok) {
      setArticle(0);
      setQty("");
      setAjout(false);
    }
  }
  async function valider() {
    setBusy(true);
    await dispatch({ type: "PATCH_COMMANDE", id: cmd!.id, statut: "VALIDEE" });
    setBusy(false);
  }

  return (
    <div className="space-y-4 max-w-[1280px]">
      <Link href="/commercial/commandes" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Commandes
      </Link>
      <PageHeader eyebrow="Commande" title={cmd.numero} status={<OrderBadge status={cmd.statut} />} description={TYPE_COMMANDE_LABEL[cmd.type_commande] ?? cmd.type_commande} />
      <StatusStepper steps={ORDER_STEPS} current={cmd.statut === "ANNULEE" ? "BROUILLON" : cmd.statut} />

      {/* Client + encours en direct */}
      <Panel className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">Client</p>
          <p className="text-[15px] font-semibold truncate">
            {clientName(cmd.client)}
            {client?.bloque && <span className="ml-2 align-middle"><StatusBadge tone="danger">Bloqué</StatusBadge></span>}
          </p>
          <p className="text-[12px] text-muted">{client?.delai_paiement_jours ? `Paiement à ${client.delai_paiement_jours} jours` : "Paiement comptant"}</p>
        </div>
        <div className="sm:w-[280px] shrink-0">
          <div className="flex items-baseline justify-between gap-2 text-[12px] mb-1">
            <span className="text-muted">Encours</span>
            <span className={cn("num font-semibold", depasse ? "text-danger" : "text-ink")}>
              {formatQty(encours, 0)} / {plafond > 0 ? formatQty(plafond, 0) : "—"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 border border-line overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", depasse ? "bg-danger" : ratio > 80 ? "bg-warning" : "bg-success")} style={{ width: `${ratio}%` }} />
          </div>
          {depasse && <p className="text-[11.5px] text-danger mt-1">Cette commande ferait dépasser l’encours autorisé.</p>}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 items-start">
        {/* Centre : lignes */}
        <Panel className="overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold">
              Lignes <span className="text-muted font-normal">({lignes.length})</span>
            </h2>
            {peutLignes && !ajout && (
              <Button className="h-8 px-3 text-[12.5px]" onClick={() => setAjout(true)}>
                <Plus size={14} /> Ligne
              </Button>
            )}
          </div>
          {peutLignes && ajout && (
            <div className="px-4 py-3 border-b border-line bg-primary-soft/30 grid sm:grid-cols-[minmax(0,1fr)_110px_120px_auto] gap-2 items-end">
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
              </label>
              <label className="block">
                <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Quantité</span>
                <input type="number" min="0" className={cn(inputClass, "text-right num")} value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <div>
                <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Prix (auto)</span>
                <p className={cn("h-9 px-3 rounded-[7px] bg-surface-2 border border-line flex items-center justify-end text-[13px] num", article && !prix && "text-danger")}>
                  {article ? (prix ? formatDa(prix) : "Sans tarif") : "—"}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button disabled={!article || !(Number(qty) > 0) || !prix || busy} onClick={() => void ajouter()}>
                  <Check size={14} /> Ajouter
                </Button>
                <Button variant="ghost" onClick={() => setAjout(false)} aria-label="Annuler">
                  <X size={14} />
                </Button>
              </div>
              {article > 0 && (
                <p className="sm:col-span-4 text-[11.5px] text-muted">
                  Stock disponible : <span className={cn("num font-medium", dispo(article) < Number(qty) ? "text-warning" : "text-ink")}>{formatQty(dispo(article), 0)}</span> (information, la commande n’est pas bloquée)
                </p>
              )}
            </div>
          )}
          {lignes.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">Aucune ligne. {peutLignes ? "Ajoutez les articles commandés." : ""}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[520px]">
                <thead>
                  <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-4 py-2 font-medium">Article</th>
                    <th className="px-4 py-2 font-medium text-right">Quantité</th>
                    <th className="px-4 py-2 font-medium text-right">Prix</th>
                    <th className="px-4 py-2 font-medium text-right">Montant</th>
                    {peutDeroger && <th className="px-4 py-2 w-[48px]" />}
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l) => {
                    const d = dispo(l.article);
                    const court = d < num(l.quantite);
                    return (
                      <tr key={l.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] font-medium">{articleName(l.article)}</p>
                          <p className={cn("text-[11.5px] num", court ? "text-warning" : "text-muted")}>Stock disponible {formatQty(d, 0)}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] num">{formatQty(num(l.quantite), 0)}</td>
                        <td className="px-4 py-2.5 text-right text-[13px] num">
                          {formatDa(num(l.prix_unitaire))}
                          {l.prix_tarif != null && num(l.prix_tarif) !== num(l.prix_unitaire) && (
                            <span className="block text-[11px] text-warning" title={l.motif_derogation}>
                              tarif {formatDa(num(l.prix_tarif))} · dérogation
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] num font-medium">{formatDa(num(l.quantite) * num(l.prix_unitaire))}</td>
                        {peutDeroger && (
                          <td className="px-2 py-2.5 text-right">
                            <button
                              type="button"
                              title="Autoriser un prix différent du tarif"
                              aria-label="Autoriser un prix différent du tarif"
                              className="h-7 w-7 rounded-[6px] inline-flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2"
                              onClick={() => setDerogation(l)}
                            >
                              <BadgePercent size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Droite : total + facture */}
        <div className="space-y-3 min-w-0">
          <Panel className="p-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-medium">Total commande (HT)</p>
            <p className="text-[26px] font-semibold num tracking-tight mt-1">{formatDa(total)}</p>
            <p className="text-[12px] text-muted">{lignes.length} ligne{lignes.length > 1 ? "s" : ""} · {formatQty(lignes.reduce((a, l) => a + num(l.quantite), 0), 0)} unités</p>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <Receipt size={15} className="text-muted" />
              <h2 className="text-[13px] font-semibold flex-1">Facture</h2>
              {facture && <StatusBadge tone={facture.statut === "PAYEE" ? "success" : facture.statut === "ANNULEE" ? "danger" : "warning"}>{STATUT_FACTURE_LABEL[facture.statut]}</StatusBadge>}
            </div>
            {facture ? (
              <div className="p-4 space-y-2 text-[13px]">
                <p className="font-medium num">{facture.numero}</p>
                <dl className="space-y-1">
                  {[
                    ["Montant HT", formatDa(num(facture.montant_ht_total))],
                    ["Taxes (TVA, accise, centimes)", formatDa(num(facture.montant_taxes_total))],
                    ["Total TTC", formatDa(num(facture.montant_total))],
                    ["Échéance", facture.date_echeance ? formatDate(facture.date_echeance) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className={cn("num text-right", k === "Total TTC" && "font-semibold")}>{v}</dd>
                    </div>
                  ))}
                </dl>
                {lignesFacture.length === 0 && (
                  <Guard variant="warn" title="Lignes de facture non générées">
                    Un article sans code fiscal actif ne peut pas être facturé.
                    {can("GENERER_LIGNES_FACTURE") && (
                      <Button className="h-8 px-3 text-[12px] mt-2" onClick={() => void dispatch({ type: "GENERER_LIGNES_FACTURE", id: facture.id })}>
                        Générer les lignes
                      </Button>
                    )}
                  </Guard>
                )}
                <SfecFacture facture={facture} />
              </div>
            ) : (
              <p className="p-4 text-[12.5px] text-muted">
                {brouillon
                  ? "Validez la commande avant de la facturer."
                  : sousContrat
                    ? "Client sous contrat : la facture est émise automatiquement après la livraison et la confirmation de réception."
                    : "Pas encore facturée."}
              </p>
            )}
          </Panel>
        </div>
      </div>

      <Historique endpoint={endpoints.commandes} id={cmd.id} />

      {derogation && (
        <DerogationDrawer
          ligne={derogation}
          libelle={articleName(derogation.article)}
          onClose={() => setDerogation(null)}
          onSave={(prixUnitaire, motif) =>
            dispatch({ type: "EXEC", run: () => actions.autoriserPrixLigneCommande(derogation.id, prixUnitaire, motif), refresh: ["lignesCommande", "commandes"] })
          }
        />
      )}

      {/* Barre fixe : Valider → Facturer → PDF */}
      {(peutValider || peutFacturer || pdfPret) && (
        <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-4 py-3 border-t sm:border border-line bg-surface/95 backdrop-blur-md sm:rounded-[10px] shadow-[var(--shadow)] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[12px] text-muted flex-1">
            {peutValider ? "Vérifiez les lignes, puis validez la commande." : peutFacturer ? "Commande validée : émettez la facture." : "Facture émise : téléchargez-la."}
          </p>
          {peutValider && (
            <Button disabled={busy || client?.bloque} onClick={() => void valider()}>
              <Check size={15} /> Valider
            </Button>
          )}
          {peutFacturer && (
            <Button onClick={() => setApercu(true)}>
              <Receipt size={15} /> Facturer
            </Button>
          )}
          {pdfPret && (
            <Button
              variant="secondary"
              onClick={() =>
                void actions
                  .pdf("facture", facture!.id, facture!.numero)
                  .catch(() => telechargerFacturePdf({ facture: facture!, client: client!, commande: cmd, lignes: lignesFacture, articleName }))
              }
            >
              <FileDown size={15} /> PDF
            </Button>
          )}
        </div>
      )}

      {apercu && <ApercuFacture commandeId={cmd.id} onClose={() => setApercu(false)} />}
    </div>
  );
}

/** Aperçu HT / TVA / TTC avant émission ; les montants définitifs sont calculés par EVAM sur la facture. */
function ApercuFacture({ commandeId, onClose }: { commandeId: number; onClose: () => void }) {
  const { state, dispatch, articleName, clientName } = useStore();
  const cmd = state.commandes.find((c) => c.id === commandeId)!;
  const lignes = state.lignesCommande.filter((l) => l.commande === commandeId);
  const [saving, setSaving] = useState(false);

  const detail = lignes.map((l) => {
    const ht = num(l.quantite) * num(l.prix_unitaire);
    const article = state.articles.find((a) => a.id === l.article);
    const code = state.codesFiscaux.find((c) => c.id === article?.code_fiscal);
    const taux = (v: string | undefined) => (code && !code.exonere ? num(v) / 100 : 0);
    const accise = ht * taux(code?.taux_accise);
    const centimes = ht * taux(code?.taux_centimes_additionnels);
    const tva = ht * taux(code?.taux_tva);
    return { l, ht, accise, centimes, tva, sansCode: !code };
  });
  const somme = (k: "ht" | "accise" | "centimes" | "tva") => detail.reduce((a, d) => a + d[k], 0);
  const ttc = somme("ht") + somme("accise") + somme("centimes") + somme("tva");
  const sansCode = detail.some((d) => d.sansCode);

  async function facturer() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_FACTURE", commande: cmd.id, client: cmd.client, montant_total: somme("ht") });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Facturer la commande"
      subtitle={`${cmd.numero} · ${clientName(cmd.client)}`}
      icon={<Receipt size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={saving} onClick={() => void facturer()}>
            {saving ? "Émission…" : "Émettre la facture"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Aperçu" hint="Estimation à partir des codes fiscaux des articles : les montants définitifs sont calculés à l’émission.">
        <ul className="rounded-[9px] border border-line divide-y divide-line">
          {detail.map((d) => (
            <li key={d.l.id} className="px-3 py-2 flex justify-between gap-3 text-[12.5px]">
              <span className="min-w-0 truncate">
                {articleName(d.l.article)} × {formatQty(num(d.l.quantite), 0)}
                {d.sansCode && <span className="text-danger"> · sans code fiscal</span>}
              </span>
              <span className="num shrink-0">{formatDa(d.ht)}</span>
            </li>
          ))}
        </ul>
        <dl className="rounded-[9px] bg-surface-2 border border-line p-3 space-y-1.5 text-[13px]">
          {[
            ["Total HT", somme("ht")],
            ["Accise", somme("accise")],
            ["Centimes additionnels", somme("centimes")],
            ["TVA", somme("tva")],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="num">{formatDa(v as number)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 pt-1.5 border-t border-line text-[15px] font-semibold">
            <dt>Total TTC</dt>
            <dd className="num">{formatDa(ttc)}</dd>
          </div>
        </dl>
        {sansCode && (
          <Guard variant="warn" title="Article sans code fiscal">
            Ses lignes de facture ne pourront pas être générées tant que le code fiscal n’est pas renseigné.
          </Guard>
        )}
      </DrawerSection>
    </Drawer>
  );
}
