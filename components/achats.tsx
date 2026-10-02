"use client";

import { useState } from "react";
import { FilePlus2, PackageCheck, Plus, Send, ShoppingCart, Trash2 } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Historique } from "@/components/Historique";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, StatusBadge, inputClass } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { STATUT_CF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { CommandeFournisseur, DemandeAchat } from "@/lib/types";
import { cn, formatDa, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

export const CF_TONE: Record<CommandeFournisseur["statut"], "neutral" | "info" | "warning" | "success" | "danger"> = {
  BROUILLON: "neutral",
  ENVOYEE: "info",
  PARTIELLEMENT_RECUE: "warning",
  RECUE: "success",
  ANNULEE: "danger",
};

type LigneSaisie = { cle: number; article: number; qty: string; prix: string };

/**
 * Commande fournisseur en un seul tiroir : fournisseur + lignes (article, quantité, prix).
 * Nouvelle commande (éventuellement issue d’une DA approuvée) ou commande existante
 * (onglets Commande · Réceptions · Historique). [Envoyer] fixé en bas tant qu’elle est en brouillon.
 */
export function CommandeFournisseurDrawer({ cf, da, onClose }: { cf?: CommandeFournisseur; da?: DemandeAchat; onClose: () => void }) {
  const { state, dispatch, articleName, fournisseurName, can, userName } = useStore();
  const [onglet, setOnglet] = useState<"commande" | "receptions" | "historique">("commande");
  const [fournisseur, setFournisseur] = useState(cf?.fournisseur ?? 0);
  const prixCatalogue = (f: number, article: number) => state.catalogueFournisseurs.find((c) => c.fournisseur === f && c.article === article)?.prix_unitaire ?? "";
  const [lignes, setLignes] = useState<LigneSaisie[]>(() =>
    cf ? [] : [{ cle: 1, article: da?.article ?? 0, qty: da ? String(num(da.quantite_demandee)) : "", prix: "" }],
  );
  const [saving, setSaving] = useState<"brouillon" | "envoi" | null>(null);

  const existantes = cf ? state.lignesCommandeFournisseur.filter((l) => l.commande === cf.id) : [];
  const brouillon = !cf || cf.statut === "BROUILLON";
  const editable = brouillon && can("CREATE_CF");
  const valides = lignes.filter((l) => l.article && Number(l.qty) > 0);
  const incompletes = lignes.some((l) => (l.article || l.qty) && !(l.article && Number(l.qty) > 0));
  const total =
    existantes.reduce((a, l) => a + num(l.quantite_commandee) * num(l.prix_unitaire), 0) + valides.reduce((a, l) => a + Number(l.qty) * (Number(l.prix) || 0), 0);
  const receptions = cf ? state.receptions.filter((r) => r.commande === cf.id) : [];
  const articlesAchetables = state.articles.filter((a) => a.actif && a.type_article !== "PRODUIT_FINI");

  const maj = (cle: number, champ: Partial<LigneSaisie>) =>
    setLignes((ls) =>
      ls.map((l) => {
        if (l.cle !== cle) return l;
        const suite = { ...l, ...champ };
        // Prix du catalogue fournisseur proposé dès que l’article est choisi.
        if (champ.article && !l.prix && fournisseur) suite.prix = String(prixCatalogue(fournisseur, champ.article));
        return suite;
      }),
    );

  async function enregistrer(envoyer: boolean) {
    setSaving(envoyer ? "envoi" : "brouillon");
    const ok = await dispatch({
      type: "SAVE_CF",
      commande: cf?.id,
      fournisseur,
      demande_achat: da?.id,
      envoyer,
      lignes: valides.map((l) => ({ article: l.article, quantite_commandee: Number(l.qty), prix_unitaire: Number(l.prix) || 0 })),
    });
    setSaving(null);
    if (ok) onClose();
  }

  const peutEnvoyer = editable && can("ENVOYER_CF") && fournisseur > 0 && existantes.length + valides.length > 0 && !incompletes;

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={cf ? cf.numero : "Nouvelle commande fournisseur"}
      subtitle={
        cf ? (
          <span className="inline-flex items-center gap-2">
            {fournisseurName(cf.fournisseur)} · {formatDate(cf.date_commande)} <StatusBadge tone={CF_TONE[cf.statut]}>{STATUT_CF_LABEL[cf.statut]}</StatusBadge>
          </span>
        ) : da ? (
          `Depuis la demande n°${da.id} · ${articleName(da.article)}`
        ) : (
          "Fournisseur et lignes dans un seul formulaire."
        )
      }
      icon={<ShoppingCart size={17} />}
      footer={
        editable ? (
          <>
            <span className="mr-auto text-[12.5px]">
              Total <span className="num font-semibold">{formatDa(total)}</span>
            </span>
            <Button variant="secondary" disabled={!fournisseur || valides.length === 0 || incompletes || saving !== null} onClick={() => void enregistrer(false)}>
              {saving === "brouillon" ? "…" : cf ? "Ajouter les lignes" : "Enregistrer le brouillon"}
            </Button>
            {can("ENVOYER_CF") && (
              <Button disabled={!peutEnvoyer || saving !== null} onClick={() => void enregistrer(true)}>
                <Send size={14} /> {saving === "envoi" ? "Envoi…" : "Envoyer"}
              </Button>
            )}
          </>
        ) : (
          <span className="mr-auto text-[12.5px]">
            Total <span className="num font-semibold">{formatDa(total)}</span>
          </span>
        )
      }
    >
      {cf && (
        <Tabs
          label="Commande fournisseur"
          value={onglet}
          onChange={setOnglet}
          items={[
            { value: "commande", label: "Commande" },
            { value: "receptions", label: "Réceptions", count: receptions.length },
            { value: "historique", label: "Historique" },
          ]}
        />
      )}

      {onglet === "commande" && (
        <>
          <DrawerSection title="Fournisseur">
            <select className={inputClass} value={fournisseur} onChange={(e) => setFournisseur(Number(e.target.value))} disabled={!!cf}>
              <option value={0}>Choisir un fournisseur…</option>
              {state.fournisseurs
                .filter((f) => f.actif || f.id === fournisseur)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
            </select>
          </DrawerSection>

          <DrawerSection title="Lignes">
            <div className="rounded-[9px] border border-line overflow-x-auto">
              <table className="w-full text-left min-w-[460px]">
                <thead>
                  <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-3 py-2 font-medium">Article</th>
                    <th className="px-3 py-2 font-medium text-right w-[110px]">Quantité</th>
                    <th className="px-3 py-2 font-medium text-right w-[120px]">Prix unitaire</th>
                    <th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {existantes.map((l) => (
                    <tr key={`e${l.id}`} className="border-b border-line">
                      <td className="px-3 py-2.5 text-[13px]">
                        {articleName(l.article)}
                        {num(l.quantite_recue) > 0 && <span className="block text-[11.5px] text-muted num">reçu {formatQty(num(l.quantite_recue), 2)}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] num">{formatQty(num(l.quantite_commandee), 2)}</td>
                      <td className="px-3 py-2.5 text-right text-[13px] num">{formatDa(num(l.prix_unitaire))}</td>
                      <td />
                    </tr>
                  ))}
                  {editable &&
                    lignes.map((l) => (
                      <tr key={l.cle} className="border-b border-line last:border-0">
                        <td className="px-2 py-1.5">
                          <select className={cn(inputClass, "h-9 text-[12.5px]")} value={l.article} onChange={(e) => maj(l.cle, { article: Number(e.target.value) })} aria-label="Article">
                            <option value={0}>Article…</option>
                            {articlesAchetables.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.code} · {a.designation}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="any" aria-label="Quantité" className={cn(inputClass, "h-9 text-right num")} value={l.qty} onChange={(e) => maj(l.cle, { qty: e.target.value })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="any" aria-label="Prix unitaire" className={cn(inputClass, "h-9 text-right num")} value={l.prix} onChange={(e) => maj(l.cle, { prix: e.target.value })} />
                        </td>
                        <td className="pr-2">
                          <button
                            type="button"
                            aria-label="Retirer la ligne"
                            onClick={() => setLignes((ls) => ls.filter((x) => x.cle !== l.cle))}
                            className="h-8 w-8 rounded-[6px] flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {existantes.length === 0 && !editable && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-[12.5px] text-muted">
                        Aucune ligne.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {editable && (
              <Button variant="ghost" className="h-8 px-2.5 text-[12.5px] self-start" onClick={() => setLignes((ls) => [...ls, { cle: Date.now(), article: 0, qty: "", prix: "" }])}>
                <Plus size={14} /> Ajouter une ligne
              </Button>
            )}
            {incompletes && <p className="text-[11.5px] text-warning">Complétez ou retirez les lignes incomplètes (article et quantité).</p>}
          </DrawerSection>
        </>
      )}

      {onglet === "receptions" && cf && (
        <DataTable
          emptyText="Aucune réception pour cette commande."
          columns={[
            { key: "d", label: "Date" },
            { key: "p", label: "Réceptionnée par" },
            { key: "c", label: "Conformité" },
            { key: "l", label: "Articles reçus" },
          ]}
          rows={receptions.map((r) => ({
            d: formatDateTime(r.date_reception),
            p: userName(r.receptionne_par),
            c: r.conforme ? <StatusBadge tone="success">Conforme</StatusBadge> : <StatusBadge tone="warning">Avec écart</StatusBadge>,
            l:
              state.lignesReception
                .filter((x) => x.reception === r.id)
                .map((x) => {
                  const lc = state.lignesCommandeFournisseur.find((y) => y.id === x.ligne_commande);
                  return `${lc ? articleName(lc.article) : "Ligne"} × ${formatQty(num(x.quantite_recue), 2)}`;
                })
                .join(" · ") || "—",
          }))}
        />
      )}

      {onglet === "historique" && cf && <Historique endpoint={endpoints.commandesFournisseur} id={cf.id} />}
    </Drawer>
  );
}

/** Demande d’achat saisie à la main (hors besoin calculé). */
export function NouvelleDaDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_DA", article, quantite_demandee: Number(qty), motif: motif.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouvelle demande d’achat"
      icon={<FilePlus2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!article || !(Number(qty) > 0) || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer la demande"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Demande">
        <Field label="Article">
          <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir…</option>
            {state.articles
              .filter((a) => a.actif)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.designation}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Quantité">
          <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Motif">
          <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}

/** Tiroir unique : lignes de la commande, « Qté reçue » pré-remplie avec le reste dû, écart en direct. */
export function ReceptionDrawer({ cf, onClose }: { cf: CommandeFournisseur; onClose: () => void }) {
  const { state, dispatch, articleName } = useStore();
  const lignes = state.lignesCommandeFournisseur.filter((l) => l.commande === cf.id);
  const reste = (l: (typeof lignes)[number]) => Math.max(0, num(l.quantite_commandee) - num(l.quantite_recue));
  const [recu, setRecu] = useState<Record<number, string>>(() => Object.fromEntries(lignes.map((l) => [l.id, String(reste(l))])));
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  const ecart = (l: (typeof lignes)[number]) => (Number(recu[l.id]) || 0) - reste(l);
  const aRecevoir = lignes.filter((l) => (Number(recu[l.id]) || 0) > 0);
  const conforme = lignes.every((l) => ecart(l) === 0);

  async function valider() {
    setSaving(true);
    const ok = await dispatch({
      type: "RECEVOIR_COMMANDE",
      commande: cf.id,
      conforme,
      observations: observations.trim(),
      lignes: aRecevoir.map((l) => ({ ligne_commande: l.id, quantite_recue: Number(recu[l.id]) })),
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={`Réceptionner ${cf.numero}`}
      subtitle={`Commandée le ${formatDate(cf.date_commande)} · ${STATUT_CF_LABEL[cf.statut]}`}
      icon={<PackageCheck size={17} />}
      footer={
        <>
          <span className="mr-auto text-[12px]">{conforme ? <span className="text-success font-medium">Conforme à la commande</span> : <span className="text-warning font-medium">Réception avec écart</span>}</span>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={aRecevoir.length === 0 || saving} onClick={() => void valider()}>
            {saving ? "Validation…" : "Valider la réception"}
          </Button>
        </>
      }
    >
      <div className="rounded-[9px] border border-line overflow-x-auto">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
              <th className="px-3 py-2 font-medium">Article</th>
              <th className="px-3 py-2 font-medium text-right">Reste dû</th>
              <th className="px-3 py-2 font-medium text-right">Qté reçue</th>
              <th className="px-3 py-2 font-medium text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[12.5px] text-muted">
                  Aucune ligne sur cette commande.
                </td>
              </tr>
            )}
            {lignes.map((l) => {
              const e = ecart(l);
              return (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="text-[13px] font-medium">{articleName(l.article)}</p>
                    <p className="text-[11.5px] text-muted num">
                      Commandé {formatQty(num(l.quantite_commandee), 2)} · déjà reçu {formatQty(num(l.quantite_recue), 2)}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[13px] num">{formatQty(reste(l), 2)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      aria-label={`Quantité reçue ${articleName(l.article)}`}
                      className="h-9 w-28 border border-line-strong rounded-[6px] px-2 text-[13px] text-right num bg-surface focus:border-primary outline-none"
                      value={recu[l.id] ?? ""}
                      onChange={(ev) => setRecu((m) => ({ ...m, [l.id]: ev.target.value }))}
                    />
                  </td>
                  <td className={cn("px-3 py-2.5 text-right text-[13px] num font-semibold", e === 0 ? "text-success" : e < 0 ? "text-warning" : "text-danger")}>
                    {e === 0 ? "✓" : `${e > 0 ? "+" : ""}${formatQty(e, 2)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Field label="Observations">
        <textarea className={cn(inputClass, "h-20 py-2 resize-none")} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder={conforme ? "Facultatif" : "Expliquez l’écart (casse, manquant…)"} />
      </Field>
    </Drawer>
  );
}
