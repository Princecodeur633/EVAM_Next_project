"use client";

import { useState } from "react";
import { Boxes, Printer, Truck } from "lucide-react";
import { TablePalettes } from "@/components/palettes";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { RefCrud } from "@/components/RefCrud";
import { Button, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Palette, StatutPalette } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

/**
 * Palettes et emplacements (Magasinier) : constitution des palettes d'un lot libéré, rangement dans
 * un emplacement du dépôt, expédition, étiquettes. Les autres postes consultent.
 */
export default function PalettesPage() {
  const { state, can, articleName, dispatch } = useStore();
  const gerer = can("GERER_PALETTES");
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<StatutPalette | "TOUS">("EN_STOCK");
  const [lot, setLot] = useState(0);
  const [parPalette, setParPalette] = useState("");
  const [busy, setBusy] = useState<number | "lot" | null>(null);

  const palettes = state.palettes
    .filter((p) => statut === "TOUS" || p.statut === statut)
    .filter((p) => matchSearch(q, p.numero, p.lot_numero, p.article_code, p.depot_nom, p.emplacement_code));
  // Lots libérés pas encore (entièrement) palettisés.
  const lotsLiberes = state.lots.filter((l) => l.statut === "LIBERE");

  async function run(cle: number | "lot", fn: () => Promise<unknown>) {
    setBusy(cle);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: ["palettes", "emplacements"] });
    setBusy(null);
    return ok;
  }

  const actionsLigne = gerer
    ? (p: Palette) =>
        p.statut === "EN_STOCK" ? (
          <div className="flex items-center gap-1.5 justify-end">
            <select
              aria-label={`Emplacement de ${p.numero}`}
              className={cn(inputClass, "h-8 w-[150px] text-[12px]")}
              value={p.emplacement ?? 0}
              disabled={busy === p.id}
              onChange={(e) => void run(p.id, () => actions.deplacerPalette(p.id, Number(e.target.value) || null))}
            >
              <option value={0}>Sans emplacement</option>
              {state.emplacements
                .filter((e) => e.actif && e.depot === p.depot)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code}
                  </option>
                ))}
            </select>
            <Button variant="ghost" className="h-8 px-2" aria-label="Étiquette" onClick={() => void actions.etiquettePalette(p.id, p.numero).catch(() => {})}>
              <Printer size={14} />
            </Button>
            <Button variant="secondary" className="h-8 px-2.5 text-[12px]" disabled={busy === p.id} onClick={() => void run(p.id, () => actions.expedierPalette(p.id))}>
              <Truck size={14} /> Expédier
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="h-8 px-2" aria-label="Étiquette" onClick={() => void actions.etiquettePalette(p.id, p.numero).catch(() => {})}>
            <Printer size={14} />
          </Button>
        )
    : undefined;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Magasin"
        title="Palettes et emplacements"
        description="Chaque palette d’un lot libéré porte une étiquette (code-barres) ; rangée dans un emplacement du dépôt, elle est expédiée au chargement. Le rappel d’un lot retrouve ses palettes."
      />

      {can("PALETTISER_LOT") && (
        <Panel className="p-4 flex flex-col sm:flex-row sm:items-end gap-2">
          <label className="block flex-1 min-w-0">
            <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Lot libéré à palettiser</span>
            <select className={inputClass} value={lot} onChange={(e) => setLot(Number(e.target.value))}>
              <option value={0}>Choisir un lot…</option>
              {lotsLiberes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.numero_lot} · {articleName(l.article)} · {formatQty(num(l.quantite), 0)}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:w-[200px]">
            <span className="block text-[11px] uppercase tracking-wide text-muted mb-1 font-medium">Qté par palette</span>
            <input type="number" min="0" step="any" placeholder="Défaut du produit" className={cn(inputClass, "num")} value={parPalette} onChange={(e) => setParPalette(e.target.value)} />
          </label>
          <Button
            disabled={!lot || busy === "lot"}
            onClick={async () => {
              if (await run("lot", () => actions.palettiserLot(lot, parPalette ? Number(parPalette) : undefined))) {
                setLot(0);
                setParPalette("");
              }
            }}
          >
            <Boxes size={14} /> Constituer les palettes
          </Button>
        </Panel>
      )}

      <Panel className="overflow-hidden">
        <FilterBar shown={palettes.length} total={state.palettes.length} active={!!q || statut !== "EN_STOCK"} onReset={() => { setQ(""); setStatut("EN_STOCK"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Palette, lot, article, emplacement…" />
          <Segmented
            label="Statut"
            value={statut}
            onChange={setStatut}
            options={[
              { value: "EN_STOCK", label: "En stock", count: state.palettes.filter((p) => p.statut === "EN_STOCK").length },
              { value: "EN_TRANSIT", label: "En transit", count: state.palettes.filter((p) => p.statut === "EN_TRANSIT").length },
              { value: "EXPEDIEE", label: "Expédiées", count: state.palettes.filter((p) => p.statut === "EXPEDIEE").length },
              { value: "TOUS", label: "Toutes" },
            ]}
          />
        </FilterBar>
        <TablePalettes palettes={palettes} actionsLigne={actionsLigne} />
      </Panel>

      <RefCrud
        titre="Emplacements"
        description="Allées, racks ou zones d’un dépôt ; une capacité (en palettes) empêche d’y ranger plus."
        items={state.emplacements}
        endpoint={endpoints.emplacements}
        refresh={["emplacements"]}
        writable={gerer}
        rechercheDans={(e) => [e.code, e.designation, e.depot_nom]}
        libelleItem={(e) => `${e.code} · ${e.designation}`}
        valeursInitiales={{ designation: "", depot: 0, capacite_palettes: "", actif: true }}
        champs={[
          { cle: "designation", label: "Désignation", requis: true, placeholder: "Allée A - Rack 2 - Niveau 1", aide: "Le code est attribué automatiquement." },
          { cle: "depot", label: "Dépôt", type: "select", requis: true, creationSeulement: true, options: state.depots.map((d) => ({ value: d.id, label: d.nom })) },
          { cle: "capacite_palettes", label: "Capacité (palettes)", type: "number", aide: "Vide = sans limite." },
          { cle: "actif", label: "Actif", type: "checkbox" },
        ]}
        colonnes={[
          { cle: "c", label: "Code", rendu: (e) => <span className="num font-medium">{e.code}</span> },
          { cle: "d", label: "Désignation", rendu: (e) => e.designation },
          { cle: "p", label: "Dépôt", rendu: (e) => e.depot_nom ?? "—" },
          {
            cle: "o",
            label: "Occupation",
            className: "text-right",
            rendu: (e) => (
              <span className="num">
                {e.palettes_en_stock ?? 0}
                {e.capacite_palettes != null ? ` / ${e.capacite_palettes}` : ""}
              </span>
            ),
          },
          { cle: "s", label: "Statut", rendu: (e) => (e.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>) },
        ]}
      />
    </div>
  );
}
