"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { ETAPE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatQty, num } from "@/lib/utils";
import type { Etape } from "@/lib/types";

export default function SuiviPage() {
  const { state, dispatch, ofNumero, can, currentUser } = useStore();
  const [ofId, setOfId] = useState(state.ofList[0]?.id ?? 0);
  const [etape, setEtape] = useState<Etape>("CAPTAGE");
  const [qty, setQty] = useState(0);

  const [sessionOf, setSessionOf] = useState(state.ofList[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heureDebut, setHeureDebut] = useState("08:00");
  const [equipe, setEquipe] = useState("");
  const [qEntree, setQEntree] = useState(0);
  const [qProduite, setQProduite] = useState(0);
  const [qConforme, setQConforme] = useState(0);
  const [qRejetee, setQRejetee] = useState(0);
  const [arrets, setArrets] = useState("");
  const [incidents, setIncidents] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Atelier" title="Étapes de production" description="Saisissez captage, traitement, soufflage, embouteillage, étiquetage et conditionnement." />
      {can("CREATE_ETAPE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="OF">
            <select className={inputClass} value={ofId} onChange={(e) => setOfId(Number(e.target.value))}>
              {state.ofList.map((o) => <option key={o.id} value={o.id}>{o.numero}</option>)}
            </select>
          </Field>
          <Field label="Étape">
            <select className={inputClass} value={etape} onChange={(e) => setEtape(e.target.value as Etape)}>
              {(Object.keys(ETAPE_LABEL) as Etape[]).map((k) => <option key={k} value={k}>{ETAPE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Quantité produite">
            <input type="number" className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Button disabled={!ofId || !currentUser} onClick={() => void dispatch({ type: "CREATE_ETAPE", ordre_fabrication: ofId, etape, quantite_produite: qty })}>
            Enregistrer
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "of", label: "OF" }, { key: "e", label: "Étape" }, { key: "q", label: "Qté" }, { key: "o", label: "Observations" }]}
          rows={state.etapes.map((e) => ({ of: ofNumero(e.ordre_fabrication), e: ETAPE_LABEL[e.etape], q: formatQty(num(e.quantite_produite), 2), o: e.observations || "—" }))}
        />
      </Panel>

      <PageHeader eyebrow="Atelier" title="Suivi de production" description="Sessions horodatées : quantités entrées/produites/conformes/rejetées, arrêts et incidents." />
      {can("CREATE_SUIVI_PROD") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="OF">
            <select className={inputClass} value={sessionOf} onChange={(e) => setSessionOf(Number(e.target.value))}>
              {state.ofList.map((o) => <option key={o.id} value={o.id}>{o.numero}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Heure début"><input type="time" className={inputClass} value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} /></Field>
          <Field label="Équipe"><input className={inputClass} value={equipe} onChange={(e) => setEquipe(e.target.value)} /></Field>
          <Field label="Qté entrée"><input type="number" className={inputClass} value={qEntree} onChange={(e) => setQEntree(Number(e.target.value))} /></Field>
          <Field label="Qté produite"><input type="number" className={inputClass} value={qProduite} onChange={(e) => setQProduite(Number(e.target.value))} /></Field>
          <Field label="Qté conforme"><input type="number" className={inputClass} value={qConforme} onChange={(e) => setQConforme(Number(e.target.value))} /></Field>
          <Field label="Qté rejetée"><input type="number" className={inputClass} value={qRejetee} onChange={(e) => setQRejetee(Number(e.target.value))} /></Field>
          <Field label="Arrêts"><input className={inputClass} placeholder="Ex : arrêt 15 min réglage" value={arrets} onChange={(e) => setArrets(e.target.value)} /></Field>
          <Field label="Incidents"><input className={inputClass} value={incidents} onChange={(e) => setIncidents(e.target.value)} /></Field>
          <Button
            disabled={!sessionOf || qEntree <= 0}
            onClick={() =>
              void dispatch({
                type: "CREATE_SUIVI_PROD",
                ordre_fabrication: sessionOf,
                date,
                heure_debut: `${heureDebut}:00`,
                quantite_entree: qEntree,
                quantite_produite: qProduite || undefined,
                quantite_conforme: qConforme || undefined,
                quantite_rejetee: qRejetee || undefined,
                equipe: equipe || undefined,
                arrets: arrets || undefined,
                incidents: incidents || undefined,
              })
            }
          >
            Enregistrer la session
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "of", label: "OF" },
            { key: "d", label: "Date" },
            { key: "h", label: "Début" },
            { key: "eq", label: "Équipe" },
            { key: "e", label: "Entrée" },
            { key: "p", label: "Produite" },
            { key: "c", label: "Conforme" },
            { key: "r", label: "Rejetée" },
          ]}
          rows={state.suivisProduction.map((s) => ({
            of: ofNumero(s.ordre_fabrication),
            d: s.date,
            h: s.heure_debut,
            eq: s.equipe || "—",
            e: formatQty(num(s.quantite_entree), 2),
            p: s.quantite_produite != null ? formatQty(num(s.quantite_produite), 2) : "—",
            c: s.quantite_conforme != null ? formatQty(num(s.quantite_conforme), 2) : "—",
            r: s.quantite_rejetee != null ? formatQty(num(s.quantite_rejetee), 2) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
