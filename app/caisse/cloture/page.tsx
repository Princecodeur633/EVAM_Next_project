"use client";

import { useState } from "react";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime } from "@/lib/utils";

export default function ClotureCaissePage() {
  const { state, dispatch } = useStore();
  const [counted, setCounted] = useState(state.cashSession.theoretical);
  const ecart = counted - state.cashSession.theoretical;
  return (
    <div className="max-w-lg space-y-4">
      <PageHeader eyebrow="Caisse" title="Clôture de caisse" description="Théorique vs réel. Action irréversible — confirmation métier." />
      <Panel className="p-4 space-y-3">
        <p className="text-[13px]">
          Session {state.cashSession.open ? "ouverte" : "clôturée"}
          {state.cashSession.closedAt ? ` · ${formatDateTime(state.cashSession.closedAt)}` : ""}
        </p>
        <p className="text-[13px]">
          Théorique espèces : <span className="num font-medium">{formatDa(state.cashSession.theoretical)}</span>
        </p>
        <Field label="Comptage réel">
          <input
            type="number"
            className={inputClass + " num"}
            value={counted}
            onChange={(e) => setCounted(Number(e.target.value))}
            disabled={!state.cashSession.open}
          />
        </Field>
        <p className={`text-[13px] ${ecart === 0 ? "text-success" : "text-warning"}`}>Écart : {formatDa(ecart)}</p>
        {state.cashSession.open && (
          <Button
            onClick={() => {
              if (confirm("Clôturer la caisse ? Cette action est irréversible dans le flux métier.")) {
                dispatch({ type: "CLOSE_CASH", counted });
              }
            }}
          >
            Clôturer
          </Button>
        )}
      </Panel>
    </div>
  );
}
