"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { TYPE_CLIENT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeClient } from "@/lib/types";
import { formatDa, num } from "@/lib/utils";

export default function ParamClientsPage() {
  const router = useRouter();
  const { state, dispatch, canEditParam } = useStore();
  const writable = canEditParam("/parametrage/clients");
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeClient>("SOCIETE");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [encours, setEncours] = useState(0);
  const [delai, setDelai] = useState(0);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Clients" description="Répertoire des particuliers, sociétés et clients sous contrat. Cliquez sur une ligne pour voir la fiche complète." />
      {writable && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Code"><input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeClient)}>
              <option value="PARTICULIER">Particulier</option>
              <option value="SOCIETE">Société</option>
              <option value="CONTRAT">Contrat</option>
            </select>
          </Field>
          <Field label="Téléphone"><input className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} /></Field>
          <Field label="Adresse"><input className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
          <Field label="Encours autorisé"><input type="number" className={inputClass} value={encours} onChange={(e) => setEncours(Number(e.target.value))} /></Field>
          <Field label="Délai de paiement (jours)"><input type="number" className={inputClass} value={delai} onChange={(e) => setDelai(Number(e.target.value))} /></Field>
          <Button
            disabled={!code}
            onClick={() => {
              void dispatch({ type: "CREATE_CLIENT", code, nom, type_client: type, telephone, adresse, encours_autorise: encours, delai_paiement_jours: delai });
              setCode(""); setNom(""); setTelephone(""); setAdresse(""); setEncours(0); setDelai(0);
            }}
          >
            Créer
          </Button>
        </Panel>
      )}
      <Panel>
        <DataTable
          columns={[
            { key: "c", label: "Code" },
            { key: "n", label: "Nom" },
            { key: "t", label: "Type" },
            { key: "tel", label: "Téléphone" },
            { key: "e", label: "Encours autorisé" },
            { key: "d", label: "Délai paiement" },
            { key: "b", label: "Statut" },
          ]}
          rows={state.clients.map((c) => ({
            c: c.code,
            n: c.nom,
            t: TYPE_CLIENT_LABEL[c.type_client] ?? c.type_client,
            tel: c.telephone || "—",
            e: formatDa(num(c.encours_autorise)),
            d: c.delai_paiement_jours ? `${c.delai_paiement_jours} j` : "Comptant",
            b: c.bloque ? <StatusBadge tone="danger">Bloqué</StatusBadge> : <StatusBadge tone="success">Actif</StatusBadge>,
            href: `/parametrage/clients/${c.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
