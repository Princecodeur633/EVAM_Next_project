"use client";

import { useState } from "react";
import { Panel, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function ParametresComptablesPage() {
  const { state, dispatch, can } = useStore();
  const writable = can("PATCH_COMPTE_PARAMETRE");
  const [numeros, setNumeros] = useState<Record<number, string>>({});
  const [seuils, setSeuils] = useState<Record<number, string>>({});

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Comptabilité"
        title="Paramètres comptables"
        description="Plan de comptes utilisé par les écritures automatiques (valeurs SYSCOHADA proposées par défaut) et seuils des contrôles d'anomalies — modifiables sans intervention technique."
      />
      <Panel className="p-4 space-y-2">
        <h2 className="text-[13px] font-semibold">Plan de comptes</h2>
        <div className="divide-y divide-line">
          {state.comptesParametres.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span>{c.role}</span>
              {writable ? (
                <span className="flex items-center gap-2">
                  <input
                    className="h-8 w-28 border border-line rounded px-2 text-[12px] text-right num"
                    value={numeros[c.id] ?? c.numero}
                    onChange={(e) => setNumeros((m) => ({ ...m, [c.id]: e.target.value }))}
                  />
                  <button
                    className="text-primary text-[12px]"
                    onClick={() => void dispatch({ type: "PATCH_COMPTE_PARAMETRE", id: c.id, numero: numeros[c.id] ?? c.numero })}
                  >
                    Enregistrer
                  </button>
                </span>
              ) : (
                <span className="num">{c.numero}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="p-4 space-y-2">
        <h2 className="text-[13px] font-semibold">Seuils des contrôles automatiques</h2>
        <div className="divide-y divide-line">
          {state.seuilsControles.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span>
                {s.libelle}
                <span className="text-muted"> (entre {s.minimum} et {s.maximum})</span>
              </span>
              {writable ? (
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    className="h-8 w-24 border border-line rounded px-2 text-[12px] text-right num"
                    value={seuils[s.id] ?? s.valeur}
                    onChange={(e) => setSeuils((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                  <button
                    className="text-primary text-[12px]"
                    onClick={() => void dispatch({ type: "PATCH_SEUIL_CONTROLE", id: s.id, valeur: Number(seuils[s.id] ?? s.valeur) })}
                  >
                    Enregistrer
                  </button>
                </span>
              ) : (
                <span className="num">{s.valeur}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
