"use client";

import { useState } from "react";
import { Eye, Lock, MapPin, Plus, Search, ShieldCheck, Warehouse } from "lucide-react";
import { DrawerSection, SidePanel, SplitLayout } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { TYPE_LIEU_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Depot, TypeLieu } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

type FiltreDepot = "TOUS" | TypeLieu | "INACTIFS";

/** Tableau des dépôts (60 %) + fiche du dépôt sélectionné (40 %). */
export default function DepotsPage() {
  const { state, can, role } = useStore();
  // Côté administrateur, les dépôts se consultent uniquement : les dépôts système sont pilotés par le code.
  const canCreate = can("CREATE_DEPOT") && role !== "ADMIN_SI";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<FiltreDepot>("TOUS");

  const tous = [...state.depots].sort((a, b) => Number(b.est_systeme) - Number(a.est_systeme) || a.nom.localeCompare(b.nom, "fr"));
  const depots = tous.filter(
    (d) =>
      matchSearch(q, d.nom, d.adresse, d.role, d.code) &&
      (filtre === "TOUS" || (filtre === "INACTIFS" ? !d.actif : d.type_lieu === filtre)),
  );
  // Sur ordinateur, le premier dépôt s’affiche par défaut ; sur mobile, la fiche s’ouvre au clic.
  const selected = state.depots.find((d) => d.id === selectedId) ?? depots[0] ?? null;
  const lignesDe = (d: Depot) => state.stock.filter((s) => s.depot === d.id && num(s.quantite_physique) > 0);
  const usineCode = (id: number | null | undefined) => state.usines.find((u) => u.id === id)?.code ?? null;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Référentiel"
        title="Dépôts"
        description="Lieux de stockage : magasin matières et stock produits finis de chaque usine, dépôts extérieurs (points de vente), quarantaine. Le stock usine reste distinct du stock des dépôts extérieurs ; les dépôts « Rôle système » servent par défaut quand l’usine n’a pas désigné les siens."
        status={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-[3px] rounded-[5px] bg-surface-2 text-muted border border-line">
            <Eye size={12} /> Consultation
          </span>
        }
        actions={
          canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Dépôt
            </Button>
          ) : null
        }
      />

      <SplitLayout>
        <Panel className="overflow-hidden">
          <FilterBar
            shown={depots.length}
            total={tous.length}
            active={!!q || filtre !== "TOUS"}
            onReset={() => {
              setQ("");
              setFiltre("TOUS");
            }}
          >
            <SearchInput value={q} onChange={setQ} placeholder="Nom, adresse, rôle…" />
            <Segmented
              label="Type de lieu"
              value={filtre}
              onChange={setFiltre}
              options={[
                { value: "TOUS", label: "Tous" },
                ...(Object.keys(TYPE_LIEU_LABEL) as TypeLieu[])
                  .map((t) => ({ value: t as FiltreDepot, label: TYPE_LIEU_LABEL[t].split(" (")[0], count: tous.filter((d) => d.type_lieu === t).length }))
                  .filter((o) => o.count > 0),
                { value: "INACTIFS", label: "Inactifs", count: tous.filter((d) => !d.actif).length },
              ]}
            />
          </FilterBar>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-2.5 font-medium">Dépôt</th>
                  <th className="px-4 py-2.5 font-medium">Type de lieu</th>
                  <th className="px-4 py-2.5 font-medium text-right">Articles</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {depots.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[13px] text-muted">
                      {tous.length === 0 ? "Aucun dépôt." : "Aucun dépôt ne correspond à ces filtres."}
                    </td>
                  </tr>
                )}
                {depots.map((d) => {
                  const actif = d.id === selected?.id && !creating;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setCreating(false);
                        setSelectedId(d.id);
                      }}
                      className={cn(
                        "border-b border-line last:border-0 cursor-pointer transition-colors",
                        actif ? "bg-primary-soft" : "hover:bg-primary-soft/50",
                        !d.actif && "opacity-70",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              "h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center",
                              d.est_systeme ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted border border-line",
                            )}
                          >
                            <Warehouse size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium truncate">
                              {d.nom}
                              {d.code && <span className="ml-1.5 text-[11px] text-muted font-normal num">{d.code}</span>}
                            </p>
                            <p className="text-[11.5px] text-muted truncate">
                              {usineCode(d.usine) ? `${usineCode(d.usine)} · ` : ""}
                              {d.adresse || "Adresse non renseignée"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[12px]">{d.type_lieu ? TYPE_LIEU_LABEL[d.type_lieu] : "—"}</span>
                          {d.est_systeme && <StatusBadge tone="info">Rôle système</StatusBadge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] num">{lignesDe(d).length}</td>
                      <td className="px-4 py-3">{d.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {creating && canCreate ? (
          <CreateDepotPanel onClose={() => setCreating(false)} />
        ) : selected ? (
          <DepotPanel key={selected.id} depot={selected} mobileOpen={selectedId != null} onClose={() => setSelectedId(null)} />
        ) : (
          <SidePanel title="Détail du dépôt" icon={<Warehouse size={16} />}>
            <p className="text-[12.5px] text-muted">Aucun dépôt à afficher.</p>
          </SidePanel>
        )}
      </SplitLayout>
    </div>
  );
}

function DepotPanel({ depot, mobileOpen, onClose }: { depot: Depot; mobileOpen: boolean; onClose: () => void }) {
  const { state, articleName } = useStore();
  const [q, setQ] = useState("");
  const lignes = state.stock
    .filter((s) => s.depot === depot.id && num(s.quantite_physique) > 0)
    .map((s) => ({ ...s, nom: articleName(s.article), dispo: stockDisponible(s) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const visibles = lignes.filter((l) => matchSearch(q, l.nom));
  const totalPhysique = lignes.reduce((a, l) => a + num(l.quantite_physique), 0);
  const totalBloque = lignes.reduce((a, l) => a + num(l.quantite_bloquee), 0);
  const totalDispo = lignes.reduce((a, l) => a + l.dispo, 0);

  return (
    <SidePanel
      mobileOpen={mobileOpen}
      onClose={mobileOpen ? onClose : undefined}
      title={depot.nom}
      subtitle={
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} /> {depot.adresse || "Adresse non renseignée"}
        </span>
      }
      icon={<Warehouse size={16} />}
    >
      <div className="flex flex-wrap gap-1.5">
        {depot.type_lieu && <StatusBadge tone="teal">{TYPE_LIEU_LABEL[depot.type_lieu]}</StatusBadge>}
        {depot.est_systeme && <StatusBadge tone="info">Rôle système</StatusBadge>}
        {depot.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>}
      </div>

      {depot.est_systeme && depot.role && (
        <div className="rounded-[9px] border border-primary/20 bg-primary-soft/40 px-3 py-2.5 flex gap-2.5">
          <ShieldCheck size={15} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[12px] text-muted leading-relaxed">{depot.role}</p>
        </div>
      )}

      <dl className="rounded-[9px] border border-line divide-y divide-line text-[12.5px]">
        {[
          ["Code", depot.code ?? "—"],
          ["Usine", state.usines.find((u) => u.id === depot.usine)?.nom ?? "—"],
          ["Activité", state.activites.find((a) => a.id === depot.activite)?.designation ?? "Toutes activités"],
          ["Articles autorisés", depot.articles_autorises?.length ? `${depot.articles_autorises.length} article(s)` : "Tous"],
          ["Gestion des lots", depot.gestion_lots === false ? "Non" : "Oui"],
        ].map(([k, v]) => (
          <div key={k} className="px-3 py-2 flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Articles", value: formatQty(lignes.length, 0) },
          { label: "Physique", value: formatQty(totalPhysique, 0) },
          { label: "Bloqué", value: formatQty(totalBloque, 0), tone: totalBloque > 0 ? "text-warning" : "" },
          { label: "Disponible", value: formatQty(totalDispo, 0), tone: "text-success" },
        ].map((t) => (
          <div key={t.label} className="rounded-[8px] border border-line bg-surface-2/60 px-3 py-2 min-w-0">
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium">{t.label}</p>
            <p className={cn("text-[16px] font-semibold num mt-0.5 leading-tight", t.tone)}>{t.value}</p>
          </div>
        ))}
      </div>

      <DrawerSection title={`Stock présent (${lignes.length})`}>
        {lignes.length === 0 ? (
          <p className="text-[12.5px] text-muted rounded-[8px] border border-dashed border-line-strong px-3 py-6 text-center">Aucun article en stock.</p>
        ) : (
          <>
            {lignes.length > 5 && (
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input className={cn(inputClass, "h-8 pl-7 text-[12.5px]")} placeholder="Rechercher un article…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            )}
            <ul className="rounded-[9px] border border-line divide-y divide-line">
              {visibles.length === 0 && <li className="px-3 py-4 text-center text-[12px] text-muted">Aucun article trouvé.</li>}
              {visibles.map((l) => (
                <li key={l.id} className="px-3 py-2 flex items-center gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium truncate">{l.nom}</p>
                    <p className="text-[11px] text-muted num">
                      Physique {formatQty(num(l.quantite_physique), 2)}
                      {num(l.quantite_bloquee) > 0 && <span className="text-warning"> · bloqué {formatQty(num(l.quantite_bloquee), 2)}</span>}
                    </p>
                  </div>
                  <span className="text-[12.5px] num font-semibold shrink-0" title="Disponible">
                    {formatQty(l.dispo, 2)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </DrawerSection>

      <p className="text-[12px] text-muted flex items-start gap-1.5">
        <Lock size={12} className="mt-0.5 shrink-0" />
        {depot.est_systeme ? "Dépôt système : nom et statut verrouillés, aucune modification depuis cet écran." : "Consultation uniquement depuis cet écran."}
      </p>
    </SidePanel>
  );
}

/** Création d’un dépôt standard (profils autorisés hors Admin SI). */
function CreateDepotPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [typeLieu, setTypeLieu] = useState<TypeLieu>("DEPOT_EXTERIEUR");
  const [usine, setUsine] = useState(0);
  const [activite, setActivite] = useState(0);
  const [gestionLots, setGestionLots] = useState(true);
  const [saving, setSaving] = useState(false);
  // Un magasin matières ou un stock usine est forcément rattaché à une usine.
  const usineRequise = typeLieu === "MAGASIN_MATIERES" || typeLieu === "STOCK_USINE";

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "CREATE_DEPOT",
      nom: nom.trim(),
      adresse,
      type_lieu: typeLieu,
      usine: usine || null,
      activite: activite || null,
      gestion_lots: gestionLots,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <SidePanel
      mobileOpen
      onClose={onClose}
      title="Nouveau dépôt"
      icon={<Warehouse size={16} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!nom.trim() || (usineRequise && !usine) || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le dépôt"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Dépôt">
        <Field label="Nom">
          <input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} autoFocus />
        </Field>
        <Field label="Adresse">
          <input className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </Field>
        <Field label="Type de lieu">
          <select className={inputClass} value={typeLieu} onChange={(e) => setTypeLieu(e.target.value as TypeLieu)}>
            {(Object.keys(TYPE_LIEU_LABEL) as TypeLieu[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LIEU_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={usineRequise ? "Usine *" : "Usine"}>
          <select className={inputClass} value={usine} onChange={(e) => setUsine(Number(e.target.value))}>
            <option value={0}>—</option>
            {state.usines.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} · {u.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Activité">
          <select className={inputClass} value={activite} onChange={(e) => setActivite(Number(e.target.value))}>
            <option value={0}>Toutes activités</option>
            {state.activites.map((a) => (
              <option key={a.id} value={a.id}>
                {a.designation}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={gestionLots} onChange={(e) => setGestionLots(e.target.checked)} />
          Gestion des lots
        </label>
      </DrawerSection>
    </SidePanel>
  );
}
