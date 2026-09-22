"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { statutTarif } from "@/lib/tarifs";
import { formatDa, num } from "@/lib/utils";

export default function TarifDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, canEditParam, articleName, clientName } = useStore();
  const tarif = state.tarifs.find((t) => t.id === Number(id));
  const writable = canEditParam("/parametrage/tarifs");

  const [form, setForm] = useState(() => ({
    prix_unitaire: tarif?.prix_unitaire ?? "0",
    date_debut_validite: tarif?.date_debut_validite ?? "",
    date_fin_validite: tarif?.date_fin_validite ?? "",
  }));

  useEffect(() => {
    if (!tarif) return;
    setForm({
      prix_unitaire: tarif.prix_unitaire,
      date_debut_validite: tarif.date_debut_validite,
      date_fin_validite: tarif.date_fin_validite ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarif?.id]);

  if (!tarif) return <p className="text-[13px] text-muted">Tarif introuvable.</p>;

  const statut = statutTarif(tarif);
  const article = state.articles.find((a) => a.id === tarif.article);
  const cible = tarif.client ? clientName(tarif.client) : "Tarif public";

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title={`${article?.code ?? `#${tarif.article}`} · ${cible}`}
        description={`${articleName(tarif.article)} — ${formatDa(num(tarif.prix_unitaire))}`}
        status={<StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>}
      />

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Cible</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Article"><input className={inputClass} disabled value={articleName(tarif.article)} /></Field>
          <Field label="Client"><input className={inputClass} disabled value={cible} /></Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Prix et validité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Prix unitaire">
            <input type="number" className={inputClass} disabled={!writable} value={form.prix_unitaire} onChange={(e) => setForm((f) => ({ ...f, prix_unitaire: e.target.value }))} />
          </Field>
          <Field label="Valide à partir du">
            <input type="date" className={inputClass} disabled={!writable} value={form.date_debut_validite} onChange={(e) => setForm((f) => ({ ...f, date_debut_validite: e.target.value }))} />
          </Field>
          <Field label="Valide jusqu'au (vide = sans fin)">
            <input type="date" className={inputClass} disabled={!writable} value={form.date_fin_validite} onChange={(e) => setForm((f) => ({ ...f, date_fin_validite: e.target.value }))} />
          </Field>
        </div>
      </Panel>

      {writable && (
        <Button
          disabled={!form.date_debut_validite}
          onClick={() =>
            void dispatch({
              type: "PATCH_TARIF",
              id: tarif.id,
              prix_unitaire: Number(form.prix_unitaire),
              date_debut_validite: form.date_debut_validite,
              date_fin_validite: form.date_fin_validite || null,
            })
          }
        >
          Enregistrer le tarif
        </Button>
      )}
    </div>
  );
}
