"use client";

import { useCallback, useMemo, useState } from "react";
import { KeyRound, Plus, Power, Search, UserCog, UserPlus, Wand2 } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { ACCENT_SOFT } from "@/components/icons";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { displayName, PROFIL_LABEL } from "@/lib/labels";
import { ROLE_PROFILES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { Profil, Utilisateur } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const PROFILS = Object.keys(PROFIL_LABEL) as Profil[];
type Filtre = "TOUS" | "ACTIFS" | "INACTIFS";

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

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.utilisateurs]
      .filter((u) => (filtre === "ACTIFS" ? u.actif : filtre === "INACTIFS" ? !u.actif : true))
      .filter((u) => !profilFiltre || u.profil === profilFiltre)
      .filter((u) => !q || `${displayName(u)} ${u.username} ${u.email}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.actif) - Number(a.actif) || displayName(a).localeCompare(displayName(b), "fr"));
  }, [state.utilisateurs, query, filtre, profilFiltre]);

  const nbActifs = state.utilisateurs.filter((u) => u.actif).length;
  const selected = state.utilisateurs.find((u) => u.id === selectedId) ?? null;
  const close = useCallback(() => {
    setSelectedId(null);
    setCreating(false);
  }, []);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Créez les comptes de l’usine, attribuez un rôle et gérez l’accès de chacun."
        actions={
          writable ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Utilisateur
            </Button>
          ) : null
        }
      />

      <Panel className="overflow-hidden">
        {/* Barre de filtres */}
        <div className="px-3 sm:px-4 py-3 border-b border-line flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className={cn(inputClass, "pl-8")} placeholder="Rechercher un nom, un identifiant…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-[7px] border border-line p-0.5 bg-surface-2">
              {(
                [
                  ["TOUS", `Tous · ${state.utilisateurs.length}`],
                  ["ACTIFS", `Actifs · ${nbActifs}`],
                  ["INACTIFS", `Inactifs · ${state.utilisateurs.length - nbActifs}`],
                ] as [Filtre, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFiltre(k)}
                  className={cn(
                    "h-7 px-2.5 rounded-[5px] text-[12px] font-medium transition-colors whitespace-nowrap",
                    filtre === k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select className={cn(inputClass, "h-8 w-auto text-[12px]")} value={profilFiltre} onChange={(e) => setProfilFiltre(e.target.value as Profil | "")} aria-label="Filtrer par rôle">
              <option value="">Tous les rôles</option>
              {PROFILS.map((p) => (
                <option key={p} value={p}>
                  {PROFIL_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

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

      {creating && <CreateUserDrawer onClose={close} />}
      {selected && (
        <EditUserDrawer
          key={selected.id}
          user={selected}
          isSelf={selected.id === currentUser?.id}
          writable={writable}
          onClose={close}
          dispatch={dispatch}
        />
      )}
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

function CreateUserDrawer({ onClose }: { onClose: () => void }) {
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
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouvel utilisateur"
      subtitle="Le compte est actif dès sa création."
      icon={<UserPlus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!username.trim() || !password || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer le compte"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Identité">
        <div className="grid grid-cols-2 gap-3">
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
    </Drawer>
  );
}

function EditUserDrawer({
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
    <Drawer
      open
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
        <div className="grid grid-cols-2 gap-3">
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
    </Drawer>
  );
}
