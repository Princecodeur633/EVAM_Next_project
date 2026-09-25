"use client";

import Link from "next/link";
import { OfBadge } from "@/components/badges";
import { DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime, formatQty, num } from "@/lib/utils";
import type { StatutOF } from "@/lib/types";

/** OF dont la production est terminée (ou déjà en contrôle/clôturés) : c'est
 * la file d'attente de la Qualité, indépendamment du planning de production. */
const STATUTS_RECUS: StatutOF[] = ["PRODUCTION_TERMINEE", "EN_CONTROLE", "CLOTURE"];

export default function OfRecusQualitePage() {
  const { state, articleName, userName } = useStore();
  const ofRecus = state.ofList
    .filter((o) => STATUTS_RECUS.includes(o.statut))
    .sort((a, b) => (a.date_fin ?? a.date_creation) < (b.date_fin ?? b.date_creation) ? 1 : -1);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Qualité"
        title="OF reçus"
        description="Ordres de fabrication dont la production est terminée : à contrôler puis à transformer en lot depuis l’écran Lots."
      />
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "Numéro" },
            { key: "a", label: "Article" },
            { key: "q", label: "Quantité produite" },
            { key: "r", label: "Responsable" },
            { key: "st", label: "Statut OF" },
            { key: "l", label: "Lot" },
            { key: "d", label: "Fin de production" },
          ]}
          rows={ofRecus.map((o) => {
            const aUnLot = state.lots.some((l) => l.ordre_fabrication === o.id);
            return {
              n: <span className="num font-medium">{o.numero}</span>,
              a: articleName(o.article),
              q: <span className="num">{formatQty(num(o.quantite_a_produire), 2)}</span>,
              r: userName(o.responsable),
              st: <OfBadge status={o.statut} />,
              l: aUnLot ? (
                <StatusBadge tone="success">Créé</StatusBadge>
              ) : (
                <Link href="/production/qualite" className="text-primary text-[12px] font-medium">
                  À créer →
                </Link>
              ),
              d: o.date_fin ? formatDateTime(o.date_fin) : "—",
            };
          })}
        />
      </Panel>
    </div>
  );
}
