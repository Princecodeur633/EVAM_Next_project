"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FAMILY_LABEL } from "@/lib/seed";
import { Button, Field, inputClass, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { ProductFamily } from "@/lib/types";
import { formatDa } from "@/lib/utils";

export default function ProduitsPage() {
  const { state, dispatch, canEditParam } = useStore();
  const edit = canEditParam("/parametrage/produits");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [family, setFamily] = useState<ProductFamily>("eau");
  const [unit, setUnit] = useState("bouteille");
  const [priceHt, setPriceHt] = useState(100);
  const [minStock, setMinStock] = useState(200);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const id = `p-${Date.now()}`;
    dispatch({
      type: "UPSERT_PRODUCT",
      product: {
        id,
        code,
        name,
        family,
        unit,
        active: true,
        technicalSheetId: "",
        saleUnit: unit,
        minStock,
        priceHt,
      },
    });
    setOpen(false);
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Paramétrage"
        title="Produits finis"
        description="Une fiche = un produit planifiable. Famille = filtre structurant (eau / jus / yaourt)."
        actions={
          edit ? (
            <Button onClick={() => setOpen(!open)}>{open ? "Fermer" : "Nouveau produit"}</Button>
          ) : undefined
        }
      />
      {open && edit && (
        <Panel className="p-4">
          <form onSubmit={onCreate} className="grid md:grid-cols-3 gap-2">
            <Field label="Code">
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </Field>
            <Field label="Libellé">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Famille">
              <select className={inputClass} value={family} onChange={(e) => setFamily(e.target.value as ProductFamily)}>
                <option value="eau">Eau</option>
                <option value="jus">Jus</option>
                <option value="yaourt">Yaourt</option>
              </select>
            </Field>
            <Field label="Unité">
              <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
            <Field label="Prix HT catalogue">
              <input type="number" className={inputClass + " num"} value={priceHt} onChange={(e) => setPriceHt(Number(e.target.value))} />
            </Field>
            <Field label="Seuil PF">
              <input type="number" className={inputClass + " num"} value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} />
            </Field>
            <div className="md:col-span-3">
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </Panel>
      )}
      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase text-muted border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">Libellé</th>
              <th className="text-left px-3 py-2">Famille</th>
              <th className="text-left px-3 py-2">Unité</th>
              <th className="text-right px-3 py-2">Prix HT</th>
              <th className="text-left px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-3 py-2">
                  <Link className="text-primary num" href={`/parametrage/produits/${p.id}`}>
                    {p.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{FAMILY_LABEL[p.family]}</td>
                <td className="px-3 py-2">{p.unit}</td>
                <td className="px-3 py-2 text-right num">{formatDa(p.priceHt)}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={p.active ? "success" : "neutral"}>{p.active ? "Actif" : "Inactif"}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
