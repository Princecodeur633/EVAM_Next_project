"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_INV_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDate, formatQty, num } from "@/lib/utils";

export default function InventaireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, can, userName } = useStore();
  const inv = state.inventaires.find((i) => i.id === Number(id));
  const lines = state.lignesInventaire.filter((l) => l.inventaire === Number(id));
  const [article, setArticle] = useState(state.articles[0]?.id ?? 0);
  const [theo, setTheo] = useState(0);
  const [compte, setCompte] = useState(0);
  if (!inv) return <p className="text-[13px] text-muted">Inventaire introuvable.</p>;

  const depot = state.depots.find((d) => d.id === inv.depot);
  const ouvert = inv.statut === "EN_COURS";

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Inventaire"
        title={depot?.nom ?? "Inventaire"}
        description={`${STATUT_INV_LABEL[inv.statut] ?? inv.statut} · ${formatDate(inv.date_inventaire)} · par ${userName(inv.cree_par)}`}
        actions={
          ouvert && can("CLOTURER_INVENTAIRE") ? (
            <Button onClick={() => void dispatch({ type: "CLOTURER_INVENTAIRE", id: inv.id })}>Clôturer</Button>
          ) : null
        }
      />
      {ouvert && can("CREATE_INVENTAIRE") && (
        <Panel className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {state.articles.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Théorique">
            <input type="number" className={inputClass} value={theo} onChange={(e) => setTheo(Number(e.target.value))} />
          </Field>
          <Field label="Comptée">
            <input type="number" className={inputClass} value={compte} onChange={(e) => setCompte(Number(e.target.value))} />
          </Field>
          <Button onClick={() => void dispatch({ type: "ADD_LIGNE_INVENTAIRE", inventaire: inv.id, article, quantite_theorique: theo, quantite_comptee: compte })}>Ajouter ligne</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "t", label: "Théorique" }, { key: "c", label: "Comptée" }]}
          rows={lines.map((l) => ({ a: articleName(l.article), t: formatQty(num(l.quantite_theorique), 2), c: formatQty(num(l.quantite_comptee), 2) }))}
        />
      </Panel>
    </div>
  );
}
