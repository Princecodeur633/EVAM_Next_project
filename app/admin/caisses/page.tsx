"use client";

import { useState } from "react";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, num } from "@/lib/utils";

export default function CaissesPage() {
  const { state, dispatch, can, userName } = useStore();
  const writable = can("ADMIN_USERS");
  const [nom, setNom] = useState("");
  const [emplacement, setEmplacement] = useState("");
  const [caissier, setCaissier] = useState(0);
  const caissiersLibres = state.utilisateurs.filter(
    (u) => u.profil === "CAISSIER" && u.actif && !state.caisses.some((c) => c.caissier === u.id),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Caisses"
        description="Chaque caissier a sa propre caisse : sans caisse affectée, il ne peut ouvrir aucune session. La caisse principale consolide automatiquement toutes les caisses."
      />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Field label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Caisse boutique 1" /></Field>
          <Field label="Emplacement"><input className={inputClass} value={emplacement} onChange={(e) => setEmplacement(e.target.value)} /></Field>
          <Field label="Caissier affecté">
            <select className={inputClass} value={caissier} onChange={(e) => setCaissier(Number(e.target.value))}>
              <option value={0}>— à affecter plus tard —</option>
              {caissiersLibres.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.username})</option>)}
            </select>
          </Field>
          <Button
            disabled={!nom.trim()}
            onClick={() => {
              void dispatch({ type: "CREATE_CAISSE", nom: nom.trim(), emplacement, caissier: caissier || null });
              setNom(""); setEmplacement(""); setCaissier(0);
            }}
          >
            Créer
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "Nom" },
            { key: "e", label: "Emplacement" },
            { key: "c", label: "Caissier" },
            { key: "s", label: "Solde actuel" },
            { key: "a", label: "Statut" },
            { key: "act", label: "" },
          ]}
          rows={state.caisses.map((c) => ({
            n: c.est_principale ? <span className="font-medium">{c.nom} <StatusBadge tone="info">Principale</StatusBadge></span> : c.nom,
            e: c.emplacement || "—",
            c: c.caissier ? userName(c.caissier) : (c.est_principale ? "—" : "Aucun"),
            s: formatDa(num(c.solde_actuel)),
            a: c.actif ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="danger">Inactive</StatusBadge>,
            act: writable && !c.est_principale ? (
              <button
                className="text-primary text-[12px]"
                onClick={() => void dispatch({ type: "PATCH_CAISSE", id: c.id, actif: !c.actif })}
              >
                {c.actif ? "Désactiver" : "Activer"}
              </button>
            ) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
