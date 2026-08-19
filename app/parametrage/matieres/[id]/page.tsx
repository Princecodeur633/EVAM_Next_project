"use client";

import { useParams } from "next/navigation";
import { Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function MatiereDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();
  const m = state.materials.find((x) => x.id === id);
  if (!m) return <p>Matière introuvable</p>;
  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title={m.name} description={m.code} />
      <Panel className="p-4 grid gap-3">
        <Field label="Unité"><input className={inputClass} readOnly defaultValue={m.unit} /></Field>
        <Field label="CMUP courant"><input className={inputClass} readOnly defaultValue={formatDa(m.cmup)} /></Field>
        <Field label="Seuil min"><input className={inputClass + " num"} readOnly defaultValue={m.minStock} /></Field>
        <p className="text-[13px] text-muted">
          Fournisseurs : {m.supplierIds.map((id) => state.suppliers.find((s) => s.id === id)?.name).join(", ")}
        </p>
      </Panel>
    </div>
  );
}
