"use client";

import { useState } from "react";
import { FileSignature, Plus } from "lucide-react";
import { Button, DataTable, Field, Panel, StatusBadge, inputClass } from "@/components/ui";
import { api, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Client, ContratClient } from "@/lib/types";
import { cn, formatDa, formatDate, num } from "@/lib/utils";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function etat(c: ContratClient): { label: string; tone: "success" | "info" | "neutral" } {
  const j = aujourdhui();
  if (c.date_debut > j) return { label: "À venir", tone: "info" };
  if (c.date_fin && c.date_fin < j) return { label: "Terminé", tone: "neutral" };
  return { label: "En vigueur", tone: "success" };
}

/**
 * Contrats du client : une vente « Contrat » exige un contrat en vigueur. Les tarifs négociés dans
 * le contrat priment sur le tarif propre au client et sur le tarif public ; la facture d'une vente
 * sous contrat est émise automatiquement après la livraison.
 */
export function ContratsClient({ client }: { client: Client }) {
  const { state, dispatch, can } = useStore();
  const writable = can("GERER_CONTRATS_CLIENTS");
  const contrats = state.contratsClients.filter((c) => c.client === client.id).sort((a, b) => b.date_debut.localeCompare(a.date_debut));
  const [debut, setDebut] = useState(aujourdhui());
  const [fin, setFin] = useState("");
  const [conditions, setConditions] = useState("");
  const [busy, setBusy] = useState(false);

  async function exec(run: () => Promise<unknown>, refresh: ("contratsClients" | "tarifs")[] = ["contratsClients"]) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run, refresh });
    setBusy(false);
    return ok;
  }

  return (
    <Panel className="p-4 space-y-3">
      <div>
        <h2 className="text-[13px] font-semibold flex items-center gap-2">
          <FileSignature size={15} className="text-muted" /> Contrats
        </h2>
        <p className="text-[12px] text-muted">
          Une vente « Contrat » n’est possible qu’avec un contrat en vigueur. Ses tarifs priment sur le tarif du client et le tarif public ; la facture est émise
          automatiquement après la livraison.
        </p>
      </div>

      {contrats.length === 0 ? (
        <p className="text-[12.5px] text-muted">Aucun contrat : ce client achète au comptant.</p>
      ) : (
        <ul className="space-y-3">
          {contrats.map((c) => (
            <ContratLigne key={c.id} contrat={c} writable={writable} busy={busy} exec={exec} />
          ))}
        </ul>
      )}

      {writable && (
        <div className="rounded-[9px] border border-primary/30 bg-primary-soft/30 p-3 grid sm:grid-cols-[150px_150px_minmax(0,1fr)_auto] gap-2 items-end">
          <Field label="Début">
            <input type="date" className={inputClass} value={debut} onChange={(e) => setDebut(e.target.value)} />
          </Field>
          <Field label="Fin (facultatif)">
            <input type="date" className={inputClass} min={debut} value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
          <Field label="Conditions particulières">
            <input className={inputClass} value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </Field>
          <Button
            disabled={!debut || (!!fin && fin < debut) || busy}
            onClick={async () => {
              const ok = await exec(() =>
                api.post(endpoints.contratsClients, { client: client.id, date_debut: debut, date_fin: fin || null, conditions: conditions.trim() }),
              );
              if (ok) {
                setFin("");
                setConditions("");
              }
            }}
          >
            <Plus size={14} /> Nouveau contrat
          </Button>
        </div>
      )}
    </Panel>
  );
}

function ContratLigne({
  contrat,
  writable,
  busy,
  exec,
}: {
  contrat: ContratClient;
  writable: boolean;
  busy: boolean;
  exec: (run: () => Promise<unknown>, refresh?: ("contratsClients" | "tarifs")[]) => Promise<boolean>;
}) {
  const { state, articleName, produitsFinis } = useStore();
  const e = etat(contrat);
  const tarifs = state.tarifs.filter((t) => t.contrat === contrat.id);
  const [article, setArticle] = useState(0);
  const [prix, setPrix] = useState("");
  const [debut, setDebut] = useState(contrat.date_debut > aujourdhui() ? contrat.date_debut : aujourdhui());

  return (
    <li className="rounded-[9px] border border-line overflow-hidden">
      <div className="px-3 py-2.5 flex flex-wrap items-center gap-2 bg-surface-2/50 border-b border-line">
        <StatusBadge tone={e.tone}>{e.label}</StatusBadge>
        <span className="text-[13px] font-medium">
          Du {formatDate(contrat.date_debut)} {contrat.date_fin ? `au ${formatDate(contrat.date_fin)}` : "· sans date de fin"}
        </span>
        {contrat.conditions && <span className="text-[12px] text-muted">· {contrat.conditions}</span>}
        {writable && e.label === "En vigueur" && (
          <Button
            variant="ghost"
            className="h-7 px-2 text-[12px] ml-auto text-danger"
            disabled={busy}
            onClick={() => void exec(() => api.patch(`${endpoints.contratsClients}${contrat.id}/`, { date_fin: aujourdhui() }))}
          >
            Terminer aujourd’hui
          </Button>
        )}
      </div>
      <DataTable
        emptyText="Aucun tarif négocié : le tarif du client ou le tarif public s’applique."
        columns={[
          { key: "a", label: "Article" },
          { key: "p", label: "Prix négocié", className: "text-right" },
          { key: "d", label: "Début" },
          { key: "f", label: "Fin" },
        ]}
        rows={tarifs.map((t) => ({
          a: articleName(t.article),
          p: <span className="num">{formatDa(num(t.prix_unitaire))}</span>,
          d: formatDate(t.date_debut_validite),
          f: t.date_fin_validite ? formatDate(t.date_fin_validite) : "—",
        }))}
      />
      {writable && e.label !== "Terminé" && (
        <div className="px-3 py-2.5 border-t border-line grid sm:grid-cols-[minmax(0,1fr)_120px_150px_auto] gap-2 items-end">
          <select aria-label="Article du tarif" className={cn(inputClass, "h-9")} value={article} onChange={(ev) => setArticle(Number(ev.target.value))}>
            <option value={0}>Produit fini…</option>
            {produitsFinis.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
          <input type="number" min="0" step="any" aria-label="Prix négocié" placeholder="Prix" className={cn(inputClass, "h-9 num text-right")} value={prix} onChange={(ev) => setPrix(ev.target.value)} />
          <input type="date" aria-label="Début de validité" className={cn(inputClass, "h-9")} value={debut} onChange={(ev) => setDebut(ev.target.value)} />
          <Button
            className="h-9"
            disabled={!article || !(Number(prix) > 0) || !debut || busy}
            onClick={async () => {
              const ok = await exec(
                () =>
                  api.post(endpoints.tarifs, {
                    article,
                    client: contrat.client,
                    contrat: contrat.id,
                    prix_unitaire: Number(prix),
                    date_debut_validite: debut,
                    date_fin_validite: contrat.date_fin,
                  }),
                ["tarifs"],
              );
              if (ok) {
                setArticle(0);
                setPrix("");
              }
            }}
          >
            <Plus size={14} /> Tarif
          </Button>
        </div>
      )}
    </li>
  );
}
