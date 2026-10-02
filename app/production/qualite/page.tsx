"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PackagePlus } from "lucide-react";
import { LotBadge, OfBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Lot, OrdreFabrication, StatutLot } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

type Onglet = "creer" | "controler" | "liberer" | "liberes" | "bloques";
const ONGLETS: Onglet[] = ["creer", "controler", "liberer", "liberes", "bloques"];
const STATUTS_ONGLET: Record<Exclude<Onglet, "creer">, StatutLot[]> = {
  controler: ["EN_ATTENTE"],
  liberer: ["CONFORME"],
  liberes: ["LIBERE"],
  bloques: ["BLOQUE", "NON_CONFORME"],
};

export default function LotsQualitePage() {
  return (
    <Suspense fallback={null}>
      <LotsQualite />
    </Suspense>
  );
}

function LotsQualite() {
  const { state, articleName, ofNumero, can, role } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [creation, setCreation] = useState<OrdreFabrication | null>(null);

  // OF terminés (ou en contrôle) qui n’ont pas encore de lot : la file « À créer ».
  const aCreer = state.ofList
    .filter((o) => (o.statut === "PRODUCTION_TERMINEE" || o.statut === "EN_CONTROLE") && !state.lots.some((l) => l.ordre_fabrication === o.id))
    .sort((a, b) => ((a.date_fin ?? a.date_creation) < (b.date_fin ?? b.date_creation) ? -1 : 1));
  const lotsDe = (o: Exclude<Onglet, "creer">) => state.lots.filter((l) => STATUTS_ONGLET[o].includes(l.statut));

  // La Direction consulte ces lots depuis la Supervision : pas d’onglet de création.
  const avecCreation = role !== "DIRECTION";
  const disponibles = avecCreation ? ONGLETS : ONGLETS.filter((o) => o !== "creer");
  const paramTab = params.get("tab") as Onglet | null;
  const parDefaut: Onglet = avecCreation && aCreer.length > 0 ? "creer" : "controler";
  const onglet: Onglet = paramTab && disponibles.includes(paramTab) ? paramTab : parDefaut;
  const setOnglet = (t: Onglet) => router.replace(`/production/qualite?tab=${t}`, { scroll: false });

  const ofsFiltres = aCreer.filter((o) => matchSearch(q, o.numero, articleName(o.article)));
  const lots: Lot[] =
    onglet === "creer"
      ? []
      : lotsDe(onglet)
          .filter((l) => matchSearch(q, l.numero_lot, articleName(l.article), ofNumero(l.ordre_fabrication)))
          .sort((a, b) => new Date(b.date_production).getTime() - new Date(a.date_production).getTime());

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Qualité"
        title="Lots qualité"
        description="Chaque OF terminé devient un lot ; le lot est contrôlé puis libéré ou bloqué. Seuls les lots libérés peuvent être vendus."
      />

      <Tabs
        label="Lots par étape"
        value={onglet}
        onChange={setOnglet}
        items={[
          ...(avecCreation ? [{ value: "creer" as const, label: "À créer", count: aCreer.length }] : []),
          { value: "controler", label: "À contrôler", count: lotsDe("controler").length },
          { value: "liberer", label: "À libérer", count: lotsDe("liberer").length },
          { value: "liberes", label: "Libérés", count: lotsDe("liberes").length },
          { value: "bloques", label: "Bloqués", count: lotsDe("bloques").length },
        ]}
      />

      <Panel className="overflow-hidden">
        <FilterBar shown={onglet === "creer" ? ofsFiltres.length : lots.length} total={onglet === "creer" ? aCreer.length : lotsDe(onglet).length} active={!!q} onReset={() => setQ("")}>
          <SearchInput value={q} onChange={setQ} placeholder={onglet === "creer" ? "OF, article…" : "Lot, article, OF…"} />
        </FilterBar>

        {onglet === "creer" ? (
          <DataTable
            emptyText="Aucun OF terminé en attente de lot."
            columns={[
              { key: "n", label: "OF" },
              { key: "a", label: "Article" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "st", label: "Statut OF" },
              { key: "d", label: "Fin de production" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={ofsFiltres.map((o) => ({
              n: <span className="num font-medium">{o.numero}</span>,
              a: articleName(o.article),
              q: <span className="num">{formatQty(num(o.quantite_a_produire), 0)}</span>,
              st: <OfBadge status={o.statut} />,
              d: o.date_fin ? formatDateTime(o.date_fin) : "—",
              x: can("CREATE_LOT") ? (
                <Button className="h-8 px-3 text-[12.5px]" onClick={() => setCreation(o)}>
                  <PackagePlus size={14} /> Créer le lot
                </Button>
              ) : (
                ""
              ),
            }))}
          />
        ) : (
          <DataTable
            emptyText="Aucun lot dans cet onglet."
            columns={[
              { key: "n", label: "Lot" },
              { key: "a", label: "Article" },
              { key: "of", label: "OF" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "s", label: "Statut" },
              { key: "d", label: "Production" },
              { key: "p", label: "Péremption" },
            ]}
            rows={lots.map((l) => ({
              n: <span className="num font-medium">{l.numero_lot}</span>,
              a: articleName(l.article),
              of: ofNumero(l.ordre_fabrication),
              q: <span className="num">{formatQty(num(l.quantite), 0)}</span>,
              s: <LotBadge status={l.statut} />,
              d: formatDate(l.date_production),
              p: l.date_peremption ? formatDate(l.date_peremption) : "—",
              href: `/production/qualite/${l.id}`,
            }))}
            onRowClick={(row) => router.push(String(row.href))}
          />
        )}
      </Panel>

      {creation && <CreerLotDrawer of={creation} onClose={() => setCreation(null)} />}
    </div>
  );
}

function CreerLotDrawer({ of, onClose }: { of: OrdreFabrication; onClose: () => void }) {
  const { dispatch, articleName } = useStore();
  const [qty, setQty] = useState(String(num(of.quantite_a_produire)));
  const [date, setDate] = useState((of.date_fin ?? new Date().toISOString()).slice(0, 10));
  const [peremption, setPeremption] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "CREATE_LOT",
      article: of.article,
      quantite: Number(qty),
      date_production: date,
      ordre_fabrication: of.id,
      date_peremption: peremption || undefined,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Créer le lot"
      subtitle={`${of.numero} · ${articleName(of.article)}`}
      icon={<PackagePlus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!(Number(qty) > 0) || !date || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le lot"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Lot" hint="Le lot est créé « En attente » : il reste non vendable jusqu’à sa libération.">
        <Field label="Quantité">
          <input type="number" min="0" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date de production">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Péremption">
            <input type="date" className={inputClass} value={peremption} onChange={(e) => setPeremption(e.target.value)} />
          </Field>
        </div>
      </DrawerSection>
    </Drawer>
  );
}
