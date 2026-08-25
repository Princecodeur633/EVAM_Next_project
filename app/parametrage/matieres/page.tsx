"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Material } from "@/lib/types";
import { formatDa, formatQty } from "@/lib/utils";

export default function MatieresPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/matieres");
  const items = state.materials.filter((m) => m.kind !== "emballage");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Material["kind"]>("ingredient");
  const [unit, setUnit] = useState("kg");
  const [minStock, setMinStock] = useState(100);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    dispatch({
      type: "UPSERT_MATERIAL",
      material: {
        id: `m-${Date.now()}`,
        code,
        name,
        kind,
        unit,
        minStock,
        cmup: 0,
        supplierIds: [],
      },
    });
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Paramétrage"
        title="Matières"
        description="CMUP courant en lecture seule — jamais saisi à la main. Il se recalcule à chaque réception."
        actions={edit ? <Button onClick={() => setOpen(!open)}>Nouvelle matière</Button> : undefined}
      />
      {open && edit && (
        <Panel className="p-4">
          <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-2 items-end">
            <Field label="Code">
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </Field>
            <Field label="Libellé">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as Material["kind"])}>
                <option value="ingredient">Ingrédient</option>
                <option value="additif">Additif</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Unité">
              <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
            <Button type="submit">Enregistrer</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-right px-3 py-2">Seuil</th>
              <th className="text-right px-3 py-2">CMUP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/parametrage/matieres/${m.id}`}>
                    {m.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">{m.kind}</td>
                <td className="px-3 py-2 text-right num">{formatQty(m.minStock, 1)}</td>
                <td className="px-3 py-2 text-right num">{formatDa(m.cmup)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
