"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FAMILY_LABEL } from "@/lib/seed";
import { Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function ProduitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();
  const p = state.products.find((x) => x.id === id);
  if (!p) return <p>Produit introuvable</p>;
  const ft = state.sheets.find((s) => s.id === p.technicalSheetId);
  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader eyebrow="Fiche produit" title={p.name} description={`${p.code} · ${FAMILY_LABEL[p.family]}`} />
      <Panel className="p-4 grid sm:grid-cols-2 gap-3">
        <Field label="Code"><input className={inputClass} readOnly defaultValue={p.code} /></Field>
        <Field label="Unité de vente"><input className={inputClass} readOnly defaultValue={p.saleUnit} /></Field>
        <Field label="Seuil stock PF"><input className={inputClass + " num"} readOnly defaultValue={p.minStock} /></Field>
        <Field label="Prix HT"><input className={inputClass} readOnly defaultValue={formatDa(p.priceHt)} /></Field>
      </Panel>
      <p className="text-[13px]">
        Fiche technique active :{" "}
        <Link className="text-primary" href={`/parametrage/fiches-techniques/${ft?.id}`}>
          v{ft?.version}
        </Link>
      </p>
    </div>
  );
}
