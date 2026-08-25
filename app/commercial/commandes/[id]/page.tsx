"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { OrderBadge } from "@/components/badges";
import { Button, Field, ORDER_STEPS, PageHeader, Panel, StatusStepper, inputClass } from "@/components/ui";
import { STATUT_FACTURE_LABEL, TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDa, formatQty, num } from "@/lib/utils";

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, clientName, articleName, produitsFinis, tarifFor, can } = useStore();
  const cmd = state.commandes.find((c) => c.id === Number(id));
  const lignes = state.lignesCommande.filter((l) => l.commande === Number(id));
  const facture = state.factures.find((f) => f.commande === Number(id));
  const [article, setArticle] = useState(produitsFinis[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  if (!cmd) return <p className="text-[13px] text-muted">Commande introuvable.</p>;
  const total = lignes.reduce((a, l) => a + num(l.quantite) * num(l.prix_unitaire), 0);
  const prix = tarifFor(article, cmd.client);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Commande"
        title={cmd.numero}
        status={<OrderBadge status={cmd.statut} />}
        description={`${clientName(cmd.client)} · ${TYPE_COMMANDE_LABEL[cmd.type_commande] ?? cmd.type_commande}`}
        actions={
          <>
            {cmd.statut === "BROUILLON" && can("CREATE_COMMANDE") && (
              <Button onClick={() => void dispatch({ type: "PATCH_COMMANDE", id: cmd.id, statut: "VALIDEE" })}>Valider</Button>
            )}
            {!facture && can("CREATE_FACTURE") && lignes.length > 0 && (
              <Button onClick={() => void dispatch({ type: "CREATE_FACTURE", commande: cmd.id, client: cmd.client, montant_total: total })}>
                Émettre facture
              </Button>
            )}
          </>
        }
      />
      <StatusStepper steps={ORDER_STEPS} current={cmd.statut} />
      {can("CREATE_COMMANDE") && (
        <Panel className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Article">
            <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))}>
              {produitsFinis.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
            </select>
          </Field>
          <Field label="Quantité"><input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></Field>
          <Field label="Prix unitaire"><input className={inputClass} readOnly value={prix} /></Field>
          <Button onClick={() => void dispatch({ type: "ADD_LIGNE_COMMANDE", commande: cmd.id, article, quantite: qty, prix_unitaire: prix || 0 })}>Ajouter ligne</Button>
        </Panel>
      )}
      <Panel className="p-4">
        <h2 className="text-[13px] font-semibold mb-2">Lignes · total {formatDa(total)}</h2>
        {lignes.map((l) => (
          <p key={l.id} className="text-[13px]">{articleName(l.article)} · {formatQty(num(l.quantite), 2)} × {formatDa(num(l.prix_unitaire))}</p>
        ))}
        {facture && <p className="text-[13px] mt-3">Facture {facture.numero} · {STATUT_FACTURE_LABEL[facture.statut] ?? facture.statut} · {formatDa(num(facture.montant_total))}</p>}
      </Panel>
    </div>
  );
}
