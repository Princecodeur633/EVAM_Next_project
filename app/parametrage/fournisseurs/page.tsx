"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FournisseursPage() {
  const router = useRouter();
  const { state, dispatch, can } = useStore();
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Référentiel" title="Fournisseurs" description="Fournisseurs de matières premières et d’emballages. Cliquez sur une ligne pour voir la fiche complète." />
      {can("CREATE_CF") && (
        <Panel className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <Field label="Code"><input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Nom"><input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
          <Field label="Contact"><input className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
          <Field label="Téléphone"><input className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} /></Field>
          <Field label="Email"><input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Adresse"><input className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
          <Button
            disabled={!code}
            onClick={() => {
              void dispatch({ type: "CREATE_FOURNISSEUR", code, nom, contact, telephone, email, adresse });
              setCode(""); setNom(""); setContact(""); setTelephone(""); setEmail(""); setAdresse("");
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
            { key: "ct", label: "Contact" },
            { key: "t", label: "Téléphone" },
            { key: "e", label: "Email" },
            { key: "a", label: "Statut" },
          ]}
          rows={state.fournisseurs.map((f) => ({
            c: f.code,
            n: f.nom,
            ct: f.contact || "—",
            t: f.telephone || "—",
            e: f.email || "—",
            a: f.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="danger">Inactif</StatusBadge>,
            href: `/parametrage/fournisseurs/${f.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
