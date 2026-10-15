"use client";

import { useState } from "react";
import { Plus, Undo2 } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { api, endpoints } from "@/lib/api";
import { MOTIF_RETOUR_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { MotifRetour } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

/**
 * Retours fournisseurs : marchandise reçue puis renvoyée (non conforme, endommagée, en trop, erreur
 * de référence). Le stock sort aussitôt (lots de la réception) ; un retour ne se modifie ni ne se supprime.
 */
export default function RetoursFournisseursPage() {
  const { state, can, articleName, userName, fournisseurName } = useStore();
  const [q, setQ] = useState("");
  const [creation, setCreation] = useState(false);
  const reception = (id: number) => state.receptions.find((r) => r.id === id);
  const commande = (receptionId: number) => state.commandesFournisseur.find((c) => c.id === reception(receptionId)?.commande);
  const rows = [...state.retoursFournisseur]
    .sort((a, b) => b.date_retour.localeCompare(a.date_retour))
    .filter((r) => matchSearch(q, articleName(r.article), commande(r.reception)?.numero, MOTIF_RETOUR_LABEL[r.motif], r.observations));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Achats"
        title="Retours fournisseurs"
        description="Renvoyer au fournisseur une marchandise reçue : la quantité sort du stock (lots de la réception) et le retour est tracé. On ne retourne que ce qui a été reçu dans la réception, moins ce qui a déjà été retourné."
        actions={
          can("CREATE_RETOUR_FOURNISSEUR") ? (
            <Button onClick={() => setCreation(true)}>
              <Plus size={15} /> Nouveau retour
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar shown={rows.length} total={state.retoursFournisseur.length} active={!!q} onReset={() => setQ("")}>
          <SearchInput value={q} onChange={setQ} placeholder="Article, commande, motif…" />
        </FilterBar>
        <DataTable
          emptyText="Aucun retour fournisseur."
          columns={[
            { key: "d", label: "Date" },
            { key: "c", label: "Commande / fournisseur" },
            { key: "a", label: "Article" },
            { key: "q", label: "Quantité", className: "text-right" },
            { key: "m", label: "Motif" },
            { key: "o", label: "Observations" },
            { key: "p", label: "Traité par" },
          ]}
          rows={rows.map((r) => {
            const cf = commande(r.reception);
            return {
              d: formatDateTime(r.date_retour),
              c: cf ? `${cf.numero} · ${fournisseurName(cf.fournisseur)}` : `Réception n°${r.reception}`,
              a: articleName(r.article),
              q: <span className="num">{formatQty(num(r.quantite_retournee), 3)}</span>,
              m: MOTIF_RETOUR_LABEL[r.motif] ?? r.motif,
              o: <span className="text-muted">{r.observations || "—"}</span>,
              p: userName(r.traite_par),
            };
          })}
        />
      </Panel>
      {creation && <NouveauRetourDrawer onClose={() => setCreation(false)} />}
    </div>
  );
}

function NouveauRetourDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, articleName, fournisseurName } = useStore();
  const [reception, setReception] = useState(0);
  const [article, setArticle] = useState(0);
  const [qty, setQty] = useState("");
  const [motif, setMotif] = useState<MotifRetour>("NON_CONFORME");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  // Articles reçus dans la réception choisie, avec ce qui reste retournable.
  const lignes = state.lignesReception.filter((l) => l.reception === reception);
  const recus = new Map<number, number>();
  for (const l of lignes) {
    const lc = state.lignesCommandeFournisseur.find((x) => x.id === l.ligne_commande);
    if (lc) recus.set(lc.article, (recus.get(lc.article) ?? 0) + num(l.quantite_recue));
  }
  const dejaRetourne = (a: number) =>
    state.retoursFournisseur.filter((r) => r.reception === reception && r.article === a).reduce((s, r) => s + num(r.quantite_retournee), 0);
  const retournable = article ? (recus.get(article) ?? 0) - dejaRetourne(article) : 0;
  const receptions = [...state.receptions].sort((a, b) => b.date_reception.localeCompare(a.date_reception));
  const libelleReception = (id: number) => {
    const r = state.receptions.find((x) => x.id === id);
    const cf = state.commandesFournisseur.find((c) => c.id === r?.commande);
    return `${cf?.numero ?? `Réception n°${id}`}${cf ? ` · ${fournisseurName(cf.fournisseur)}` : ""}${r ? ` · ${formatDateTime(r.date_reception)}` : ""}`;
  };

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () => api.post(endpoints.retoursFournisseur, { reception, article, quantite_retournee: Number(qty), motif, observations: obs.trim() }),
      refresh: ["retoursFournisseur", "stock", "lotsMatieres", "mouvements"],
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau retour fournisseur"
      subtitle="La quantité sort du stock dès l’enregistrement ; un retour ne se modifie plus."
      icon={<Undo2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!reception || !article || !(Number(qty) > 0) || Number(qty) > retournable || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Enregistrer le retour"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Réception concernée">
        <Field label="Réception">
          <select
            className={inputClass}
            value={reception}
            onChange={(e) => {
              setReception(Number(e.target.value));
              setArticle(0);
            }}
            autoFocus
          >
            <option value={0}>Choisir une réception…</option>
            {receptions.map((r) => (
              <option key={r.id} value={r.id}>
                {libelleReception(r.id)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Article retourné">
          <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))} disabled={!reception}>
            <option value={0}>{reception ? "Choisir un article reçu…" : "Choisissez d’abord la réception"}</option>
            {[...recus.keys()].map((a) => (
              <option key={a} value={a}>
                {articleName(a)} · reçu {formatQty(recus.get(a) ?? 0, 3)}
              </option>
            ))}
          </select>
        </Field>
      </DrawerSection>
      <DrawerSection title="Retour" hint={article ? `Encore retournable : ${formatQty(retournable, 3)} (dans l’unité de la commande).` : undefined}>
        <Field label="Quantité retournée">
          <input type="number" min="0" step="any" className={cn(inputClass, "num text-right", Number(qty) > retournable && "border-danger")} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Motif">
          <select className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value as MotifRetour)}>
            {(Object.keys(MOTIF_RETOUR_LABEL) as MotifRetour[]).map((m) => (
              <option key={m} value={m}>
                {MOTIF_RETOUR_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Observations">
          <textarea className={cn(inputClass, "h-20 py-2")} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Bouchons fendus, carton écrasé…" />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
