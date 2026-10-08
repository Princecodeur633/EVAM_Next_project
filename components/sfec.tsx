"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Button, StatusBadge } from "@/components/ui";
import { actions } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Facture } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STATUT: Record<NonNullable<Facture["sfec_statut"]>, { label: string; tone: "warning" | "success" | "danger" }> = {
  EN_ATTENTE: { label: "Non certifiée", tone: "warning" },
  CERTIFIEE: { label: "Certifiée SFEC", tone: "success" },
  ERREUR: { label: "Erreur SFEC", tone: "danger" },
};

/**
 * Facture normalisée (SFEC) : statut de certification, code et compteurs reçus. La demande de
 * certification est refusée par le backend tant que la SFEC n'est pas activée (Documents).
 */
export function SfecFacture({ facture }: { facture: Facture }) {
  const { dispatch, can } = useStore();
  const [busy, setBusy] = useState(false);
  if (!facture.sfec_statut) return null;
  const s = STATUT[facture.sfec_statut];
  const certifiee = facture.sfec_statut === "CERTIFIEE";

  return (
    <div className="border-t border-line pt-3 space-y-1.5 text-[12.5px]">
      <div className="flex items-center gap-2">
        <span className="text-muted flex-1">Facture normalisée</span>
        <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
      </div>
      {certifiee && (
        <dl className="space-y-0.5">
          {facture.sfec_code && <Info k="Code" v={facture.sfec_code} />}
          {facture.sfec_nim && <Info k="NIM" v={facture.sfec_nim} />}
          {facture.sfec_compteurs && <Info k="Compteurs" v={facture.sfec_compteurs} />}
          {facture.sfec_date && <Info k="Certifiée le" v={formatDateTime(facture.sfec_date)} />}
        </dl>
      )}
      {facture.sfec_message && !certifiee && <p className="text-danger">{facture.sfec_message}</p>}
      {!certifiee && can("CERTIFIER_FACTURE") && (
        <Button
          variant="secondary"
          className="h-8 px-3 text-[12px]"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await dispatch({ type: "EXEC", run: () => actions.certifierFacture(facture.id), refresh: ["factures"] });
            setBusy(false);
          }}
        >
          <BadgeCheck size={14} /> {facture.sfec_statut === "ERREUR" ? "Relancer la certification" : "Certifier (SFEC)"}
        </Button>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="num text-right break-all">{v}</dd>
    </div>
  );
}
