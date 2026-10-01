"use client";

import { useEffect, useState } from "react";
import { actions } from "@/lib/api";
import type { HistoriqueLigne } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Panel } from "./ui";

/**
 * Onglet « Historique » d'un document : création et changements de statut,
 * qui et quand (apps/core/historique.py, alimenté automatiquement — aucune
 * saisie). `endpoint` est la base de collection (ex. endpoints.commandes),
 * le composant appelle GET {endpoint}{id}/historique/.
 */
export function Historique({ endpoint, id }: { endpoint: string; id: number }) {
  const [lignes, setLignes] = useState<HistoriqueLigne[] | null>(null);

  useEffect(() => {
    let annule = false;
    setLignes(null);
    void actions.historique(endpoint, id).then((data) => {
      if (!annule) setLignes(data);
    });
    return () => {
      annule = true;
    };
  }, [endpoint, id]);

  return (
    <Panel className="p-4 space-y-2">
      <h2 className="text-[13px] font-semibold">Historique</h2>
      {lignes === null ? (
        <p className="text-[13px] text-muted">Chargement…</p>
      ) : lignes.length === 0 ? (
        <p className="text-[13px] text-muted">Aucun historique.</p>
      ) : (
        <div className="divide-y divide-line">
          {lignes.map((l, i) => (
            <div key={i} className="py-2 text-[13px] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span>
                {l.action}
                {l.nouveau_statut && (
                  <span className="text-muted">
                    {" "}
                    {l.ancien_statut ? `${l.ancien_statut} → ${l.nouveau_statut}` : l.nouveau_statut}
                  </span>
                )}
              </span>
              <span className="text-muted text-[12px]">{l.par} · {formatDateTime(l.date)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
