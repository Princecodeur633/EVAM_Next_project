"use client";

import { useState } from "react";
import { Boxes, Megaphone, Printer, Tag, Truck } from "lucide-react";
import { Button, DataTable, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions } from "@/lib/api";
import { STATUT_PALETTE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Lot, Palette, RappelLot } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

/** Palettes d'un lot libéré : constitution (Magasinier, Qualité), étiquettes, emplacement et statut. */
export function PalettesDuLot({ lot }: { lot: Lot }) {
  const { state, dispatch, can } = useStore();
  const palettes = state.palettes.filter((p) => p.lot === lot.id);
  const [parPalette, setParPalette] = useState("");
  const [busy, setBusy] = useState(false);
  const peutPalettiser = can("PALETTISER_LOT") && lot.statut === "LIBERE";

  async function palettiser() {
    setBusy(true);
    await dispatch({
      type: "EXEC",
      run: () => actions.palettiserLot(lot.id, parPalette ? Number(parPalette) : undefined),
      refresh: ["palettes"],
    });
    setBusy(false);
  }

  if (!peutPalettiser && palettes.length === 0) return null;
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex flex-wrap items-center gap-2">
        <h2 className="text-[13px] font-semibold flex-1 flex items-center gap-2">
          <Boxes size={15} className="text-muted" /> Palettes ({palettes.length})
        </h2>
        {palettes.length > 0 && (
          <Button variant="secondary" className="h-8 px-3 text-[12.5px]" onClick={() => void actions.etiquettesPalettesLot(lot.id, lot.numero_lot).catch(() => {})}>
            <Printer size={14} /> Étiquettes (PDF)
          </Button>
        )}
      </div>
      {peutPalettiser && (
        <div className="px-4 py-3 border-b border-line bg-surface-2/40 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            aria-label="Quantité par palette"
            placeholder="Qté par palette (défaut produit)"
            className={cn(inputClass, "h-8 w-[230px] num")}
            value={parPalette}
            onChange={(e) => setParPalette(e.target.value)}
          />
          <Button className="h-8" disabled={busy} onClick={() => void palettiser()}>
            <Boxes size={14} /> {palettes.length ? "Palettiser le reste" : "Constituer les palettes"}
          </Button>
        </div>
      )}
      <TablePalettes palettes={palettes} />
    </Panel>
  );
}

export function TablePalettes({ palettes, actionsLigne }: { palettes: Palette[]; actionsLigne?: (p: Palette) => React.ReactNode }) {
  return (
    <DataTable
      emptyText="Aucune palette."
      columns={[
        { key: "n", label: "Palette" },
        { key: "l", label: "Lot" },
        { key: "q", label: "Quantité", className: "text-right" },
        { key: "d", label: "Lieu" },
        { key: "e", label: "Emplacement" },
        { key: "s", label: "Statut" },
        ...(actionsLigne ? [{ key: "a", label: "" }] : []),
      ]}
      rows={palettes.map((p) => ({
        n: <span className="num font-medium">{p.numero}</span>,
        l: (
          <span>
            <span className="num">{p.lot_numero ?? `n°${p.lot}`}</span>
            {p.article_code && <span className="text-muted text-[11.5px]"> · {p.article_code}</span>}
          </span>
        ),
        q: <span className="num">{formatQty(num(p.quantite), 0)}</span>,
        d: p.depot_nom ?? "—",
        e: p.emplacement_code ?? "—",
        s: <StatusBadge tone={p.statut === "EN_STOCK" ? "success" : p.statut === "EN_TRANSIT" ? "info" : "neutral"}>{STATUT_PALETTE_LABEL[p.statut]}</StatusBadge>,
        ...(actionsLigne ? { a: actionsLigne(p) } : {}),
      }))}
    />
  );
}

/**
 * Rappel de lot : clients livrés (contacts, quantités, BL), stock restant à bloquer par lieu et
 * palettes encore en stock. Lecture Qualité, Production, Direction.
 */
export function RappelDuLot({ lot }: { lot: Lot }) {
  const [rappel, setRappel] = useState<RappelLot | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function charger() {
    setBusy(true);
    setErreur(null);
    try {
      setRappel(await actions.rappelLot(lot.id));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Rappel indisponible.");
    }
    setBusy(false);
  }

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex flex-wrap items-center gap-2">
        <h2 className="text-[13px] font-semibold flex-1 flex items-center gap-2">
          <Megaphone size={15} className="text-muted" /> Rappel du lot
        </h2>
        <Button variant="secondary" className="h-8 px-3 text-[12.5px]" disabled={busy} onClick={() => void charger()}>
          {busy ? "…" : rappel ? "Actualiser" : "Préparer le rappel"}
        </Button>
      </div>
      {erreur && <p className="px-4 py-3 text-[12.5px] text-danger">{erreur}</p>}
      {!rappel ? (
        !erreur && <p className="px-4 py-4 text-[12.5px] text-muted">Clients livrés, stock restant par lieu et palettes en stock, pour bloquer et rappeler le lot.</p>
      ) : (
        <div className="divide-y divide-line">
          <div className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1.5 flex items-center gap-1.5">
              <Truck size={12} /> Clients livrés ({rappel.clients.length})
            </p>
            {rappel.clients.length === 0 ? (
              <p className="text-[12.5px] text-muted">Aucune livraison de ce lot.</p>
            ) : (
              <ul className="space-y-2">
                {rappel.clients.map((c) => (
                  <li key={c.code} className="text-[12.5px]">
                    <p className="font-medium">
                      {c.client} <span className="text-muted font-normal">({c.code})</span> · <span className="num">{formatQty(num(c.quantite), 0)}</span>
                    </p>
                    <p className="text-muted">{[c.telephone, c.adresse].filter(Boolean).join(" · ") || "Contact non renseigné"}</p>
                    <p className="text-[11.5px] text-muted">
                      {c.livraisons.map((l) => `${l.bon_livraison ?? l.commande} (${formatDateTime(l.date)}, ${formatQty(num(l.quantite), 0)})`).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1.5">Stock restant à bloquer</p>
            {rappel.stock_restant.length === 0 ? (
              <p className="text-[12.5px] text-muted">Plus de stock de ce lot.</p>
            ) : (
              <ul className="text-[12.5px] space-y-0.5">
                {rappel.stock_restant.map((s) => (
                  <li key={s.lieu} className="flex justify-between gap-3">
                    <span>{s.lieu}</span>
                    <span className="num font-medium">{formatQty(num(s.quantite), 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {rappel.palettes_en_stock.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1.5 flex items-center gap-1.5">
                <Tag size={12} /> Palettes en stock
              </p>
              <p className="text-[12.5px] num">{rappel.palettes_en_stock.join(" · ")}</p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
