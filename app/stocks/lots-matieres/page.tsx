"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, GitBranch, PackagePlus, ShieldCheck } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { KpiCard } from "@/components/charts";
import { ControleLigne, LotMatiereBadge, SaisieControleDrawer } from "@/components/qualite";
import { Button, DataTable, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { actions, api, endpoints } from "@/lib/api";
import { TYPES_ACHETES } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ControleRealise, LotMatiere, StatutLotMatiere, TracabiliteLotMatiere } from "@/lib/types";
import { cn, formatDate, formatQty, num } from "@/lib/utils";

type Vue = StatutLotMatiere | "DISPONIBLES" | "TOUS";

function joursAvant(date: string | null) {
  if (!date) return null;
  return Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/**
 * Lots de matières, emballages et consommables : créés à la réception (lot fournisseur, DLC),
 * consommés par les sorties des OF au plus près de leur DLC. Un lot « à contrôler » ou « bloqué »
 * est indisponible ; la Qualité le libère ou le bloque.
 */
export default function LotsMatieresPage() {
  const { state, can, articleName, fournisseurName } = useStore();
  const [vue, setVue] = useState<Vue>("DISPONIBLES");
  const [q, setQ] = useState("");
  const [depot, setDepot] = useState("");
  const [ouvert, setOuvert] = useState<LotMatiere | null>(null);
  const [nouveau, setNouveau] = useState(false);
  const tous = state.lotsMatieres;
  const compte = (s: StatutLotMatiere) => tous.filter((l) => l.statut === s).length;
  const lignes = useMemo(
    () =>
      tous
        .filter((l) => (vue === "TOUS" ? true : vue === "DISPONIBLES" ? l.statut !== "EPUISE" : l.statut === vue))
        .filter((l) => !depot || String(l.depot) === depot)
        .filter((l) => matchSearch(q, l.numero, l.lot_fournisseur, l.article_code, articleName(l.article)))
        .sort((a, b) => (a.date_peremption ?? "9999").localeCompare(b.date_peremption ?? "9999")),
    [tous, vue, depot, q, articleName],
  );
  const perimes = tous.filter((l) => l.est_perime && l.statut !== "EPUISE").length;
  const bientot = tous.filter((l) => l.statut !== "EPUISE" && !l.est_perime && (joursAvant(l.date_peremption) ?? 999) <= 30).length;
  const depots = [...new Set(tous.map((l) => l.depot))].map((id) => ({ value: String(id), label: state.depots.find((d) => d.id === id)?.nom ?? `#${id}` }));

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Stocks"
        title="Lots matières"
        description="Traçabilité amont : chaque réception d’un article suivi par lot crée son lot (lot fournisseur, DLC). Les sorties des OF consomment les lots les plus proches de leur DLC ; un lot à contrôler ou bloqué est indisponible."
        actions={
          can("GERER_LOTS_MATIERES") ? (
            <Button variant="secondary" onClick={() => setNouveau(true)}>
              <PackagePlus size={15} /> Lot de stock initial
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Libérés" value={compte("LIBERE")} tone="success" />
        <KpiCard label="À contrôler" value={compte("A_CONTROLER")} tone={compte("A_CONTROLER") ? "warning" : "success"} />
        <KpiCard label="Bloqués" value={compte("BLOQUE")} tone={compte("BLOQUE") ? "danger" : "success"} />
        <KpiCard label="Périmés / DLC < 30 j" value={`${perimes} / ${bientot}`} tone={perimes ? "danger" : bientot ? "warning" : "success"} />
      </div>
      <Panel className="overflow-hidden">
        <FilterBar shown={lignes.length} total={tous.length} active={!!q || !!depot || vue !== "DISPONIBLES"} onReset={() => { setQ(""); setDepot(""); setVue("DISPONIBLES"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="N° lot, lot fournisseur, article…" />
          <Segmented
            label="Statut"
            value={vue}
            onChange={setVue}
            options={[
              { value: "DISPONIBLES", label: "En stock" },
              { value: "A_CONTROLER", label: "À contrôler", count: compte("A_CONTROLER") },
              { value: "BLOQUE", label: "Bloqués", count: compte("BLOQUE") },
              { value: "EPUISE", label: "Épuisés" },
              { value: "TOUS", label: "Tous" },
            ]}
          />
          {depots.length > 1 && <FilterSelect label="Lieu" allLabel="Tous les lieux" value={depot} onChange={setDepot} options={depots} />}
        </FilterBar>
        <DataTable
          emptyText={tous.length ? "Aucun lot pour ces filtres." : "Aucun lot : ils sont créés à la réception des articles suivis par lot."}
          columns={[
            { key: "n", label: "Lot" },
            { key: "a", label: "Article" },
            { key: "f", label: "Fournisseur" },
            { key: "l", label: "Lieu" },
            { key: "r", label: "Restant / reçu", className: "text-right" },
            { key: "d", label: "DLC" },
            { key: "s", label: "Statut" },
          ]}
          rows={lignes.map((l) => {
            const j = joursAvant(l.date_peremption);
            return {
              _id: l.id,
              n: (
                <span className="inline-flex flex-col">
                  <span className="num font-medium">{l.numero}</span>
                  {l.lot_fournisseur && <span className="text-[11px] text-muted">fourn. {l.lot_fournisseur}</span>}
                </span>
              ),
              a: articleName(l.article),
              f: l.fournisseur ? fournisseurName(l.fournisseur) : "—",
              l: l.depot_nom ?? "—",
              r: (
                <span className="num">
                  {formatQty(num(l.quantite_restante), 2)} <span className="text-muted">/ {formatQty(num(l.quantite_initiale), 2)}</span>
                </span>
              ),
              d: l.date_peremption ? (
                <span className={cn(l.est_perime ? "text-danger font-semibold" : j != null && j <= 30 ? "text-warning font-medium" : "")}>
                  {formatDate(l.date_peremption)}
                  {l.est_perime && " · périmé"}
                </span>
              ) : (
                "—"
              ),
              s: <LotMatiereBadge statut={l.statut} />,
            };
          })}
          onRowClick={(row) => setOuvert(tous.find((l) => l.id === row._id) ?? null)}
        />
      </Panel>
      {ouvert && <LotMatiereDrawer lot={ouvert} onClose={() => setOuvert(null)} />}
      {nouveau && <NouveauLotDrawer onClose={() => setNouveau(false)} />}
    </div>
  );
}

function LotMatiereDrawer({ lot, onClose }: { lot: LotMatiere; onClose: () => void }) {
  const { state, dispatch, can, articleName, fournisseurName } = useStore();
  const [trace, setTrace] = useState<TracabiliteLotMatiere | null>(null);
  const [controle, setControle] = useState<ControleRealise | null>(null);
  const [busy, setBusy] = useState(false);
  const controles = state.controlesRealises.filter((c) => c.lot_matiere === lot.id);
  const ncs = state.nonConformites.filter((n) => n.lot_matiere === lot.id);

  useEffect(() => {
    let annule = false;
    void actions
      .tracabiliteLotMatiere(lot.id)
      .then((t) => !annule && setTrace(t))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [lot.id]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: ["lotsMatieres", "stock"] });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <>
      <Drawer
        open
        width="lg"
        onClose={onClose}
        title={lot.numero}
        subtitle={`${articleName(lot.article)}${lot.lot_fournisseur ? ` · lot fournisseur ${lot.lot_fournisseur}` : ""}`}
        icon={<GitBranch size={17} />}
        footer={
          can("LIBERER_LOT_MATIERE") && lot.statut !== "EPUISE" ? (
            <>
              {lot.statut !== "BLOQUE" && (
                <Button variant="danger" disabled={busy} onClick={() => void run(() => actions.bloquerLotMatiere(lot.id))}>
                  <Ban size={14} /> Bloquer
                </Button>
              )}
              {lot.statut !== "LIBERE" && (
                <Button variant="success" disabled={busy} onClick={() => void run(() => actions.libererLotMatiere(lot.id))}>
                  <ShieldCheck size={14} /> Libérer
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <LotMatiereBadge statut={lot.statut} />
        </div>
        <DrawerSection title="Lot">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
            {[
              ["Fournisseur", lot.fournisseur ? fournisseurName(lot.fournisseur) : "—"],
              ["Lieu", lot.depot_nom ?? "—"],
              ["Reçu le", formatDate(lot.date_reception)],
              ["DLC / DLUO", lot.date_peremption ? formatDate(lot.date_peremption) : "—"],
              ["Quantité reçue", formatQty(num(lot.quantite_initiale), 3)],
              ["Restante", formatQty(num(lot.quantite_restante), 3)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-right">{v}</dd>
              </div>
            ))}
          </dl>
          {lot.observations && <p className="text-[12.5px] text-muted">{lot.observations}</p>}
        </DrawerSection>
        {(controles.length > 0 || ncs.length > 0) && (
          <DrawerSection title="Contrôles de réception" hint="Tous conformes (sans NC ouverte) : le lot est libéré automatiquement.">
            <div className="rounded-[9px] border border-line divide-y divide-line">
              {controles.map((c) => (
                <ControleLigne key={c.id} controle={c} onClick={() => setControle(c)} />
              ))}
              {ncs.map((n) => (
                <p key={n.id} className="px-3 py-2 text-[12.5px]">
                  <span className="font-medium">{n.numero}</span> · {n.description}
                </p>
              ))}
            </div>
          </DrawerSection>
        )}
        <DrawerSection title="Traçabilité aval" hint="Utile pour un rappel : OF qui ont consommé ce lot et lots de produits finis obtenus.">
          {!trace ? (
            <p className="text-[12.5px] text-muted">Chargement…</p>
          ) : trace.ordres_fabrication.length === 0 ? (
            <p className="text-[12.5px] text-muted">Ce lot n’a encore été consommé par aucun OF.</p>
          ) : (
            <ul className="rounded-[9px] border border-line divide-y divide-line">
              {trace.ordres_fabrication.map((o) => (
                <li key={o.of} className="px-3 py-2 text-[12.5px]">
                  <p>
                    <span className="num font-medium">{o.of}</span> · {o.article} · {o.statut}
                    <span className="text-muted num"> · {formatQty(num(o.quantite_consommee), 3)} consommé</span>
                  </p>
                  {o.lots_produits_finis.length > 0 && (
                    <p className="text-[11.5px] text-muted">Lots produits : {o.lots_produits_finis.map((l) => `${l.lot} (${l.statut})`).join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DrawerSection>
      </Drawer>
      {controle && <SaisieControleDrawer controle={controle} onClose={() => setControle(null)} />}
    </>
  );
}

/** Lot saisi sur un stock déjà présent (stock initial sans lot) : limité au stock physique non encore loti. */
function NouveauLotDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [article, setArticle] = useState(0);
  const [depot, setDepot] = useState(0);
  const [fournisseur, setFournisseur] = useState(0);
  const [lotFournisseur, setLotFournisseur] = useState("");
  const [reception, setReception] = useState(new Date().toISOString().slice(0, 10));
  const [dlc, setDlc] = useState("");
  const [qty, setQty] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const articles = state.articles.filter((a) => a.actif && a.suivi_par_lot !== false && TYPES_ACHETES.includes(a.type_article));
  const stock = state.stock.find((s) => s.article === article && s.depot === depot);
  const lotis = state.lotsMatieres.filter((l) => l.article === article && l.depot === depot && l.statut !== "EPUISE").reduce((a, l) => a + num(l.quantite_restante), 0);
  const sansLot = Math.max(0, num(stock?.quantite_physique) - lotis);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.post(endpoints.lotsMatieres, {
          article,
          depot,
          fournisseur: fournisseur || null,
          lot_fournisseur: lotFournisseur.trim(),
          date_reception: reception,
          date_peremption: dlc || null,
          quantite_initiale: Number(qty),
          observations: obs.trim(),
        }),
      refresh: ["lotsMatieres", "stock"],
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Lot de stock initial"
      subtitle="Pour rattacher à un lot un stock présent avant le suivi par lot."
      icon={<PackagePlus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!article || !depot || !(Number(qty) > 0) || !reception || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le lot"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Article et lieu">
        <Field label="Article">
          <select className={inputClass} value={article} onChange={(e) => setArticle(Number(e.target.value))} autoFocus>
            <option value={0}>Choisir…</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.designation}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lieu de stockage">
          <select className={inputClass} value={depot} onChange={(e) => setDepot(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {state.depots
              .filter((d) => d.actif)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
          </select>
        </Field>
        {article > 0 && depot > 0 && <p className="text-[12px] text-muted num">Stock sans lot disponible : {formatQty(sansLot, 3)}</p>}
      </DrawerSection>
      <DrawerSection title="Lot">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantité">
            <input type="number" min="0" step="any" className={cn(inputClass, "num text-right", Number(qty) > sansLot && "border-warning")} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="N° lot fournisseur">
            <input className={inputClass} value={lotFournisseur} onChange={(e) => setLotFournisseur(e.target.value)} />
          </Field>
          <Field label="Reçu le">
            <input type="date" className={inputClass} value={reception} onChange={(e) => setReception(e.target.value)} />
          </Field>
          <Field label="DLC / DLUO">
            <input type="date" className={inputClass} value={dlc} onChange={(e) => setDlc(e.target.value)} />
          </Field>
        </div>
        <Field label="Fournisseur">
          <select className={inputClass} value={fournisseur} onChange={(e) => setFournisseur(Number(e.target.value))}>
            <option value={0}>—</option>
            {state.fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} · {f.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Observations">
          <input className={inputClass} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
