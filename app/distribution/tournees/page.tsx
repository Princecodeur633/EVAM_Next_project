"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CarFront, IdCard, Plus, Route } from "lucide-react";
import { BlBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Segmented } from "@/components/Filters";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

type Onglet = "tournees" | "vehicules" | "chauffeurs";

export default function TourneesPage() {
  return (
    <Suspense fallback={null}>
      <Tournees />
    </Suspense>
  );
}

function useNoms() {
  const { state, userName } = useStore();
  const chauffeur = (id: number) => {
    const ch = state.chauffeurs.find((c) => c.id === id);
    if (!ch) return "—";
    const nom = userName(ch.utilisateur);
    if (nom !== "—" && !nom.startsWith("#")) return nom;
    return ch.permis_numero ? `Permis ${ch.permis_numero}` : `Chauffeur n°${ch.id}`;
  };
  const vehicule = (id: number) => state.vehicules.find((v) => v.id === id)?.immatriculation ?? `Véhicule n°${id}`;
  return { chauffeur, vehicule };
}

function Tournees() {
  const { state, can, role } = useStore();
  const params = useSearchParams();
  const [onglet, setOnglet] = useState<Onglet>("tournees");
  const [form, setForm] = useState<Onglet | null>(null);
  const flotte = role !== "CHAUFFEUR";

  const actions: Record<Onglet, { label: string; droit: boolean }> = {
    tournees: { label: "Nouvelle tournée", droit: can("CREATE_TOURNEE") },
    vehicules: { label: "Nouveau véhicule", droit: can("CREATE_VEHICULE") },
    chauffeurs: { label: "Nouveau chauffeur", droit: can("CREATE_CHAUFFEUR") },
  };

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Logistique"
        title={flotte ? "Tournées & flotte" : "Mes tournées"}
        description={flotte ? "Enregistrez véhicules et chauffeurs, puis créez les tournées et suivez leurs bons de livraison." : "Vos tournées et les bons de livraison à remettre."}
        actions={
          actions[onglet].droit ? (
            <Button onClick={() => setForm(onglet)}>
              <Plus size={15} /> {actions[onglet].label}
            </Button>
          ) : null
        }
      />
      {flotte && (
        <Tabs
          label="Tournées et flotte"
          value={onglet}
          onChange={setOnglet}
          items={[
            { value: "tournees", label: "Tournées", icon: Route, count: state.tournees.length },
            { value: "vehicules", label: "Véhicules", icon: CarFront, count: state.vehicules.length },
            { value: "chauffeurs", label: "Chauffeurs", icon: IdCard, count: state.chauffeurs.length },
          ]}
        />
      )}
      {onglet === "tournees" && <OngletTournees initiale={Number(params.get("tournee")) || null} />}
      {onglet === "vehicules" && <OngletVehicules />}
      {onglet === "chauffeurs" && <OngletChauffeurs />}

      {form === "tournees" && <TourneeDrawer onClose={() => setForm(null)} />}
      {form === "vehicules" && <VehiculeDrawer onClose={() => setForm(null)} />}
      {form === "chauffeurs" && <ChauffeurDrawer onClose={() => setForm(null)} />}
    </div>
  );
}

