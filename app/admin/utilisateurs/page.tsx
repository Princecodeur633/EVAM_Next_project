"use client";

import { useCallback, useMemo, useState } from "react";
import { CircleSlash, KeyRound, Lock, Plus, Power, ShieldCheck, UserCog, UserPlus, Users, Wand2 } from "lucide-react";
import { DrawerSection, SidePanel, SplitLayout } from "@/components/Drawer";
import { FilterBar, FilterSelect, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { ACCENT_CLASS, ACCENT_SOFT, ROLE_ICONS } from "@/components/icons";
import { Tabs } from "@/components/Tabs";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { displayName, PROFIL_LABEL } from "@/lib/labels";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { Profil, Utilisateur } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const PROFILS = Object.keys(PROFIL_LABEL) as Profil[];
type Filtre = "TOUS" | "ACTIFS" | "INACTIFS";
type Onglet = "comptes" | "profils";

/** Mot de passe provisoire lisible (sans caractères ambigus), à communiquer à l’utilisateur. */
function motDePasseProvisoire() {
  const lettres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const chiffres = "23456789";
  const pick = (src: string, n: number) => Array.from({ length: n }, () => src[Math.floor(Math.random() * src.length)]).join("");
  return `${pick(lettres, 4)}-${pick(chiffres, 4)}-${pick(lettres, 2)}!`;
}

function initiales(u: Utilisateur) {
  return (`${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}` || u.username.slice(0, 2)).toUpperCase();
}

function RoleBadge({ profil }: { profil: Profil }) {
  const p = ROLE_PROFILES[profil];
  if (!p) return <StatusBadge tone="danger">Sans rôle</StatusBadge>;
  return <span className={cn("inline-flex text-[11px] px-2 py-[3px] rounded-[5px] font-medium whitespace-nowrap", ACCENT_SOFT[p.accent])}>{p.label}</span>;
}

export default function UtilisateursPage() {
  const { state, dispatch, can, currentUser } = useStore();
  const writable = can("ADMIN_USERS");
  const [query, setQuery] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [profilFiltre, setProfilFiltre] = useState<Profil | "">("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("comptes");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.utilisateurs]
      .filter((u) => (filtre === "ACTIFS" ? u.actif : filtre === "INACTIFS" ? !u.actif : true))
      .filter((u) => !profilFiltre || u.profil === profilFiltre)
      .filter((u) => matchSearch(q, displayName(u), u.username, u.email, u.telephone))
      .sort((a, b) => Number(b.actif) - Number(a.actif) || displayName(a).localeCompare(displayName(b), "fr"));
  }, [state.utilisateurs, query, filtre, profilFiltre]);

  const nbActifs = state.utilisateurs.filter((u) => u.actif).length;
  const selected = state.utilisateurs.find((u) => u.id === selectedId) ?? null;
  const close = useCallback(() => {
    setSelectedId(null);
    setCreating(false);
  }, []);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Configuration"
        title="Utilisateurs & profils"
        description="Créez les comptes de l’usine, attribuez un rôle et gérez l’accès de chacun."
        actions={
          writable && onglet === "comptes" ? (
            <Button
              onClick={() => {
                setSelectedId(null);
                setCreating(true);
              }}
            >
              <Plus size={15} /> Nouvel utilisateur
            </Button>
          ) : null
        }
      />

      <Tabs
        label="Utilisateurs et profils"
        value={onglet}
        onChange={setOnglet}
        items={[
          { value: "comptes", label: "Comptes", icon: Users, count: state.utilisateurs.length },
          { value: "profils", label: "Profils & accès", icon: ShieldCheck, count: PROFILS.length },
        ]}
      />

      {onglet === "profils" ? (
        <ProfilsAcces />
      ) : (
      <SplitLayout>
      <Panel className="overflow-hidden">
        <FilterBar
          shown={rows.length}
          total={state.utilisateurs.length}
          active={!!query || !!profilFiltre || filtre !== "TOUS"}
          onReset={() => {
            setQuery("");
            setProfilFiltre("");
            setFiltre("TOUS");
          }}
        >
          <SearchInput value={query} onChange={setQuery} placeholder="Nom, identifiant, e-mail, téléphone…" />
          <Segmented
            label="Statut"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "TOUS", label: "Tous" },
              { value: "ACTIFS", label: "Actifs", count: nbActifs },
              { value: "INACTIFS", label: "Inactifs", count: state.utilisateurs.length - nbActifs },
            ]}
          />
          <FilterSelect
            label="Rôle"
            allLabel="Tous les rôles"
            value={profilFiltre}
            onChange={(v) => setProfilFiltre(v as Profil | "")}
            options={PROFILS.map((p) => ({ value: p, label: `${PROFIL_LABEL[p]} (${state.utilisateurs.filter((u) => u.profil === p).length})` }))}
          />
        </FilterBar>

        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">Aucun compte ne correspond à ces filtres.</p>
        ) : (
          <>
            {/* Tableau (tablette et ordinateur) */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-2.5 font-medium">Nom</th>
                  <th className="px-4 py-2.5 font-medium">Rôle</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className={cn(
                      "border-b border-line last:border-0 cursor-pointer transition-colors",
                      selectedId === u.id ? "bg-primary-soft" : "hover:bg-primary-soft/50",
                      !u.actif && "opacity-70",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 shrink-0 rounded-full bg-surface-2 border border-line text-[11px] font-semibold flex items-center justify-center">{initiales(u)}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">
                            {displayName(u)}
                            {u.id === currentUser?.id && <span className="ml-1.5 text-[11px] text-muted font-normal">(vous)</span>}
                          </p>
                          <p className="text-[11.5px] text-muted truncate">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <RoleBadge profil={u.profil} />
                    </td>
                    <td className="px-4 py-2.5">
                      {u.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      <UserCog size={15} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Liste (mobile) */}
            <ul className="md:hidden divide-y divide-line">
              {rows.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => setSelectedId(u.id)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary-soft/50">
                    <span className="h-9 w-9 shrink-0 rounded-full bg-surface-2 border border-line text-[11px] font-semibold flex items-center justify-center">{initiales(u)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate">{displayName(u)}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <RoleBadge profil={u.profil} />
                        {!u.actif && <StatusBadge tone="neutral">Inactif</StatusBadge>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {/* Panneau de droite : détail du compte cliqué, sinon formulaire de création. */}
      {selected ? (
        <EditUserPanel
          key={selected.id}
          user={selected}
          isSelf={selected.id === currentUser?.id}
          writable={writable}
          onClose={close}
          dispatch={dispatch}
        />
      ) : writable ? (
        <CreateUserPanel mobileOpen={creating} onClose={creating ? close : undefined} />
      ) : (
        <SidePanel title="Détail du compte" icon={<UserCog size={16} />}>
          <p className="text-[12.5px] text-muted">Cliquez sur un compte du tableau pour afficher ses informations.</p>
        </SidePanel>
      )}
      </SplitLayout>
      )}
    </div>
  );
}

/** Onglet « Profils & accès » : fiche de chaque poste, en lecture seule (droits fixés dans le code). */
function ProfilsAcces() {
  const { state } = useStore();
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted flex items-center gap-1.5">
        <Lock size={13} className="shrink-0" /> Lecture seule : les droits de chaque profil sont fixés par l’application.
      </p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {PROFILS.map((k) => {
          const p = ROLE_PROFILES[k];
          const Icon = ROLE_ICONS[p.icon];
          const comptes = state.utilisateurs.filter((u) => u.profil === k && u.actif).length;
          return (
            <Panel key={k} className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className={cn("h-9 w-9 shrink-0 rounded-[8px] text-white flex items-center justify-center", ACCENT_CLASS[p.accent])}>
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-tight">{p.label}</p>
                  <p className="text-[11.5px] text-muted mt-0.5">{p.station}</p>
                </div>
                <span className={cn("text-[11px] num font-medium px-1.5 py-0.5 rounded-[5px] shrink-0", comptes ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                  {comptes} compte{comptes > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[12.5px] leading-snug">{p.mission}</p>
              {p.owns.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {p.owns.map((o) => (
                    <li key={o} className={cn("text-[11px] px-1.5 py-0.5 rounded-[4px] font-medium", ACCENT_SOFT[p.accent])}>
                      {o}
                    </li>
                  ))}
                </ul>
              )}
              {p.never.length > 0 && (
                <ul className="space-y-1 pt-2 border-t border-line mt-auto">
                  {p.never.map((n) => (
                    <li key={n} className="flex gap-1.5 text-[11.5px] text-muted leading-snug">
                      <CircleSlash size={12} className="text-danger/70 shrink-0 mt-[2px]" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function RoleSelect({ value, onChange, disabled }: { value: Profil; onChange: (p: Profil) => void; disabled?: boolean }) {
  const p = ROLE_PROFILES[value];
  return (
    <div className="space-y-2">
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as Profil)} disabled={disabled}>
        {PROFILS.map((k) => (
          <option key={k} value={k}>
            {PROFIL_LABEL[k]}
          </option>
        ))}
      </select>
      {p && (
        <p className="text-[12px] text-muted leading-snug rounded-[7px] bg-surface-2 border border-line px-3 py-2">
          <span className="text-ink font-medium">{p.station}</span> — {p.mission}
        </p>
      )}
    </div>
  );
}

function PasswordInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input className={cn(inputClass, "font-mono")} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" />
        <Button type="button" variant="secondary" onClick={() => onChange(motDePasseProvisoire())} title="Générer un mot de passe provisoire">
          <Wand2 size={14} />
        </Button>
      </div>
    </Field>
  );
}

function CreateUserPanel({ onClose, mobileOpen }: { onClose?: () => void; mobileOpen: boolean }) {
  const { dispatch } = useStore();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profil, setProfil] = useState<Profil>("AGENT_PRODUCTION");
  const [password, setPassword] = useState(motDePasseProvisoire);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_USER", username: username.trim(), password, profil, first_name: first.trim(), last_name: last.trim(), email: email.trim() });
    setSaving(false);
    if (ok) {
      // Formulaire vidé pour enchaîner la création suivante.
      setFirst("");
      setLast("");
      setUsername("");
      setEmail("");
      setPassword(motDePasseProvisoire());
      onClose?.();
    }
  }

  return (
    <SidePanel
      mobileOpen={mobileOpen}
      onClose={onClose}
      title="Nouvel utilisateur"
      subtitle="Le compte est actif dès sa création."
      icon={<UserPlus size={17} />}
      footer={
        <>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          )}
          <Button disabled={!username.trim() || !password || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le compte"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Identité">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <Field label="Prénom">
            <input className={inputClass} value={first} onChange={(e) => setFirst(e.target.value)} autoFocus />
          </Field>
          <Field label="Nom">
            <input className={inputClass} value={last} onChange={(e) => setLast(e.target.value)} />
          </Field>
        </div>
        <Field label="Identifiant de connexion">
          <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="ex. jdupont" />
        </Field>
        <Field label="E-mail">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </DrawerSection>
      <DrawerSection title="Rôle" hint="Détermine le menu et les actions autorisées.">
        <RoleSelect value={profil} onChange={setProfil} />
      </DrawerSection>
      <DrawerSection title="Mot de passe provisoire" hint="À communiquer à l’utilisateur ; il pourra être réinitialisé à tout moment.">
        <PasswordInput label="Mot de passe" value={password} onChange={setPassword} />
      </DrawerSection>
    </SidePanel>
  );
}

function EditUserPanel({
  user,
  isSelf,
  writable,
  onClose,
  dispatch,
}: {
  user: Utilisateur;
  isSelf: boolean;
  writable: boolean;
  onClose: () => void;
  dispatch: ReturnType<typeof useStore>["dispatch"];
}) {
  const [first, setFirst] = useState(user.first_name);
  const [last, setLast] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [telephone, setTelephone] = useState(user.telephone);
  const [profil, setProfil] = useState<Profil>(user.profil);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"save" | "toggle" | "pwd" | null>(null);
  const [pwdDone, setPwdDone] = useState<string | null>(null);

  const dirty = first !== user.first_name || last !== user.last_name || email !== user.email || telephone !== user.telephone || profil !== user.profil;

  async function save() {
    setBusy("save");
    await dispatch({ type: "PATCH_USER", id: user.id, first_name: first.trim(), last_name: last.trim(), email: email.trim(), telephone: telephone.trim(), profil });
    setBusy(null);
  }
  async function toggle() {
    setBusy("toggle");
    await dispatch({ type: "TOGGLE_USER", id: user.id, actif: !user.actif });
    setBusy(null);
  }
  async function resetPassword() {
    setBusy("pwd");
    const ok = await dispatch({ type: "PATCH_USER", id: user.id, password });
    setBusy(null);
    if (ok) {
      setPwdDone(password);
      setPassword("");
    }
  }

  return (
    <SidePanel
      mobileOpen
      onClose={onClose}
      title={displayName(user)}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          <span>{user.username}</span>
          <span>·</span>
          <span>créé le {formatDate(user.date_creation)}</span>
        </span>
      }
      icon={<UserCog size={17} />}
      footer={
        writable ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button disabled={!dirty || busy !== null} onClick={() => void save()}>
              {busy === "save" ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        ) : undefined
      }
    >
      <DrawerSection title="Identité">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <Field label="Prénom">
            <input className={inputClass} value={first} onChange={(e) => setFirst(e.target.value)} disabled={!writable} />
          </Field>
          <Field label="Nom">
            <input className={inputClass} value={last} onChange={(e) => setLast(e.target.value)} disabled={!writable} />
          </Field>
        </div>
        <Field label="E-mail">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!writable} />
        </Field>
        <Field label="Téléphone">
          <input className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} disabled={!writable} />
        </Field>
      </DrawerSection>

      <DrawerSection title="Rôle">
        <RoleSelect value={profil} onChange={setProfil} disabled={!writable || isSelf} />
        {isSelf && <p className="text-[11.5px] text-muted">Vous ne pouvez pas modifier votre propre rôle.</p>}
      </DrawerSection>

      {writable && (
        <>
          <DrawerSection title="Accès">
            <div
              className={cn(
                "rounded-[9px] border px-3.5 py-3 flex items-center gap-3",
                user.actif ? "border-success/25 bg-success-soft/40" : "border-line bg-surface-2",
              )}
            >
              <Power size={16} className={user.actif ? "text-success" : "text-muted"} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{user.actif ? "Compte actif" : "Compte désactivé"}</p>
                <p className="text-[11.5px] text-muted">
                  {user.actif
                    ? "L’utilisateur peut se connecter."
                    : `Connexion bloquée${user.date_desactivation ? ` depuis le ${formatDate(user.date_desactivation)}` : ""}.`}
                </p>
              </div>
              <Button variant={user.actif ? "secondary" : "success"} disabled={isSelf || busy !== null} onClick={() => void toggle()}>
                {busy === "toggle" ? "…" : user.actif ? "Désactiver" : "Activer"}
              </Button>
            </div>
            {isSelf && <p className="text-[11.5px] text-muted">Vous ne pouvez pas désactiver votre propre compte.</p>}
          </DrawerSection>

          <DrawerSection title="Réinitialiser le mot de passe" hint="Le nouveau mot de passe remplace immédiatement l’ancien.">
            <PasswordInput label="Nouveau mot de passe" value={password} onChange={setPassword} />
            <Button variant="secondary" disabled={password.length < 8 || busy !== null} onClick={() => void resetPassword()}>
              <KeyRound size={14} /> {busy === "pwd" ? "Réinitialisation…" : "Réinitialiser"}
            </Button>
            {pwdDone && (
              <p className="text-[12px] rounded-[7px] bg-success-soft text-success px-3 py-2">
                Mot de passe réinitialisé. Communiquez-le à l’utilisateur : <span className="font-mono font-semibold">{pwdDone}</span>
              </p>
            )}
          </DrawerSection>
        </>
      )}
    </SidePanel>
  );
}
