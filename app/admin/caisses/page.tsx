"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Landmark, Lock, Plus, Vault } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { displayName } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Caisse } from "@/lib/types";
import { cn, formatDa, num } from "@/lib/utils";

type Edition = { mode: "create"; caissier?: number } | { mode: "edit"; caisse: Caisse };

export default function CaissesPage() {
  const { state, can, userName } = useStore();
  const writable = can("ADMIN_USERS");
  const [edition, setEdition] = useState<Edition | null>(null);
  const close = useCallback(() => setEdition(null), []);

  const affectes = new Set(state.caisses.filter((c) => !c.est_principale && c.caissier != null).map((c) => c.caissier));
  const caissiersSansCaisse = state.utilisateurs.filter((u) => u.profil === "CAISSIER" && u.actif && !affectes.has(u.id));
  // Caisse principale en premier, puis les caisses actives par nom.
  const toutes = [...state.caisses].sort(
    (a, b) => Number(b.est_principale) - Number(a.est_principale) || Number(b.actif) - Number(a.actif) || a.nom.localeCompare(b.nom, "fr"),
  );

  const [q, setQ] = useState("");
  const [fStatut, setFStatut] = useState<"TOUTES" | "ACTIVES" | "INACTIVES" | "SANS" | "OUVERTES">("TOUTES");
  const ordinaires = toutes.filter((c) => !c.est_principale);
  const caisses = toutes.filter((c) => {
    if (!matchSearch(q, c.nom, c.emplacement, c.caissier_nom, c.caissier ? userName(c.caissier) : "")) return false;
    // La caisse principale reste visible dans la vue « Toutes » uniquement.
    if (fStatut === "TOUTES") return true;
    if (c.est_principale) return false;
    if (fStatut === "ACTIVES") return c.actif;
    if (fStatut === "INACTIVES") return !c.actif;
    if (fStatut === "SANS") return c.caissier == null;
    return c.session_ouverte != null;
  });

  return (
    <div className="space-y-4 max-w-[1200px]">
      <PageHeader
        eyebrow="Administration"
        title="Caisses"
        description="Une caisse par caissier : sans caisse affectée, il ne peut ouvrir aucune session. La caisse principale consolide automatiquement toutes les caisses."
        actions={
          writable ? (
            <Button onClick={() => setEdition({ mode: "create" })}>
              <Plus size={15} /> Caisse
            </Button>
          ) : null
        }
      />

      {caissiersSansCaisse.length > 0 && (
        <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3" role="alert">
          <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-danger">
              {caissiersSansCaisse.length} caissier{caissiersSansCaisse.length > 1 ? "s" : ""} sans caisse affectée
            </p>
            <p className="text-[12px] text-danger/80 mt-0.5">Ils ne peuvent ni ouvrir de session ni encaisser tant qu’une caisse ne leur est pas attribuée.</p>
            <ul className="flex flex-wrap gap-2 mt-2.5">
              {caissiersSansCaisse.map((u) => (
                <li key={u.id}>
                  {writable ? (
                    <button
                      type="button"
                      onClick={() => setEdition({ mode: "create", caissier: u.id })}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] bg-surface border border-danger/30 text-[12px] font-medium text-danger hover:bg-danger hover:text-white transition-colors"
                    >
                      {displayName(u)} · Affecter
                    </button>
                  ) : (
                    <span className="inline-flex h-7 px-2.5 items-center rounded-[6px] bg-surface border border-danger/30 text-[12px] text-danger">{displayName(u)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Panel className="overflow-hidden">
        <FilterBar shown={caisses.length} total={toutes.length} active={!!q || fStatut !== "TOUTES"} onReset={() => { setQ(""); setFStatut("TOUTES"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="Caisse, emplacement, caissier…" />
          <Segmented label="Statut" value={fStatut} onChange={setFStatut} options={[
            { value: "TOUTES", label: "Toutes" },
            { value: "ACTIVES", label: "Actives", count: ordinaires.filter((c) => c.actif).length },
            { value: "OUVERTES", label: "Session ouverte", count: ordinaires.filter((c) => c.session_ouverte != null).length },
            { value: "SANS", label: "Sans caissier", count: ordinaires.filter((c) => c.caissier == null).length },
            { value: "INACTIVES", label: "Inactives", count: ordinaires.filter((c) => !c.actif).length },
          ]} />
        </FilterBar>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-muted">
              <th className="px-4 py-2.5 font-medium">Caisse</th>
              <th className="px-4 py-2.5 font-medium">Caissier affecté</th>
              <th className="px-4 py-2.5 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {caisses.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-[13px] text-muted">
                  {toutes.length === 0 ? "Aucune caisse pour l’instant." : "Aucune caisse ne correspond à ces filtres."}
                </td>
              </tr>
            )}
            {caisses.map((c) => {
              const editable = writable && !c.est_principale;
              return (
                <tr
                  key={c.id}
                  onClick={editable ? () => setEdition({ mode: "edit", caisse: c }) : undefined}
                  className={cn(
                    "border-b border-line last:border-0 transition-colors",
                    c.est_principale ? "bg-primary-soft/40" : editable && "cursor-pointer hover:bg-primary-soft/50",
                    !c.actif && "opacity-70",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center",
                          c.est_principale ? "bg-sidebar text-white" : "bg-surface-2 text-muted border border-line",
                        )}
                      >
                        {c.est_principale ? <Landmark size={15} /> : <Vault size={15} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{c.nom}</p>
                        <p className="text-[11.5px] text-muted truncate">
                          {c.est_principale ? `Solde consolidé ${formatDa(num(c.solde_actuel))}` : c.emplacement || "Emplacement non renseigné"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    {c.est_principale ? (
                      <span className="text-muted inline-flex items-center gap-1.5">
                        <Lock size={12} /> Aucun (automatique)
                      </span>
                    ) : c.caissier ? (
                      c.caissier_nom ?? userName(c.caissier)
                    ) : (
                      <span className="text-danger font-medium">À affecter</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.est_principale ? (
                      <StatusBadge tone="info">Consolidation</StatusBadge>
                    ) : c.actif ? (
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <StatusBadge tone="success">Active</StatusBadge>
                        {c.session_ouverte != null && <StatusBadge tone="teal">Session ouverte</StatusBadge>}
                      </span>
                    ) : (
                      <StatusBadge tone="neutral">Inactive</StatusBadge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {edition && <CaisseDrawer key={edition.mode === "edit" ? edition.caisse.id : "new"} edition={edition} onClose={close} />}
    </div>
  );
}

function CaisseDrawer({ edition, onClose }: { edition: Edition; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const caisse = edition.mode === "edit" ? edition.caisse : null;
  const [nom, setNom] = useState(caisse?.nom ?? "");
  const [emplacement, setEmplacement] = useState(caisse?.emplacement ?? "");
  const [caissier, setCaissier] = useState<number>(caisse?.caissier ?? (edition.mode === "create" ? edition.caissier ?? 0 : 0));
  const [actif, setActif] = useState(caisse?.actif ?? true);
  const [saving, setSaving] = useState(false);

  // Liste déroulante : caissiers actifs libres, plus celui déjà affecté à cette caisse.
  const pris = new Set(state.caisses.filter((c) => !c.est_principale && c.id !== caisse?.id && c.caissier != null).map((c) => c.caissier));
  const options = state.utilisateurs.filter((u) => u.profil === "CAISSIER" && (u.actif || u.id === caisse?.caissier) && !pris.has(u.id));
  const sessionOuverte = caisse?.session_ouverte != null;

  async function submit() {
    setSaving(true);
    const ok = caisse
      ? await dispatch({ type: "PATCH_CAISSE", id: caisse.id, nom: nom.trim(), emplacement, caissier: caissier || null, actif })
      : await dispatch({ type: "CREATE_CAISSE", nom: nom.trim(), emplacement, caissier: caissier || null });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={caisse ? caisse.nom : "Nouvelle caisse"}
      subtitle={caisse ? `Solde actuel ${formatDa(num(caisse.solde_actuel))}` : "Elle apparaîtra dans la consolidation de la caisse principale."}
      icon={<Vault size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!nom.trim() || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : caisse ? "Enregistrer" : "Créer la caisse"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Caisse">
        <Field label="Nom">
          <input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Caisse boutique 1" autoFocus />
        </Field>
        <Field label="Emplacement">
          <input className={inputClass} value={emplacement} onChange={(e) => setEmplacement(e.target.value)} placeholder="Boutique, dépôt…" />
        </Field>
      </DrawerSection>

      <DrawerSection title="Caissier affecté" hint="Un caissier n’a qu’une seule caisse.">
        <select className={inputClass} value={caissier} onChange={(e) => setCaissier(Number(e.target.value))} disabled={sessionOuverte}>
          <option value={0}>— À affecter plus tard —</option>
          {options.map((u) => (
            <option key={u.id} value={u.id}>
              {displayName(u)} ({u.username})
            </option>
          ))}
        </select>
        {sessionOuverte && <p className="text-[11.5px] text-warning">Une session est ouverte : clôturez-la avant de changer de caissier.</p>}
        {options.length === 0 && !caissier && <p className="text-[11.5px] text-muted">Aucun caissier libre : créez d’abord un compte Caissier.</p>}
      </DrawerSection>

      {caisse && (
        <DrawerSection title="Statut">
          <label className="flex items-center justify-between gap-3 rounded-[9px] border border-line px-3.5 py-3 cursor-pointer">
            <span>
              <span className="block text-[13px] font-medium">{actif ? "Caisse active" : "Caisse inactive"}</span>
              <span className="block text-[11.5px] text-muted">Une caisse inactive ne peut plus ouvrir de session.</span>
            </span>
            <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={actif} onChange={(e) => setActif(e.target.checked)} disabled={sessionOuverte} />
          </label>
        </DrawerSection>
      )}
    </Drawer>
  );
}