/** À gauche la liste des tournées, à droite les BL de la tournée sélectionnée. */
function OngletTournees({ initiale }: { initiale: number | null }) {
  const { state, clientName } = useStore();
  const router = useRouter();
  const { chauffeur, vehicule } = useNoms();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [vue, setVue] = useState<"A_VENIR" | "PASSEES">("A_VENIR");
  const tournees = state.tournees
    .filter((t) => (vue === "A_VENIR" ? t.date_tournee >= aujourdhui : t.date_tournee < aujourdhui))
    .sort((a, b) => (vue === "A_VENIR" ? a.date_tournee.localeCompare(b.date_tournee) : b.date_tournee.localeCompare(a.date_tournee)));
  const [choix, setChoix] = useState<number | null>(initiale);
  const tournee = state.tournees.find((t) => t.id === choix) ?? tournees[0] ?? null;
  const bls = tournee ? state.bonsLivraison.filter((b) => b.tournee === tournee.id) : [];
  const cmd = (id: number) => state.commandes.find((c) => c.id === id);

  return (
    <div className="grid lg:grid-cols-[minmax(280px,2fr)_minmax(0,3fr)] gap-4 items-start">
      <Panel className="overflow-hidden lg:sticky lg:top-[72px]">
        <div className="px-3 py-2.5 border-b border-line">
          <Segmented
            label="Période"
            value={vue}
            onChange={setVue}
            options={[
              { value: "A_VENIR", label: "Aujourd’hui et à venir", count: state.tournees.filter((t) => t.date_tournee >= aujourdhui).length },
              { value: "PASSEES", label: "Passées" },
            ]}
          />
        </div>
        {tournees.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12.5px] text-muted">Aucune tournée.</p>
        ) : (
          <ul className="divide-y divide-line max-h-[calc(100dvh-260px)] overflow-y-auto">
            {tournees.map((t) => {
              const actif = t.id === tournee?.id;
              const nb = state.bonsLivraison.filter((b) => b.tournee === t.id).length;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setChoix(t.id)}
                    className={cn("w-full text-left px-4 py-3 flex items-center gap-3 border-l-2 transition-colors", actif ? "bg-primary-soft border-primary" : "border-transparent hover:bg-surface-2")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="num text-[13px] font-semibold">{t.numero}</span>
                        {t.date_tournee === aujourdhui && <StatusBadge tone="teal">Aujourd’hui</StatusBadge>}
                      </div>
                      <p className="text-[12px] text-muted truncate">
                        {formatDate(t.date_tournee)} · {chauffeur(t.chauffeur)} · {vehicule(t.vehicule)}
                      </p>
                    </div>
                    <span className="text-[11px] num font-semibold px-1.5 py-0.5 rounded-[5px] bg-surface-2 text-muted shrink-0">{nb} BL</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel className="overflow-hidden min-w-0">
        {tournee ? (
          <>
            <div className="px-4 py-3 border-b border-line">
              <p className="num text-[15px] font-semibold">{tournee.numero}</p>
              <p className="text-[12.5px] text-muted">
                {formatDate(tournee.date_tournee)} · {chauffeur(tournee.chauffeur)} · {vehicule(tournee.vehicule)}
              </p>
            </div>
            <DataTable
              emptyText="Aucun bon de livraison sur cette tournée."
              columns={[
                { key: "n", label: "BL" },
                { key: "c", label: "Commande" },
                { key: "cl", label: "Client" },
                { key: "s", label: "Statut" },
              ]}
              rows={bls.map((b) => ({
                n: <span className="num font-medium">{b.numero}</span>,
                c: cmd(b.commande)?.numero ?? "—",
                cl: clientName(cmd(b.commande)?.client),
                s: (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <BlBadge status={b.statut} />
                    {b.incident_livraison && <StatusBadge tone="warning">Incident</StatusBadge>}
                  </span>
                ),
                href: `/distribution/bl/${b.id}`,
              }))}
              onRowClick={(row) => router.push(String(row.href))}
            />
          </>
        ) : (
          <p className="px-6 py-14 text-center text-[13px] text-muted">Sélectionnez une tournée.</p>
        )}
      </Panel>
    </div>
  );
}

function OngletVehicules() {
  const { state } = useStore();
  return (
    <Panel className="overflow-hidden">
      <DataTable
        emptyText="Aucun véhicule."
        columns={[
          { key: "i", label: "Immatriculation" },
          { key: "t", label: "Type" },
          { key: "n", label: "Tournées" },
          { key: "s", label: "Statut" },
        ]}
        rows={state.vehicules.map((v) => ({
          i: <span className="num font-medium">{v.immatriculation}</span>,
          t: v.type_vehicule || "—",
          n: state.tournees.filter((t) => t.vehicule === v.id).length,
          s: v.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>,
        }))}
      />
    </Panel>
  );
}

function OngletChauffeurs() {
  const { state, userName } = useStore();
  return (
    <Panel className="overflow-hidden">
      <DataTable
        emptyText="Aucun chauffeur enregistré."
        columns={[
          { key: "n", label: "Chauffeur" },
          { key: "p", label: "N° de permis" },
          { key: "t", label: "Tournées" },
        ]}
        rows={state.chauffeurs.map((c) => ({
          n: userName(c.utilisateur),
          p: c.permis_numero || "—",
          t: state.tournees.filter((t) => t.chauffeur === c.id).length,
        }))}
      />
    </Panel>
  );
}

function TourneeDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { chauffeur } = useNoms();
  const [ch, setCh] = useState(0);
  const [vh, setVh] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_TOURNEE", chauffeur: ch, vehicule: vh, date_tournee: date });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouvelle tournée"
      icon={<Route size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!ch || !vh || !date || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer la tournée"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Tournée">
        <Field label="Date">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Chauffeur">
          <select className={inputClass} value={ch} onChange={(e) => setCh(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {state.chauffeurs.map((c) => (
              <option key={c.id} value={c.id}>
                {chauffeur(c.id)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Véhicule">
          <select className={inputClass} value={vh} onChange={(e) => setVh(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {state.vehicules
              .filter((v) => v.actif)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.immatriculation}
                  {v.type_vehicule ? ` · ${v.type_vehicule}` : ""}
                </option>
              ))}
          </select>
        </Field>
        {(state.chauffeurs.length === 0 || state.vehicules.length === 0) && <p className="text-[12px] text-warning">Enregistrez d’abord au moins un chauffeur et un véhicule.</p>}
      </DrawerSection>
    </Drawer>
  );
}

function VehiculeDrawer({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [immat, setImmat] = useState("");
  const [type, setType] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_VEHICULE", immatriculation: immat.trim(), type_vehicule: type.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau véhicule"
      icon={<CarFront size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!immat.trim() || saving} onClick={() => void submit()}>
            {saving ? "Ajout…" : "Ajouter le véhicule"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Véhicule">
        <Field label="Immatriculation">
          <input className={cn(inputClass, "uppercase")} value={immat} onChange={(e) => setImmat(e.target.value)} autoFocus />
        </Field>
        <Field label="Type (facultatif)">
          <input className={inputClass} value={type} onChange={(e) => setType(e.target.value)} placeholder="Camion, fourgon…" />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}

function ChauffeurDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const dejaChauffeurs = new Set(state.chauffeurs.map((c) => c.utilisateur));
  const comptes = state.utilisateurs.filter((u) => u.profil === "CHAUFFEUR" && u.actif && !dejaChauffeurs.has(u.id));
  const [user, setUser] = useState(0);
  const [permis, setPermis] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_CHAUFFEUR", utilisateur: user, permis_numero: permis.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Nouveau chauffeur"
      subtitle="Fiche chauffeur liée à un compte au profil Chauffeur."
      icon={<IdCard size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!user || saving} onClick={() => void submit()}>
            {saving ? "Ajout…" : "Ajouter le chauffeur"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Chauffeur">
        <Field label="Compte">
          <select className={inputClass} value={user} onChange={(e) => setUser(Number(e.target.value))}>
            <option value={0}>Choisir…</option>
            {comptes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name} ({u.username})
              </option>
            ))}
          </select>
        </Field>
        {comptes.length === 0 && <p className="text-[12px] text-muted">Aucun compte Chauffeur sans fiche : demandez à l’Admin SI d’en créer un.</p>}
        <Field label="N° de permis">
          <input className={inputClass} value={permis} onChange={(e) => setPermis(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
