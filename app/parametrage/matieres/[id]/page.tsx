"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function MatiereDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, canEditParam } = useStore();
  const m = state.materials.find((x) => x.id === id);
  const edit = canEditParam("/parametrage/matieres") || canEditParam("/parametrage/conditionnements");
  const [name, setName] = useState(m?.name ?? "");
  const [minStock, setMinStock] = useState(m?.minStock ?? 0);
  const [supplierIds, setSupplierIds] = useState(m?.supplierIds ?? []);
  if (!m) return <p>Matière introuvable</p>;
  const material = m;

  function onSave(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPSERT_MATERIAL", material: { ...material, name, minStock, supplierIds } });
  }

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title={m.name} description={`${m.code} · CMUP jamais saisi`} />
      <form onSubmit={onSave}>
        <Panel className="p-4 grid gap-3">
          <Field label="Libellé">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Unité">
            <input className={inputClass} readOnly defaultValue={m.unit} />
          </Field>
          <Field label="CMUP courant">
            <input className={inputClass} readOnly value={formatDa(m.cmup)} />
          </Field>
          <Field label="Seuil min">
            <input
              className={inputClass + " num"}
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              readOnly={!edit}
            />
          </Field>
          <Field label="Fournisseurs habituels">
            <select
              multiple
              className={inputClass + " h-24"}
              value={supplierIds}
              disabled={!edit}
              onChange={(e) => setSupplierIds(Array.from(e.target.selectedOptions, (o) => o.value))}
            >
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </Panel>
        {edit && (
          <Button type="submit" className="mt-3">
            Enregistrer (CMUP inchangé)
          </Button>
        )}
      </form>
    </div>
  );
}
