"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";

export default function MatiereDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, canEditParam } = useStore();
  const matiere = state.articles.find((a) => a.id === Number(id) && a.type_article === "MATIERE_PREMIERE");
  const writable = canEditParam("/parametrage/articles") || canEditParam("/parametrage/matieres");

  const [form, setForm] = useState(() => ({
    designation: matiere?.designation ?? "",
    suivi_par_lot: matiere?.suivi_par_lot ?? true,
    duree_conservation_jours: matiere?.duree_conservation_jours ?? 0,
    stock_minimum: matiere?.stock_minimum ?? "0",
    stock_alerte: matiere?.stock_alerte ?? "0",
    emplacement_stockage: matiere?.emplacement_stockage ?? "",
    actif: matiere?.actif ?? true,
  }));

  useEffect(() => {
    if (!matiere) return;
    setForm({
      designation: matiere.designation,
      suivi_par_lot: matiere.suivi_par_lot ?? true,
      duree_conservation_jours: matiere.duree_conservation_jours ?? 0,
      stock_minimum: matiere.stock_minimum ?? "0",
      stock_alerte: matiere.stock_alerte ?? "0",
      emplacement_stockage: matiere.emplacement_stockage ?? "",
      actif: matiere.actif,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matiere?.id]);

  if (!matiere) return <p className="text-[13px] text-muted">Matière première introuvable.</p>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Référentiel"
        title={`${matiere.code} · ${matiere.designation}`}
        description="Matière première ou emballage utilisé en production."
        status={matiere.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="danger">Inactif</StatusBadge>}
      />

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Identité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Code"><input className={inputClass} disabled value={matiere.code} /></Field>
          <Field label="Désignation">
            <input className={inputClass} disabled={!writable} value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
          </Field>
          <Field label="Unité de gestion"><input className={inputClass} disabled value={UNITE_LABEL[matiere.unite_mesure] ?? matiere.unite_mesure} /></Field>
        </div>
      </Panel>

      <Panel className="p-4 space-y-3">
        <h2 className="text-[13px] font-semibold">Stock & traçabilité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <Field label="Stock minimum">
            <input type="number" className={inputClass} disabled={!writable} value={form.stock_minimum} onChange={(e) => setForm((f) => ({ ...f, stock_minimum: e.target.value }))} />
          </Field>
          <Field label="Stock d'alerte">
            <input type="number" className={inputClass} disabled={!writable} value={form.stock_alerte} onChange={(e) => setForm((f) => ({ ...f, stock_alerte: e.target.value }))} />
          </Field>
          <Field label="Durée de conservation (jours)">
            <input type="number" className={inputClass} disabled={!writable} value={form.duree_conservation_jours ?? 0} onChange={(e) => setForm((f) => ({ ...f, duree_conservation_jours: Number(e.target.value) }))} />
          </Field>
          <Field label="Emplacement de stockage">
            <input className={inputClass} disabled={!writable} value={form.emplacement_stockage} onChange={(e) => setForm((f) => ({ ...f, emplacement_stockage: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" disabled={!writable} checked={form.suivi_par_lot} onChange={(e) => setForm((f) => ({ ...f, suivi_par_lot: e.target.checked }))} />
            Suivi par lot
          </label>
          <label className="flex items-center gap-2 text-[13px] pb-2">
            <input type="checkbox" disabled={!writable} checked={form.actif} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))} />
            Matière active
          </label>
        </div>
      </Panel>

      {writable && (
        <Button
          onClick={() =>
            void dispatch({
              type: "PATCH_ARTICLE",
              id: matiere.id,
              designation: form.designation,
              suivi_par_lot: form.suivi_par_lot,
              duree_conservation_jours: form.duree_conservation_jours || null,
              stock_minimum: Number(form.stock_minimum),
              stock_alerte: Number(form.stock_alerte),
              emplacement_stockage: form.emplacement_stockage,
              actif: form.actif,
            })
          }
        >
          Enregistrer la fiche matière
        </Button>
      )}
    </div>
  );
}
