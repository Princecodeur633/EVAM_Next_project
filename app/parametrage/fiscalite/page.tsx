"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/api/resources";
import { num } from "@/lib/utils";

export default function FiscalitePage() {
  const { state, canEditParam, dispatch, familleFiscaleName } = useStore();
  const canEdit = canEditParam("/parametrage/fiscalite");
  const [code, setCode] = useState("");
  const [famille, setFamille] = useState(0);
  const [nouvelleFamille, setNouvelleFamille] = useState("");
  const [tva, setTva] = useState("18");
  const [centimes, setCentimes] = useState("5");
  const [accise, setAccise] = useState("0");
  const [exonere, setExonere] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function createCode() {
    setBusy(true);
    setErr(null);
    try {
      await api.post(endpoints.codesFiscaux, {
        code: code.trim(),
        famille_fiscale: famille,
        exonere,
        taux_tva: tva,
        taux_centimes_additionnels: centimes,
        taux_accise: accise,
        sfec_actif: true,
        actif: true,
      });
      setCode("");
      setFamille(0);
      await dispatch({ type: "REFRESH" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title="Codes fiscaux"
        description="Matrice fiscale EVAM. Les taux ne se choisissent jamais à la vente : ils sont dérivés du code rattaché à l’article."
      />
      {canEdit && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Familles fiscales</h2>
          <Field label="Nouvelle famille fiscale">
            <input className={inputClass} value={nouvelleFamille} onChange={(e) => setNouvelleFamille(e.target.value)} placeholder="Ex : Jus EVAM sucré/aromatisé" />
          </Field>
          <Button
            disabled={!nouvelleFamille.trim()}
            onClick={() => {
              void dispatch({ type: "CREATE_VALEUR_LISTE", liste: "famille_fiscale", valeur: nouvelleFamille });
              setNouvelleFamille("");
            }}
          >
            Ajouter la famille
          </Button>
          <ul className="col-span-full flex flex-wrap gap-2">
            {state.famillesFiscales.map((f) => (
              <li key={f.id} className="flex items-center gap-1 rounded border border-line px-2 py-1 text-[12px]">
                <span className={f.actif ? "" : "line-through text-muted"}>{f.nom}</span>
                <button
                  className="text-primary text-[11px]"
                  onClick={() => void dispatch({ type: "TOGGLE_VALEUR_LISTE", liste: "famille_fiscale", id: f.id, actif: !f.actif })}
                >
                  {f.actif ? "désactiver" : "activer"}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {canEdit && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-end">
          <h2 className="col-span-full text-[13px] font-semibold">Nouveau code fiscal</h2>
          <Field label="Code">
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="EV-FISC-…" />
          </Field>
          <Field label="Famille fiscale">
            <select className={inputClass} value={famille} onChange={(e) => setFamille(Number(e.target.value))}>
              <option value={0}>—</option>
              {state.famillesFiscales.filter((f) => f.actif).map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </Field>
          <Field label="TVA %">
            <input className={inputClass} value={tva} onChange={(e) => setTva(e.target.value)} />
          </Field>
          <Field label="Centimes % (de la TVA)">
            <input className={inputClass} value={centimes} onChange={(e) => setCentimes(e.target.value)} />
          </Field>
          <Field label="Accise %">
            <input className={inputClass} value={accise} onChange={(e) => setAccise(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" checked={exonere} onChange={(e) => setExonere(e.target.checked)} />
            Exonéré de TVA
          </label>
          {err && <p className="col-span-full text-[13px] text-danger">{err}</p>}
          <Button disabled={busy || !code.trim() || !famille} onClick={() => void createCode()}>
            Créer le code fiscal
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "c", label: "Code" },
            { key: "f", label: "Famille" },
            { key: "t", label: "TVA" },
            { key: "a", label: "Accise" },
            { key: "ca", label: "Centimes" },
            { key: "e", label: "Exonéré" },
            { key: "x", label: "Actif" },
          ]}
          rows={state.codesFiscaux.map((c) => ({
            c: c.code,
            f: familleFiscaleName(c.famille_fiscale),
            t: `${num(c.taux_tva)} %`,
            a: `${num(c.taux_accise)} %`,
            ca: `${num(c.taux_centimes_additionnels)} %`,
            e: c.exonere ? "Oui" : "Non",
            x: c.actif ? "Oui" : "Non",
          }))}
        />
      </Panel>
    </div>
  );
}
