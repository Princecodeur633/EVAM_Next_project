"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { TYPE_CLIENT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { TypeClient } from "@/lib/types";
import { formatDa, formatDate, num } from "@/lib/utils";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, canEditParam, articleName } = useStore();
  const client = state.clients.find((c) => c.id === Number(id));
  const writable = canEditParam("/parametrage/clients");

  const [form, setForm] = useState(() => ({
    nom: client?.nom ?? "",
    type_client: (client?.type_client ?? "SOCIETE") as TypeClient,
    adresse: client?.adresse ?? "",
    telephone: client?.telephone ?? "",
    encours_autorise: client?.encours_autorise ?? "0",
    delai_paiement_jours: client?.delai_paiement_jours ?? 0,
    bloque: client?.bloque ?? false,
  }));

  useEffect(() => {
    if (!client) return;
    setForm({
      nom: client.nom,
      type_client: client.type_client,
      adresse: client.adresse ?? "",
      telephone: client.telephone ?? "",
      encours_autorise: client.encours_autorise ?? "0",
      delai_paiement_jours: client.delai_paiement_jours ?? 0,
      bloque: client.bloque,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  if (!client) return <p className="text-[13px] text-muted">Client introuvable.</p>;

  const tarifs = state.tarifs.filter((t) => t.client === client.id);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title={`${client.code} · ${client.nom}`}
        description={TYPE_CLIENT_LABEL[client.type_client] ?? client.type_client}
        status={client.bloque ? <StatusBadge tone="danger">Bloqué</StatusBadge> : <StatusBadge tone="success">Actif</StatusBadge>}
      />

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Identité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <Field label="Code"><input className={inputClass} disabled value={client.code} /></Field>
          <Field label="Nom / Raison sociale">
            <input className={inputClass} disabled={!writable} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Type">
            <select className={inputClass} disabled={!writable} value={form.type_client} onChange={(e) => setForm((f) => ({ ...f, type_client: e.target.value as TypeClient }))}>
              <option value="PARTICULIER">Particulier</option>
              <option value="SOCIETE">Société</option>
              <option value="CONTRAT">Contrat</option>
            </select>
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} disabled={!writable} value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </Field>
          <Field label="Adresse">
            <input className={inputClass} disabled={!writable} value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Conditions commerciales</h2>
        <p className="text-[12px] text-muted">
          Encours actuel autorisé : <span className="num">{formatDa(num(client.encours_autorise))}</span>. Un client bloqué ne peut plus commander.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-end">
          <Field label="Encours autorisé">
            <input type="number" className={inputClass} disabled={!writable} value={form.encours_autorise} onChange={(e) => setForm((f) => ({ ...f, encours_autorise: e.target.value }))} />
          </Field>
          <Field label="Délai de paiement (jours, 0 = comptant)">
            <input type="number" className={inputClass} disabled={!writable} value={form.delai_paiement_jours} onChange={(e) => setForm((f) => ({ ...f, delai_paiement_jours: Number(e.target.value) }))} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" disabled={!writable} checked={form.bloque} onChange={(e) => setForm((f) => ({ ...f, bloque: e.target.checked }))} />
            Compte bloqué
          </label>
        </div>
      </Panel>

      {writable && (
        <Button
          onClick={() =>
            void dispatch({
              type: "PATCH_CLIENT",
              id: client.id,
              nom: form.nom,
              type_client: form.type_client,
              adresse: form.adresse,
              telephone: form.telephone,
              encours_autorise: Number(form.encours_autorise),
              delai_paiement_jours: form.delai_paiement_jours,
              bloque: form.bloque,
            })
          }
        >
          Enregistrer la fiche client
        </Button>
      )}

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Tarifs spécifiques</h2>
        <DataTable
          columns={[
            { key: "a", label: "Article" },
            { key: "p", label: "Prix" },
            { key: "d", label: "Début" },
            { key: "f", label: "Fin" },
          ]}
          rows={tarifs.map((t) => ({
            a: articleName(t.article),
            p: formatDa(num(t.prix_unitaire)),
            d: formatDate(t.date_debut_validite),
            f: t.date_fin_validite ? formatDate(t.date_fin_validite) : "—",
          }))}
        />
      </Panel>
    </div>
  );
}
