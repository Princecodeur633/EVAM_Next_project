"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function FournisseurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, can, userName } = useStore();
  const fournisseur = state.fournisseurs.find((f) => f.id === Number(id));
  const writable = can("CREATE_CF");

  const [form, setForm] = useState(() => ({
    nom: fournisseur?.nom ?? "",
    contact: fournisseur?.contact ?? "",
    telephone: fournisseur?.telephone ?? "",
    email: fournisseur?.email ?? "",
    adresse: fournisseur?.adresse ?? "",
    actif: fournisseur?.actif ?? true,
  }));

  useEffect(() => {
    if (!fournisseur) return;
    setForm({
      nom: fournisseur.nom,
      contact: fournisseur.contact ?? "",
      telephone: fournisseur.telephone ?? "",
      email: fournisseur.email ?? "",
      adresse: fournisseur.adresse ?? "",
      actif: fournisseur.actif,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fournisseur?.id]);

  if (!fournisseur) return <p className="text-[13px] text-muted">Fournisseur introuvable.</p>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title={`${fournisseur.code} · ${fournisseur.nom}`}
        description="Fournisseur de matières premières et d’emballages."
        status={fournisseur.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="danger">Inactif</StatusBadge>}
      />

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Identité et coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <Field label="Code"><input className={inputClass} disabled value={fournisseur.code} /></Field>
          <Field label="Nom">
            <input className={inputClass} disabled={!writable} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Contact">
            <input className={inputClass} disabled={!writable} value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} disabled={!writable} value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} disabled={!writable} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Adresse">
            <input className={inputClass} disabled={!writable} value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Gestion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-end">
          <Field label="Géré par">
            <input className={inputClass} disabled value={fournisseur.gere_par ? userName(fournisseur.gere_par) : "—"} />
          </Field>
          <Field label="Créé le">
            <input className={inputClass} disabled value={fournisseur.date_creation ? formatDateTime(fournisseur.date_creation) : "—"} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" disabled={!writable} checked={form.actif} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))} />
            Fournisseur actif
          </label>
        </div>
      </Panel>

      {writable && (
        <Button
          onClick={() =>
            void dispatch({
              type: "PATCH_FOURNISSEUR",
              id: fournisseur.id,
              nom: form.nom,
              contact: form.contact,
              telephone: form.telephone,
              email: form.email,
              adresse: form.adresse,
              actif: form.actif,
            })
          }
        >
          Enregistrer la fiche fournisseur
        </Button>
      )}
    </div>
  );
}
