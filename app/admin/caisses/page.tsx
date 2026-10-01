"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Landmark, Lock, Plus, Vault, Zap } from "lucide-react";
import { DrawerSection, SidePanel, SplitLayout } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { displayName } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Caisse } from "@/lib/types";
import { cn, formatDa, num } from "@/lib/utils";

/** Contenu du panneau de droite ; null = état par défaut (formulaire de création). */
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
    <div className="space-y-4 max-w-[1440px]">
      {caissiersSansCaisse.length > 0 && (
        <div className="rounded-[10px] border border-danger/30 bg-danger-soft overflow-hidden flex" role="alert">
          <span className="w-1 shrink-0 bg-danger" />
          <div className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 flex-1 min-w-0">
            <AlertTriangle size={18} className="text-danger shrink-0 hidden md:block" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-danger">
                {caissiersSansCaisse.length} caissier{caissiersSansCaisse.length > 1 ? "s" : ""} sans caisse
              </p>
              <p className="text-[12px] text-danger/80 mt-0.5">
                {caissiersSansCaisse.map((u) => displayName(u)).join(", ")} : aucune session ni encaissement possible tant qu’une caisse n’est pas attribuée.
              </p>
            </div>
            {writable && (
              <Button
                variant="danger"
                className="shrink-0"
                title={`Nouvelle caisse pour ${displayName(caissiersSansCaisse[0])}`}
                onClick={() => setEdition({ mode: "create", caissier: caissiersSansCaisse[0].id })}
              >
                <Zap size={14} /> Affecter une caisse
              </Button>
            )}
          </div>
        </div>
      )}

      <PageHeader
        eyebrow="Configuration"
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

      <SplitLayout>
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
              const actif = edition?.mode === "edit" && edition.caisse.id === c.id;
              return (
                <tr
                  key={c.id}
                  onClick={() => setEdition({ mode: "edit", caisse: c })}
                  className={cn(
                    "border-b border-line last:border-0 transition-colors cursor-pointer",
                    actif ? "bg-primary-soft" : c.est_principale ? "bg-primary-soft/40 hover:bg-primary-soft/70" : "hover:bg-primary-soft/50",
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

      {/* Panneau de droite : fiche de la caisse cliquée, sinon formulaire de création. */}
      {edition?.mode === "edit" && edition.caisse.est_principale ? (
        <PrincipalePanel caisse={state.caisses.find((c) => c.id === edition.caisse.id) ?? edition.caisse} onClose={close} />
      ) : edition?.mode === "edit" && writable ? (
        <CaissePanel key={edition.caisse.id} edition={{ mode: "edit", caisse: state.caisses.find((c) => c.id === edition.caisse.id) ?? edition.caisse }} onClose={close} mobileOpen />
      ) : writable ? (
        <CaissePanel
          key={edition?.mode === "create" ? `new-${edition.caissier ?? 0}` : "new"}
          edition={edition?.mode === "create" ? edition : { mode: "create" }}
          onClose={edition ? close : undefined}
          mobileOpen={edition != null}
        />
      ) : (
        <SidePanel title="Détail de la caisse" icon={<Vault size={16} />}>
          <p className="text-[12.5px] text-muted">Cliquez sur une caisse du tableau pour afficher ses informations.</p>
        </SidePanel>
      )}
      </SplitLayout>
    </div>
  );
}

function CaissePanel({ edition, onClose, mobileOpen }: { edition: Edition; onClose?: () => void; mobileOpen: boolean }) {
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
    if (ok) {
      if (!caisse) {
        setNom("");
        setEmplacement("");
        setCaissier(0);
      }
      onClose?.();
    }
  }

  return (
    <SidePanel
      mobileOpen={mobileOpen}
      onClose={onClose}
      title={caisse ? caisse.nom : "Nouvelle caisse"}
      subtitle={caisse ? `Solde actuel ${formatDa(num(caisse.solde_actuel))}` : "Elle apparaîtra dans la consolidation de la caisse principale."}
      icon={<Vault size={17} />}
      footer={
        <>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          )}
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
    </SidePanel>
  );
}

/** Fiche de la caisse principale : consolidation en lecture seule, détail par caisse. */
function PrincipalePanel({ caisse, onClose }: { caisse: Caisse; onClose: () => void }) {
  const { state, userName } = useStore();
  const autres = state.caisses.filter((c) => !c.est_principale).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const ouvertes = autres.filter((c) => c.session_ouverte != null).length;
  return (
    <SidePanel mobileOpen onClose={onClose} title={caisse.nom} subtitle="Consolidation · lecture seule" icon={<Landmark size={16} />}>
      <div className="rounded-[10px] bg-sidebar text-white px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.12em] text-white/60 font-medium">Solde consolidé</p>
        <p className="text-[26px] font-semibold num leading-tight mt-1 break-words">{formatDa(num(caisse.solde_actuel))}</p>
        <p className="text-[12px] text-white/60 mt-1">
          {autres.length} caisse(s) · {ouvertes} session(s) ouverte(s)
        </p>
      </div>
      <DrawerSection title="Détail par caisse">
        {autres.length === 0 ? (
          <p className="text-[12.5px] text-muted">Aucune caisse de caissier pour l’instant.</p>
        ) : (
          <ul className="rounded-[9px] border border-line divide-y divide-line">
            {autres.map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 min-w-0">
                <span className={cn("h-2 w-2 rounded-full shrink-0", c.session_ouverte != null ? "bg-success" : "bg-line-strong")} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium truncate">{c.nom}</p>
                  <p className="text-[11px] text-muted truncate">{c.caissier ? c.caissier_nom ?? userName(c.caissier) : "Sans caissier"}</p>
                </div>
                <span className="text-[12.5px] num font-medium shrink-0">{formatDa(num(c.solde_actuel))}</span>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>
      <p className="text-[12px] text-muted flex items-start gap-1.5">
        <Lock size={12} className="mt-0.5 shrink-0" /> Aucun caissier, aucune session : la caisse principale se met à jour automatiquement.
      </p>
    </SidePanel>
  );
}
