"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { FAMILY_LABEL } from "@/lib/seed";
import { Button, Field, inputClass, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa } from "@/lib/utils";

export default function ProduitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, canEditParam } = useStore();
  const p = state.products.find((x) => x.id === id);
  const edit = canEditParam("/parametrage/produits");
  const [name, setName] = useState(p?.name ?? "");
  const [minStock, setMinStock] = useState(p?.minStock ?? 0);
  const [priceHt, setPriceHt] = useState(p?.priceHt ?? 0);
  const [active, setActive] = useState(p?.active ?? true);
  if (!p) return <p>Produit introuvable</p>;
  const product = p;
  const ft = state.sheets.find((s) => s.id === product.technicalSheetId);

  function onSave(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "UPSERT_PRODUCT", product: { ...product, name, minStock, priceHt, active } });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader eyebrow="Fiche produit" title={p.name} description={`${p.code} · ${FAMILY_LABEL[p.family]}`} />
      <form onSubmit={onSave}>
        <Panel className="p-4 grid sm:grid-cols-2 gap-3">
          <Field label="Code">
            <input className={inputClass} readOnly value={p.code} />
          </Field>
          <Field label="Libellé">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} readOnly={!edit} />
          </Field>
          <Field label="Unité de vente">
            <input className={inputClass} readOnly defaultValue={p.saleUnit} />
          </Field>
          <Field label="Seuil stock PF">
            <input
              className={inputClass + " num"}
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              readOnly={!edit}
            />
          </Field>
          <Field label="Prix HT catalogue">
            <input
              className={inputClass + " num"}
              type="number"
              value={priceHt}
              onChange={(e) => setPriceHt(Number(e.target.value))}
              readOnly={!edit}
            />
          </Field>
          <Field label="Statut">
            <select className={inputClass} value={active ? "1" : "0"} onChange={(e) => setActive(e.target.value === "1")} disabled={!edit}>
              <option value="1">Actif</option>
              <option value="0">Inactif</option>
            </select>
          </Field>
        </Panel>
        {edit && (
          <Button type="submit" className="mt-3">
            Enregistrer
          </Button>
        )}
      </form>
      <p className="text-[13px]">
        Prix affiché catalogue : {formatDa(p.priceHt)}. Les grilles client s'appliquent à la commande.
      </p>
      {ft && (
        <p className="text-[13px]">
          Fiche technique active :{" "}
          <Link className="text-primary" href={`/parametrage/fiches-techniques/${ft.id}`}>
            v{ft.version}
          </Link>
        </p>
      )}
    </div>
  );
}
