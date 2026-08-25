"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";

export default function ReceptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, can, userName } = useStore();
  const rec = state.receptions.find((r) => r.id === Number(id));
  const lines = state.lignesReception.filter((l) => l.reception === Number(id));
  const cfLines = rec ? state.lignesCommandeFournisseur.filter((l) => l.commande === rec.commande) : [];
  const [ligne, setLigne] = useState(cfLines[0]?.id ?? 0);
  const [qty, setQty] = useState(0);
  if (!rec) return <p className="text-[13px] text-muted">Réception introuvable.</p>;
  const cf = state.commandesFournisseur.find((c) => c.id === rec.commande);
  const ligneArticle = (ligneId: number) => {
    const l = state.lignesCommandeFournisseur.find((x) => x.id === ligneId);
    return l ? articleName(l.article) : "Ligne";
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Réception"
        title={cf?.numero ?? "Réception"}
        description={rec.observations || `Réceptionnée par ${userName(rec.receptionne_par)}`}
      />
      {can("CREATE_RECEPTION") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Ligne commande">
            <select className={inputClass} value={ligne} onChange={(e) => setLigne(Number(e.target.value))}>
              {cfLines.map((l) => <option key={l.id} value={l.id}>{articleName(l.article)} · cmd {formatQty(num(l.quantite_commandee), 2)}</option>)}
            </select>
          </Field>
          <Field label="Qté reçue">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Button disabled={!ligne} onClick={() => void dispatch({ type: "ADD_LIGNE_RECEPTION", reception: rec.id, ligne_commande: ligne, quantite_recue: qty })}>Ajouter</Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "a", label: "Article" }, { key: "q", label: "Qté reçue" }]}
          rows={lines.map((l) => ({ l: ligneArticle(l.ligne_commande), q: formatQty(num(l.quantite_recue), 2) }))}
        />
      </Panel>
    </div>
  );
}
