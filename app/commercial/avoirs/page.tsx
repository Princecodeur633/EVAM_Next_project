"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { STATUT_AVOIR_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime, formatMoney, num } from "@/lib/utils";

export default function AvoirsPage() {
  const { state, dispatch, clientName, can } = useStore();
  const [client, setClient] = useState(state.clients[0]?.id ?? 0);
  const [montant, setMontant] = useState(0);
  const [motif, setMotif] = useState("");
  const [factureOrigine, setFactureOrigine] = useState(0);
  const [utiliserId, setUtiliserId] = useState(0);
  const [factureUtil, setFactureUtil] = useState(0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Commercial"
        title="Avoirs"
        description="Crédits clients à valoir sur une prochaine facture. Les taxes restent figées sur les lignes de facture d’origine."
      />
      {can("CREATE_AVOIR") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Client">
            <select className={inputClass} value={client} onChange={(e) => setClient(Number(e.target.value))}>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.nom}</option>)}
            </select>
          </Field>
          <Field label="Montant">
            <input type="number" className={inputClass} value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
          </Field>
          <Field label="Facture d’origine (optionnel)">
            <select className={inputClass} value={factureOrigine} onChange={(e) => setFactureOrigine(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.factures.filter((f) => f.client === client).map((f) => (
                <option key={f.id} value={f.id}>{f.numero}</option>
              ))}
            </select>
          </Field>
          <Field label="Motif">
            <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Field>
          <Button
            disabled={!client || montant <= 0 || !motif.trim()}
            onClick={() =>
              void dispatch({
                type: "CREATE_AVOIR",
                client,
                montant,
                motif: motif.trim(),
                facture_origine: factureOrigine || undefined,
              })
            }
          >
            Émettre l’avoir
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Client" },
            { key: "m", label: "Montant" },
            { key: "s", label: "Statut" },
            { key: "d", label: "Date" },
            { key: "x", label: "Motif" },
          ]}
          rows={state.avoirs.map((a) => ({
            n: a.numero,
            c: clientName(a.client),
            m: formatMoney(num(a.montant)),
            s: STATUT_AVOIR_LABEL[a.statut] ?? a.statut,
            d: formatDateTime(a.date_creation),
            x: a.motif,
          }))}
        />
      </Panel>
      {can("UTILISER_AVOIR") && (
        <Panel className="p-4 grid sm:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Utiliser un avoir sur une facture</h2>
          <Field label="Avoir émis">
            <select className={inputClass} value={utiliserId} onChange={(e) => setUtiliserId(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.avoirs.filter((a) => a.statut === "EMIS").map((a) => (
                <option key={a.id} value={a.id}>{a.numero} · {formatMoney(num(a.montant))}</option>
              ))}
            </select>
          </Field>
          <Field label="Facture">
            <select className={inputClass} value={factureUtil} onChange={(e) => setFactureUtil(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.factures.map((f) => (
                <option key={f.id} value={f.id}>{f.numero}</option>
              ))}
            </select>
          </Field>
          <Button
            disabled={!utiliserId || !factureUtil}
            onClick={() => void dispatch({ type: "UTILISER_AVOIR", id: utiliserId, facture: factureUtil })}
          >
            Appliquer
          </Button>
        </Panel>
      )}
    </div>
  );
}
