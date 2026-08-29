"use client";

import { useParams } from "next/navigation";
import { LotBadge } from "@/components/badges";
import { Button, Field, Guard, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDate, formatQty, num } from "@/lib/utils";
import { useState } from "react";

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, ofNumero, can, userName } = useStore();
  const lot = state.lots.find((l) => l.id === Number(id));
  const [obs, setObs] = useState("");
  if (!lot) return <p className="text-[13px] text-muted">Lot introuvable.</p>;
  const ctrl = state.controles.find((c) => c.lot === lot.id);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Lot"
        title={lot.numero_lot}
        status={<LotBadge status={lot.statut} />}
        description={`${articleName(lot.article)} · OF ${ofNumero(lot.ordre_fabrication)} · ${formatQty(num(lot.quantite), 2)} · prod. ${formatDate(lot.date_production)}`}
      />
      {lot.statut === "LIBERE" && <Guard variant="ok" title="Lot libéré — vendable">Seul ce statut autorise la vente.</Guard>}
      {lot.statut === "BLOQUE" && <Guard variant="block" title="Lot bloqué">Non vendable.</Guard>}
      {!ctrl && can("CREATE_CONTROLE") && (
        <Panel className="p-4 space-y-3">
          <h2 className="text-[13px] font-semibold">Résultat du contrôle</h2>
          <Field label="Observations">
            <input className={inputClass} value={obs} onChange={(e) => setObs(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button variant="success" onClick={() => void dispatch({ type: "CREATE_CONTROLE", lot: lot.id, resultat: "CONFORME", observations: obs })}>Conforme</Button>
            <Button variant="danger" onClick={() => void dispatch({ type: "CREATE_CONTROLE", lot: lot.id, resultat: "NON_CONFORME", observations: obs })}>Non conforme</Button>
          </div>
        </Panel>
      )}
      {ctrl && (
        <Panel className="p-4 text-[13px]">
          Contrôle {ctrl.resultat === "CONFORME" ? "conforme" : "non conforme"}
          {ctrl.controleur ? ` · ${userName(ctrl.controleur)}` : ""}
          {ctrl.observations ? ` — ${ctrl.observations}` : ""}
        </Panel>
      )}
      <div className="flex gap-2">
        {lot.statut === "CONFORME" && can("LIBERER_LOT") && (
          <Button variant="success" onClick={() => void dispatch({ type: "LIBERER_LOT", id: lot.id })}>Libérer le lot</Button>
        )}
        {can("BLOQUER_LOT") && lot.statut !== "LIBERE" && lot.statut !== "BLOQUE" && (
          <Button variant="danger" onClick={() => void dispatch({ type: "BLOQUER_LOT", id: lot.id, motif: obs })}>Bloquer</Button>
        )}
      </div>
    </div>
  );
}
