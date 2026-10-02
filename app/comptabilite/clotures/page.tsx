"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { etatCloture, motifBlocage, periodeACloturer } from "@/components/comptabilite";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { TYPE_CLOTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { TypeCloture } from "@/lib/types";

export default function CloturesPage() {
  const { state, dispatch, can, userName } = useStore();
  const [periode, setPeriode] = useState(() => periodeACloturer(state));
  const [type, setType] = useState<TypeCloture>("MENSUELLE");
  // Clôture mensuelle : bloquée tant que l’étape précédente de la frise n’est pas remplie.
  const motif = type === "MENSUELLE" && /^\d{4}-\d{2}$/.test(periode.trim()) ? motifBlocage(etatCloture(state, periode.trim()), "cloture") : null;
  const dejaCloturee = state.clotures.some((c) => c.periode === periode.trim());

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Clôtures"
        description="Verrouillez une période mensuelle (AAAA-MM) ou annuelle (AAAA). Après clôture, les documents de la période ne se modifient plus."
      />
      {can("CREATE_CLOTURE") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Période">
            <input className={inputClass} value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="2026-08" />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeCloture)}>
              {(Object.keys(TYPE_CLOTURE_LABEL) as TypeCloture[]).map((k) => (
                <option key={k} value={k}>{TYPE_CLOTURE_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <Button disabled={!periode.trim() || !!motif || dejaCloturee} title={motif ?? undefined} onClick={() => void dispatch({ type: "CREATE_CLOTURE", periode: periode.trim(), type_cloture: type })}>
            <Lock size={14} /> Clôturer la période
          </Button>
          {(motif || dejaCloturee) && (
            <p className="col-span-full text-[12px] text-warning flex items-start gap-1.5">
              <Lock size={12} className="mt-0.5 shrink-0" /> {dejaCloturee ? "Cette période est déjà clôturée." : motif}
            </p>
          )}
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[{ key: "p", label: "Période" }, { key: "t", label: "Type" }, { key: "v", label: "Validée par" }, { key: "d", label: "Date" }]}
          emptyText="Aucune période clôturée."
          rows={[...state.clotures].sort((a, b) => b.periode.localeCompare(a.periode)).map((c) => ({
            p: c.periode,
            t: TYPE_CLOTURE_LABEL[c.type_cloture] ?? c.type_cloture,
            v: userName(c.valide_par),
            d: formatDateTime(c.date_cloture),
          }))}
        />
      </Panel>
    </div>
  );
}
