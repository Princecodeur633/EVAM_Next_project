"use client";

import { useState } from "react";
import { ArrowLeft, Eye, Lock, MapPin, Plus, Search, ShieldCheck, Warehouse, X } from "lucide-react";
import { Segmented, matchSearch } from "@/components/Filters";
import { Button, PageHeader, StatusBadge, inputClass } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Depot } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

type FiltreDepot = "TOUS" | "SYSTEME" | "STANDARD" | "INACTIFS";

/** Liste des dépôts à gauche, fiche du dépôt sélectionné à droite (même disposition que les fiches techniques). */
export default function DepotsPage() {
  const { state, can, role } = useStore();
  // Côté administrateur, les dépôts se consultent uniquement : les dépôts système sont pilotés par le code.
  const canCreate = can("CREATE_DEPOT") && role !== "ADMIN_SI";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<FiltreDepot>("TOUS");
  const [creating, setCreating] = useState(false);

  const tous = [...state.depots].sort((a, b) => Number(b.est_systeme) - Number(a.est_systeme) || a.nom.localeCompare(b.nom, "fr"));
  const depots = tous.filter(
    (d) =>
      matchSearch(q, d.nom, d.adresse, d.role) &&
      (filtre === "TOUS" || (filtre === "SYSTEME" ? d.est_systeme : filtre === "STANDARD" ? !d.est_systeme : !d.actif)),
  );
  // Sur ordinateur, le premier dépôt s’affiche par défaut ; sur mobile, on part de la liste.
  const choisi = selectedId != null;
  const selected = state.depots.find((d) => d.id === selectedId) ?? depots[0] ?? null;
  const nbArticles = (d: Depot) => state.stock.filter((s) => s.depot === d.id && num(s.quantite_physique) > 0).length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <PageHeader
        eyebrow="Référentiel"
        title="Dépôts"
        description="Magasins de stockage des matières et des produits finis. Les dépôts « Rôle système » sont utilisés automatiquement par la production, la qualité et les achats."
        status={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-[3px] rounded-[5px] bg-surface-2 text-muted border border-line">
            <Eye size={12} /> Consultation
          </span>
        }
      />

      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        {/* Liste des dépôts */}
        <aside className={cn("evam-card overflow-hidden lg:sticky lg:top-[72px]", choisi && "hidden lg:block")}>
          <div className="p-3 border-b border-line space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input className={cn(inputClass, "pl-8 h-8 text-[12.5px]")} placeholder="Nom, adresse, rôle…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Segmented
              label="Type de dépôt"
              value={filtre}
              onChange={setFiltre}
              options={[
                { value: "TOUS", label: "Tous", count: tous.length },
                { value: "SYSTEME", label: "Système", count: tous.filter((d) => d.est_systeme).length },
                { value: "STANDARD", label: "Standard", count: tous.filter((d) => !d.est_systeme).length },
                { value: "INACTIFS", label: "Inactifs", count: tous.filter((d) => !d.actif).length },
              ]}
            />
            {canCreate &&
              (creating ? (
                <CreateDepotForm onDone={() => setCreating(false)} />
              ) : (
                <Button variant="secondary" className="h-8 w-full" onClick={() => setCreating(true)}>
                  <Plus size={14} /> Nouveau dépôt
                </Button>
              ))}
          </div>
          <ul className="max-h-[calc(100dvh-280px)] overflow-y-auto overscroll-contain">
            {depots.length === 0 && (
              <li className="px-4 py-8 text-center text-[12.5px] text-muted">{tous.length ? "Aucun dépôt pour ces filtres." : "Aucun dépôt."}</li>
            )}
            {depots.map((d) => {
              const active = d.id === selected?.id;
              return (
                <li key={d.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors border-l-2",
                      active ? "bg-primary-soft border-primary" : "border-transparent hover:bg-surface-2",
                      !d.actif && "opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center",
                        d.est_systeme ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted border border-line",
                      )}
                    >
                      <Warehouse size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[13px] truncate", active ? "font-semibold" : "font-medium")}>{d.nom}</p>
                      <p className="text-[11.5px] text-muted truncate">
                        {nbArticles(d)} article(s) en stock{!d.actif ? " · inactif" : ""}
                      </p>
                    </div>
                    {d.est_systeme && <StatusBadge tone="info">Système</StatusBadge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Fiche du dépôt */}
        <section className={cn(!choisi && "hidden lg:block")}>
          {selected ? (
            <DepotDetail key={selected.id} depot={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <div className="evam-card px-6 py-16 text-center">
              <Warehouse size={28} className="mx-auto text-muted/60" />
              <p className="text-[14px] font-medium mt-3">Aucun dépôt</p>
              <p className="text-[12.5px] text-muted mt-1">Les dépôts apparaîtront ici dès qu’ils seront créés.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DepotDetail({ depot, onBack }: { depot: Depot; onBack: () => void }) {
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
    <div className="evam-card flex flex-col min-h-[420px]">
      <header className="px-4 sm:px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-start gap-3">
        <button type="button" onClick={onBack} className="lg:hidden inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink self-start">
          <ArrowLeft size={13} /> Liste
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-semibold tracking-tight break-words">{depot.nom}</h2>
            {depot.est_systeme && <StatusBadge tone="info">Rôle système</StatusBadge>}
            {depot.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>}
          </div>
          <p className="text-[12px] text-muted mt-1 inline-flex items-center gap-1.5">
            <MapPin size={12} /> {depot.adresse || "Adresse non renseignée"}
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-5 py-4 flex-1 space-y-5">
        {depot.est_systeme && depot.role && (
          <div className="rounded-[9px] border border-primary/20 bg-primary-soft/40 px-3.5 py-3 flex gap-3">
            <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold">Rôle dans EVAM</p>
              <p className="text-[12.5px] text-muted mt-0.5 leading-relaxed">{depot.role}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Articles", value: formatQty(lignes.length, 0) },
            { label: "Physique", value: formatQty(totalPhysique, 0) },
            { label: "Bloqué", value: formatQty(totalBloque, 0), tone: totalBloque > 0 ? "text-warning" : "" },
            { label: "Disponible", value: formatQty(totalDispo, 0), tone: "text-success" },
          ].map((t) => (
            <div key={t.label} className="rounded-[8px] border border-line bg-surface-2/60 px-3 py-2.5 min-w-0">
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium">{t.label}</p>
              <p className={cn("text-[18px] font-semibold num mt-1 leading-none", t.tone)}>{t.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-[13px] font-semibold">
              Stock présent <span className="text-muted font-normal">({lignes.length})</span>
            </h3>
            {lignes.length > 0 && (
              <div className="relative sm:w-[240px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input className={cn(inputClass, "h-8 pl-7 text-[12.5px]")} placeholder="Rechercher un article…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            )}
          </div>
          {lignes.length === 0 ? (
            <div className="rounded-[9px] border border-dashed border-line-strong px-4 py-10 text-center">
              <p className="text-[13px] text-muted">Aucun article en stock dans ce dépôt.</p>
            </div>
          ) : (
            <div className="rounded-[9px] border border-line overflow-x-auto">
              <table className="w-full text-left min-w-[520px]">
                <thead>
                  <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-3 py-2 font-medium">Article</th>
                    <th className="px-3 py-2 font-medium text-right">Physique</th>
                    <th className="px-3 py-2 font-medium text-right">Bloqué</th>
                    <th className="px-3 py-2 font-medium text-right">Réservé</th>
                    <th className="px-3 py-2 font-medium text-right">Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-[12.5px] text-muted">
                        Aucun article ne correspond à la recherche.
                      </td>
                    </tr>
                  )}
                  {visibles.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0 text-[13px]">
                      <td className="px-3 py-2.5 font-medium">{l.nom}</td>
                      <td className="px-3 py-2.5 text-right num">{formatQty(num(l.quantite_physique), 2)}</td>
                      <td className={cn("px-3 py-2.5 text-right num", num(l.quantite_bloquee) > 0 && "text-warning")}>{formatQty(num(l.quantite_bloquee), 2)}</td>
                      <td className="px-3 py-2.5 text-right num text-muted">{formatQty(num(l.quantite_reservee), 2)}</td>
                      <td className="px-3 py-2.5 text-right num font-semibold">{formatQty(l.dispo, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer className="px-4 sm:px-5 py-3 border-t border-line bg-surface-2/60 rounded-b-[10px] text-[12px] text-muted flex items-center gap-2">
        <Lock size={13} />
        {depot.est_systeme ? "Dépôt système : nom et statut verrouillés, aucune modification depuis cet écran." : "Consultation uniquement depuis cet écran."}
      </footer>
    </div>
  );
}

/** Création d’un dépôt standard directement dans la colonne de gauche (profils autorisés hors Admin SI). */
function CreateDepotForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useStore();
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_DEPOT", nom: nom.trim(), adresse });
    setSaving(false);
    if (ok) onDone();
  }

  return (
    <div className="rounded-[8px] border border-line bg-surface-2 p-2.5 space-y-2">
      <input className={cn(inputClass, "h-8 text-[12.5px]")} placeholder="Nom du dépôt" value={nom} onChange={(e) => setNom(e.target.value)} autoFocus />
      <input className={cn(inputClass, "h-8 text-[12.5px]")} placeholder="Adresse (facultatif)" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      <div className="flex gap-2">
        <Button className="h-8 flex-1" disabled={!nom.trim() || saving} onClick={() => void submit()}>
          {saving ? "Création…" : "Créer le dépôt"}
        </Button>
        <Button className="h-8" variant="ghost" onClick={onDone} aria-label="Annuler">
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
