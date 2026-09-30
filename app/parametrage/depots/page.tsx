"use client";

import { useCallback, useState } from "react";
import { Eye, Lock, MapPin, Plus, ShieldCheck, Warehouse } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { stockDisponible } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Depot } from "@/lib/types";
import { cn, formatQty, num } from "@/lib/utils";

export default function DepotsPage() {
  const { state, can, role } = useStore();
  // Côté administrateur, les dépôts se consultent uniquement : les dépôts système sont pilotés par le code.
  const canCreate = can("CREATE_DEPOT") && role !== "ADMIN_SI";
  const [viewId, setViewId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const close = useCallback(() => {
    setViewId(null);
    setCreating(false);
  }, []);

  const depots = [...state.depots].sort((a, b) => Number(b.est_systeme) - Number(a.est_systeme) || a.nom.localeCompare(b.nom, "fr"));
  const viewed = state.depots.find((d) => d.id === viewId) ?? null;
  const stockOf = (d: Depot) => state.stock.filter((s) => s.depot === d.id && num(s.quantite_physique) > 0);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <PageHeader
        eyebrow="Référentiel"
        title="Dépôts"
        description="Magasins de stockage des matières et des produits finis."
        actions={
          canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Dépôt
            </Button>
          ) : null
        }
      />

      <div className="rounded-[10px] border border-line bg-surface-2/60 px-4 py-3 flex items-start gap-3">
        <Eye size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-muted leading-relaxed">
          <span className="text-ink font-medium">Consultation uniquement.</span> Les dépôts marqués « Rôle système » (magasin principal, produits finis,
          quarantaine) sont utilisés automatiquement par la production, la qualité et les achats : leur nom et leur statut ne se modifient pas.
        </p>
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-muted">
              <th className="px-4 py-2.5 font-medium">Dépôt</th>
              <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Rôle</th>
              <th className="px-4 py-2.5 font-medium">Statut</th>
              <th className="px-4 py-2.5 w-12" />
            </tr>
          </thead>
          <tbody>
            {depots.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-[13px] text-muted">
                  Aucun dépôt.
                </td>
              </tr>
            )}
            {depots.map((d) => (
              <tr key={d.id} onClick={() => setViewId(d.id)} className={cn("border-b border-line last:border-0 cursor-pointer hover:bg-primary-soft/50 transition-colors", !d.actif && "opacity-70")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn("h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center", d.est_systeme ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted border border-line")}>
                      <Warehouse size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{d.nom}</p>
                      <p className="text-[11.5px] text-muted truncate">{d.adresse || "Adresse non renseignée"}</p>
                      {d.est_systeme && (
                        <span className="sm:hidden mt-1 inline-flex">
                          <StatusBadge tone="info">Rôle système</StatusBadge>
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {d.est_systeme ? (
                    <span className="inline-flex flex-col items-start gap-1">
                      <StatusBadge tone="info">Rôle système</StatusBadge>
                      {d.role && <span className="text-[11.5px] text-muted">{d.role}</span>}
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted">Dépôt standard</span>
                  )}
                </td>
                <td className="px-4 py-3">{d.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewId(d.id);
                    }}
                    className="h-8 w-8 rounded-[7px] flex items-center justify-center text-muted hover:text-primary hover:bg-primary-soft"
                    aria-label={`Voir ${d.nom}`}
                    title="Voir"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {viewed && (
        <Drawer
          open
          onClose={close}
          title={viewed.nom}
          subtitle={viewed.est_systeme ? "Dépôt système · lecture seule" : "Lecture seule"}
          icon={<Warehouse size={17} />}
        >
          <DrawerSection title="Informations">
            <dl className="rounded-[9px] border border-line divide-y divide-line text-[13px]">
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <dt className="text-muted inline-flex items-center gap-1.5">
                  <MapPin size={13} /> Adresse
                </dt>
                <dd className="text-right">{viewed.adresse || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <dt className="text-muted inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Rôle
                </dt>
                <dd className="text-right">
                  {viewed.est_systeme ? (
                    <span className="inline-flex flex-col items-end gap-1">
                      <StatusBadge tone="info">Rôle système</StatusBadge>
                      {viewed.role && <span className="text-[12px] text-muted">{viewed.role}</span>}
                    </span>
                  ) : (
                    "Dépôt standard"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <dt className="text-muted">Statut</dt>
                <dd>{viewed.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>}</dd>
              </div>
            </dl>
          </DrawerSection>

          <DrawerSection title="Stock présent">
            {(() => {
              const lignes = stockOf(viewed);
              return (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[8px] border border-line bg-surface-2/60 px-3 py-2.5">
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium">Articles</p>
                    <p className="text-[18px] font-semibold num mt-1">{lignes.length}</p>
                  </div>
                  <div className="rounded-[8px] border border-line bg-surface-2/60 px-3 py-2.5">
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium">Disponible</p>
                    <p className="text-[18px] font-semibold num mt-1">{formatQty(lignes.reduce((a, s) => a + stockDisponible(s), 0), 0)}</p>
                  </div>
                </div>
              );
            })()}
          </DrawerSection>

          <p className="text-[12px] text-muted flex items-center gap-1.5">
            <Lock size={12} /> Aucune modification possible depuis cet écran.
          </p>
        </Drawer>
      )}

      {creating && <CreateDepotDrawer onClose={close} />}
    </div>
  );
}

function CreateDepotDrawer({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_DEPOT", nom: nom.trim(), adresse });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau dépôt"
      icon={<Warehouse size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!nom.trim() || saving} onClick={() => void submit()}>
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
      </DrawerSection>
    </Drawer>
  );
}
