"use client";

import { useState } from "react";
import { ArrowRight, Ban, FileText, PackageCheck, Plus, Send, Trash2, Truck } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, api, endpoints } from "@/lib/api";
import { stockDisponible } from "@/lib/engine";
import { STATUT_TRANSFERT_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { StatutTransfert, TransfertStock } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

const TONE: Record<StatutTransfert, "neutral" | "info" | "success" | "danger"> = { BROUILLON: "neutral", EXPEDIE: "info", RECU: "success", ANNULE: "danger" };

/**
 * Bons de transfert entre lieux (stock usine → dépôt extérieur…) : le stock bouge vraiment.
 * L’expédition sort la marchandise du lieu source (tout ou rien), la réception l’entre au lieu de
 * destination au coût de la sortie ; entre les deux, elle est en transit.
 */
export default function TransfertsPage() {
  const { state, can } = useStore();
  const [vue, setVue] = useState<StatutTransfert | "EN_COURS" | "TOUS">("EN_COURS");
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [nouveau, setNouveau] = useState(false);
  const tous = [...state.transfertsStock].sort((a, b) => b.date_creation.localeCompare(a.date_creation));
  const lignes = tous
    .filter((t) => (vue === "TOUS" ? true : vue === "EN_COURS" ? t.statut === "BROUILLON" || t.statut === "EXPEDIE" : t.statut === vue))
    .filter((t) => matchSearch(q, t.numero, t.depot_source_nom, t.depot_destination_nom));
  const transfert = state.transfertsStock.find((t) => t.id === ouvert) ?? null;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Stocks"
        title="Bons de transfert"
        description="Approvisionnement des dépôts extérieurs depuis le stock usine : préparation (brouillon), expédition (sortie du lieu source), réception confirmée au dépôt (entrée au coût de la sortie)."
        actions={
          can("GERER_TRANSFERTS") ? (
            <Button onClick={() => setNouveau(true)}>
              <Plus size={15} /> Nouveau transfert
            </Button>
          ) : null
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar shown={lignes.length} total={tous.length} active={!!q || vue !== "EN_COURS"} onReset={() => { setQ(""); setVue("EN_COURS"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="N°, lieu…" />
          <Segmented
            label="Statut"
            value={vue}
            onChange={setVue}
            options={[
              { value: "EN_COURS", label: "En cours", count: tous.filter((t) => t.statut === "BROUILLON" || t.statut === "EXPEDIE").length },
              { value: "EXPEDIE", label: "En transit", count: tous.filter((t) => t.statut === "EXPEDIE").length },
              { value: "RECU", label: "Reçus" },
              { value: "TOUS", label: "Tous" },
            ]}
          />
        </FilterBar>
        <DataTable
          emptyText={tous.length ? "Aucun transfert pour ces filtres." : "Aucun bon de transfert."}
          columns={[
            { key: "n", label: "Bon" },
            { key: "t", label: "Trajet" },
            { key: "l", label: "Lignes", className: "text-right" },
            { key: "d", label: "Créé" },
            { key: "e", label: "Expédié / reçu" },
            { key: "s", label: "Statut" },
          ]}
          rows={lignes.map((t) => ({
            _id: t.id,
            n: <span className="num font-medium">{t.numero}</span>,
            t: (
              <span className="inline-flex items-center gap-1.5">
                {t.depot_source_nom} <ArrowRight size={12} className="text-muted" /> {t.depot_destination_nom}
              </span>
            ),
            l: <span className="num">{t.lignes.length}</span>,
            d: formatDateTime(t.date_creation),
            e: t.date_reception ? `Reçu ${formatDateTime(t.date_reception)}` : t.date_expedition ? `Expédié ${formatDateTime(t.date_expedition)}` : "—",
            s: <StatusBadge tone={TONE[t.statut]}>{STATUT_TRANSFERT_LABEL[t.statut]}</StatusBadge>,
          }))}
          onRowClick={(row) => setOuvert(Number(row._id))}
        />
      </Panel>
      {transfert && <TransfertDrawer transfert={transfert} onClose={() => setOuvert(null)} />}
      {nouveau && (
        <NouveauTransfertDrawer
          onClose={(id) => {
            setNouveau(false);
            if (id) setOuvert(id);
          }}
        />
      )}
    </div>
  );
}

function NouveauTransfertDrawer({ onClose }: { onClose: (id?: number) => void }) {
  const { state, dispatch } = useStore();
  const lieux = state.depots.filter((d) => d.actif);
  const [source, setSource] = useState(lieux.find((d) => d.type_lieu === "STOCK_USINE")?.id ?? 0);
  const [destination, setDestination] = useState(lieux.find((d) => d.type_lieu === "DEPOT_EXTERIEUR")?.id ?? 0);
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    let id: number | undefined;
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        id = (await api.post<TransfertStock>(endpoints.transfertsStock, { depot_source: source, depot_destination: destination, observations: obs.trim() })).id;
      },
      refresh: ["transfertsStock"],
    });
    setSaving(false);
    if (ok) onClose(id);
  }

  const option = (d: (typeof lieux)[number]) => (
    <option key={d.id} value={d.id}>
      {d.code ? `${d.code} · ` : ""}
      {d.nom}
    </option>
  );

  return (
    <Drawer
      open
      onClose={() => onClose()}
      title="Nouveau bon de transfert"
      icon={<Truck size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose()}>
            Annuler
          </Button>
          <Button disabled={!source || !destination || source === destination || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer et ajouter les lignes"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Trajet">
        <Field label="Lieu source">
          <select className={inputClass} value={source} onChange={(e) => setSource(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {lieux.map(option)}
          </select>
        </Field>
        <Field label="Lieu de destination">
          <select className={inputClass} value={destination} onChange={(e) => setDestination(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {lieux.filter((d) => d.id !== source).map(option)}
          </select>
        </Field>
        <Field label="Observations">
          <input className={inputClass} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}

function TransfertDrawer({ transfert, onClose }: { transfert: TransfertStock; onClose: () => void }) {
  const { state, dispatch, can, articleName, userName } = useStore();
  const writable = can("GERER_TRANSFERTS");
  const brouillon = transfert.statut === "BROUILLON";
  const [article, setArticle] = useState(0);
  const [lot, setLot] = useState(0);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  // Articles présents au lieu source, avec leur disponible.
  const enStock = state.stock.filter((s) => s.depot === transfert.depot_source && stockDisponible(s) > 0);
  const dispo = (id: number) => stockDisponible(enStock.find((s) => s.article === id) ?? { id: 0, article: id, depot: 0, quantite_physique: "0", quantite_bloquee: "0", quantite_reservee: "0" });
  const lots = state.lots.filter((l) => l.article === article && l.statut === "LIBERE");
  const run = async (fn: () => Promise<unknown>, fermer = false) => {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: ["transfertsStock", "stock", "mouvements"] });
    setBusy(false);
    if (ok && fermer) onClose();
    return ok;
  };

  async function ajouter() {
    const ok = await run(() => actions.ajouterLigneTransfert({ transfert: transfert.id, article, quantite: Number(qty), lot: lot || null }));
    if (ok) {
      setArticle(0);
      setLot(0);
      setQty("");
    }
  }

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={transfert.numero}
      subtitle={`${transfert.depot_source_nom} → ${transfert.depot_destination_nom}`}
      icon={<Truck size={17} />}
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={() => void actions.pdf("bonTransfert", transfert.id, transfert.numero).catch(() => {})}>
            <FileText size={14} /> Bon (PDF)
          </Button>
          {writable && brouillon && (
            <>
              <Button variant="ghost" className="text-danger" disabled={busy} onClick={() => void run(() => actions.annulerTransfert(transfert.id), true)}>
                <Ban size={14} /> Annuler
              </Button>
              <Button disabled={busy || transfert.lignes.length === 0} onClick={() => void run(() => actions.expedierTransfert(transfert.id))}>
                <Send size={14} /> Expédier
              </Button>
            </>
          )}
          {writable && transfert.statut === "EXPEDIE" && (
            <Button variant="success" disabled={busy} onClick={() => void run(() => actions.receptionnerTransfert(transfert.id), true)}>
              <PackageCheck size={14} /> Confirmer la réception
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge tone={TONE[transfert.statut]}>{STATUT_TRANSFERT_LABEL[transfert.statut]}</StatusBadge>
      </div>
      <DrawerSection title="Suivi">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
          {[
            ["Créé", `${formatDateTime(transfert.date_creation)} · ${userName(transfert.cree_par)}`],
            ["Expédié", transfert.date_expedition ? `${formatDateTime(transfert.date_expedition)}${transfert.expedie_par ? ` · ${userName(transfert.expedie_par)}` : ""}` : "—"],
            ["Reçu", transfert.date_reception ? `${formatDateTime(transfert.date_reception)}${transfert.recu_par ? ` · ${userName(transfert.recu_par)}` : ""}` : "—"],
            ["Observations", transfert.observations || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </DrawerSection>
      <DrawerSection title={`Lignes (${transfert.lignes.length})`} hint={brouillon ? "Modifiables tant que le bon est en brouillon." : "Bon expédié : lignes figées."}>
        <div className="rounded-[9px] border border-line overflow-hidden">
          <DataTable
            emptyText="Aucune ligne."
            columns={[
              { key: "a", label: "Article" },
              { key: "l", label: "Lot" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={transfert.lignes.map((l) => ({
              a: articleName(l.article),
              l: l.lot ? (state.lots.find((x) => x.id === l.lot)?.numero_lot ?? `#${l.lot}`) : "—",
              q: <span className="num">{formatQty(num(l.quantite), 3)}</span>,
              x:
                writable && brouillon ? (
                  <button
                    type="button"
                    aria-label="Retirer la ligne"
                    className="h-7 w-7 rounded-[6px] inline-flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
                    onClick={() => void run(() => actions.supprimerLigneTransfert(l.id))}
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  ""
                ),
            }))}
          />
        </div>
        {writable && brouillon && (
          <div className="rounded-[9px] border border-primary/30 bg-primary-soft/30 p-3 space-y-2">
            <div className="grid sm:grid-cols-[1fr_120px] gap-2">
              <Field label="Article (disponible au lieu source)">
                <select
                  className={inputClass}
                  value={article}
                  onChange={(e) => {
                    setArticle(Number(e.target.value));
                    setLot(0);
                  }}
                >
                  <option value={0}>Choisir…</option>
                  {enStock.map((s) => (
                    <option key={s.article} value={s.article}>
                      {articleName(s.article)} · {formatQty(stockDisponible(s), 2)} dispo.
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantité">
                <input type="number" min="0" step="any" className={cn(inputClass, "num text-right", article > 0 && Number(qty) > dispo(article) && "border-danger")} value={qty} onChange={(e) => setQty(e.target.value)} />
              </Field>
            </div>
            {lots.length > 0 && (
              <Field label="Lot (libéré)">
                <select className={inputClass} value={lot} onChange={(e) => setLot(Number(e.target.value))}>
                  <option value={0}>Sans lot précis</option>
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.numero_lot} · {formatQty(num(l.quantite), 0)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="flex justify-end">
              <Button className="h-8" disabled={!article || !(Number(qty) > 0) || busy} onClick={() => void ajouter()}>
                <Plus size={14} /> Ajouter la ligne
              </Button>
            </div>
          </div>
        )}
      </DrawerSection>
    </Drawer>
  );
}
