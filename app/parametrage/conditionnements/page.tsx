"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function ConditionnementsPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/conditionnements") || canEditParam("/parametrage/matieres");
  const items = state.materials.filter((m) => m.kind === "emballage");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [minStock, setMinStock] = useState(1000);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    dispatch({
      type: "UPSERT_MATERIAL",
      material: {
        id: `m-${Date.now()}`,
        code,
        name,
        kind: "emballage",
        unit: "u",
        minStock,
        cmup: 0,
        supplierIds: [],
      },
    });
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Paramétrage"
        title="Conditionnements"
        description="Bouteilles, pots, bouchons, étiquettes — traités comme des matières spécifiques. CMUP en lecture."
      />
      {edit && (
        <Panel className="p-4">
          <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-2 items-end">
            <Field label="Code">
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </Field>
            <Field label="Libellé">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Seuil">
              <input type="number" className={inputClass + " num"} value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} />
            </Field>
            <Button type="submit">Créer</Button>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-right px-3 py-2">CMUP</th>
              <th className="text-right px-3 py-2">Seuil</th>
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
                <td className="px-3 py-2 text-right num">{formatDa(m.cmup)}</td>
                <td className="px-3 py-2 text-right num">{m.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
