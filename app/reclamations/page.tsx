"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_RECLAMATION_LABEL, TYPE_PROBLEME_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty, num } from "@/lib/utils";
import type { TypeProbleme } from "@/lib/types";

export default function ReclamationsPage() {
  const { state, dispatch, articleName, clientName, can, produitsFinis } = useStore();
  const [client, setClient] = useState(state.clients[0]?.id ?? 0);
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const [typeProbleme, setTypeProbleme] = useState<TypeProbleme>("PRODUIT_DEFECTUEUX");
  const [description, setDescription] = useState("");
  const [retourne, setRetourne] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Retours clients"
        title="Réclamations"
        description="Circuit après BL validé : réclamation → retour physique → contrôle → solution (remplacement / avoir / remboursement)."
      />
      {can("CREATE_RECLAMATION") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-end">
          <Field label="Client">
            <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))}>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.nom}</option>)}
            </select>
          </Field>
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Type de problème">
            <select className={inputClass} value={typeProbleme} onChange={(e) => setTypeProbleme(e.target.value as TypeProbleme)}>
              {(Object.keys(TYPE_PROBLEME_LABEL) as TypeProbleme[]).map((k) => (
                <option key={k} value={k}>{TYPE_PROBLEME_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" checked={retourne} onChange={(e) => setRetourne(e.target.checked)} />
            Produit retourné
          </label>
          <Button
            disabled={!client || !article || qty <= 0 || !description.trim()}
            onClick={() =>
              void dispatch({
                type: "CREATE_RECLAMATION",
                client,
                article,
                quantite: qty,
                type_probleme: typeProbleme,
                description: description.trim(),
                produit_retourne: retourne,
              })
            }
          >
            Ouvrir la réclamation
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Client" },
            { key: "a", label: "Article" },
            { key: "q", label: "Qté" },
            { key: "t", label: "Problème" },
            { key: "s", label: "Statut" },
            { key: "d", label: "Date" },
            { key: "x", label: "" },
          ]}
          rows={state.reclamations.map((r) => ({
            n: r.numero,
            c: clientName(r.client),
            a: articleName(r.article),
            q: formatQty(num(r.quantite), 2),
            t: TYPE_PROBLEME_LABEL[r.type_probleme] ?? r.type_probleme,
            s: STATUT_RECLAMATION_LABEL[r.statut] ?? r.statut,
            d: formatDateTime(r.date_creation),
            x: (
              <Link className="text-[13px] text-primary font-medium" href={`/reclamations/${r.id}`}>
                Ouvrir
              </Link>
            ),
          }))}
        />
      </Panel>
    </div>
  );
}
