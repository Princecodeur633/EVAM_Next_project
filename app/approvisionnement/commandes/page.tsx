"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_CF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function CommandesFournisseurPage() {
  const { state, dispatch, fournisseurName, articleName, can } = useStore();
  const [fournisseur, setFournisseur] = useState(state.fournisseurs[0]?.id ?? 0);
  const [da, setDa] = useState<number>(0);
  const [cmd, setCmd] = useState(state.commandesFournisseur[0]?.id ?? 0);
  const [article, setArticle] = useState(state.articles[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  const [prix, setPrix] = useState(0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Achats" title="Commandes fournisseurs" description="Envoyez les commandes, puis suivez les réceptions partielles ou complètes." />
      {can("CREATE_CF") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Fournisseur">
            <select className={inputClass} value={fournisseur} onChange={(e) => setFournisseur(Number(e.target.value))}>
              {state.fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </Field>
          <Field label="Demande d'achat (optionnel)">
            <select className={inputClass} value={da} onChange={(e) => setDa(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.demandesAchat.filter((d) => d.statut === "APPROUVEE").map((d) => (
                <option key={d.id} value={d.id}>{articleName(d.article)} · {formatQty(num(d.quantite_demandee), 2)}</option>
              ))}
            </select>
          </Field>
          <Button disabled={!fournisseur} onClick={() => void dispatch({ type: "CREATE_CF", fournisseur, demande_achat: da || undefined })}>Créer commande</Button>
        </Panel>
      )}
      {can("CREATE_CF") && (
        <Panel className="p-4 grid sm:grid-cols-5 gap-3 items-end">
          <Field label="Commande">
            <select className={inputClass} value={cmd} onChange={(e) => setCmd(Number(e.target.value))}>
              {state.commandesFournisseur.map((c) => <option key={c.id} value={c.id}>{c.numero}</option>)}
            </select>
          </Field>
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {state.articles.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Qté"><input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></Field>
          <Field label="Prix"><input type="number" className={inputClass} value={prix} onChange={(e) => setPrix(Number(e.target.value))} /></Field>
          <Button disabled={!cmd} onClick={() => void dispatch({ type: "ADD_LIGNE_CF", commande: cmd, article, quantite_commandee: qty, prix_unitaire: prix })}>Ajouter ligne</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "f", label: "Fournisseur" }, { key: "s", label: "Statut" }, { key: "l", label: "Lignes" }, { key: "act", label: "" }]}
          rows={state.commandesFournisseur.map((c) => ({
            n: c.numero,
            f: fournisseurName(c.fournisseur),
            s: <StatusBadge tone="info">{STATUT_CF_LABEL[c.statut]}</StatusBadge>,
            l: state.lignesCommandeFournisseur.filter((l) => l.commande === c.id).map((l) => `${articleName(l.article)} × ${formatQty(num(l.quantite_commandee), 2)}`).join(" · ") || "—",
            act: c.statut === "BROUILLON" && can("ENVOYER_CF") ? (
              <button className="text-primary text-[12px]" onClick={() => void dispatch({ type: "ENVOYER_CF", id: c.id })}>Envoyer</button>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
