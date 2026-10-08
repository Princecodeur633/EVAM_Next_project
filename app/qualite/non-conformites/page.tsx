"use client";

import { useState } from "react";
import { Beaker, CheckCheck, Plus } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { KpiCard } from "@/components/charts";
import { ClotureNcDrawer, NcBadge, PieceJointeLien } from "@/components/qualite";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, api, detail, endpoints } from "@/lib/api";
import { ACTION_IMMEDIATE_LABEL, DECISION_NC_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ActionImmediate, NonConformite } from "@/lib/types";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

type Vue = "OUVERTES" | "BLOQUANTES" | "CLOTUREES" | "TOUTES";

/** Non-conformités : cause, action immédiate, action corrective, responsable, suivi et clôture avec décision. */
export default function NonConformitesPage() {
  const { state, can } = useStore();
  const [vue, setVue] = useState<Vue>("OUVERTES");
  const [q, setQ] = useState("");
  const [ouverte, setOuverte] = useState<NonConformite | null>(null);
  const [nouvelle, setNouvelle] = useState(false);
  const tous = state.nonConformites;
  const ouvertes = tous.filter((n) => n.statut !== "CLOTUREE");
  const lignes = tous
    .filter((n) => (vue === "OUVERTES" ? n.statut !== "CLOTUREE" : vue === "BLOQUANTES" ? n.bloquante && n.statut !== "CLOTUREE" : vue === "CLOTUREES" ? n.statut === "CLOTUREE" : true))
    .filter((n) => matchSearch(q, n.numero, n.description, n.of_numero, n.lot_numero, n.controle_numero))
    .sort((a, b) => Number(b.bloquante) - Number(a.bloquante) || b.date_ouverture.localeCompare(a.date_ouverture));
  const lotMatiere = (id: number | null) => (id ? state.lotsMatieres.find((l) => l.id === id)?.numero : null);

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Qualité"
        title="Non-conformités"
        description="Ouvertes automatiquement par un contrôle non conforme (bloquantes si le contrôle l’est : le lot est bloqué) ou déclarées à la main. Une NC bloquante ne se clôture en libération qu’après un contrôle de reprise conforme."
        actions={
          can("GERER_NC") ? (
            <Button onClick={() => setNouvelle(true)}>
              <Plus size={15} /> Déclarer une NC
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Ouvertes" value={ouvertes.length} tone={ouvertes.length ? "warning" : "success"} />
        <KpiCard label="Bloquantes ouvertes" value={ouvertes.filter((n) => n.bloquante).length} tone={ouvertes.some((n) => n.bloquante) ? "danger" : "success"} />
        <KpiCard label="Action en cours" value={tous.filter((n) => n.statut === "EN_COURS").length} tone="teal" />
        <KpiCard label="Clôturées" value={tous.filter((n) => n.statut === "CLOTUREE").length} />
      </div>
      <Panel className="overflow-hidden">
        <FilterBar shown={lignes.length} total={tous.length} active={!!q || vue !== "OUVERTES"} onReset={() => { setQ(""); setVue("OUVERTES"); }}>
          <SearchInput value={q} onChange={setQ} placeholder="N°, description, OF, lot…" />
          <Segmented
            label="Vue"
            value={vue}
            onChange={setVue}
            options={[
              { value: "OUVERTES", label: "Ouvertes", count: ouvertes.length },
              { value: "BLOQUANTES", label: "Bloquantes", count: ouvertes.filter((n) => n.bloquante).length },
              { value: "CLOTUREES", label: "Clôturées" },
              { value: "TOUTES", label: "Toutes" },
            ]}
          />
        </FilterBar>
        <DataTable
          emptyText={tous.length ? "Aucune non-conformité pour ces filtres." : "Aucune non-conformité."}
          columns={[
            { key: "n", label: "N°" },
            { key: "d", label: "Description" },
            { key: "o", label: "Rattachée à" },
            { key: "a", label: "Action immédiate" },
            { key: "r", label: "Responsable / échéance" },
            { key: "s", label: "Statut" },
          ]}
          rows={lignes.map((n) => ({
            _id: n.id,
            n: (
              <span className="inline-flex flex-col">
                <span className="num font-medium">{n.numero}</span>
                <span className="text-[11px] text-muted">{formatDate(n.date_ouverture)}</span>
              </span>
            ),
            d: (
              <span className="inline-flex flex-col whitespace-normal max-w-[360px]">
                <span>{n.description}</span>
                {n.bloquante && <span className="text-[11px] text-danger font-medium">Bloquante</span>}
              </span>
            ),
            o: [n.of_numero && `OF ${n.of_numero}`, n.lot_numero && `lot ${n.lot_numero}`, lotMatiere(n.lot_matiere) && `lot matière ${lotMatiere(n.lot_matiere)}`, n.controle_numero && `contrôle ${n.controle_numero}`].filter(Boolean).join(" · ") || "—",
            a: n.action_immediate ? ACTION_IMMEDIATE_LABEL[n.action_immediate] : "—",
            r: <ResponsableCell nc={n} />,
            s: (
              <span className="inline-flex flex-col gap-0.5">
                <NcBadge nc={n} />
                {n.decision && <span className="text-[11px] text-muted">{DECISION_NC_LABEL[n.decision]}</span>}
              </span>
            ),
          }))}
          onRowClick={(row) => setOuverte(tous.find((n) => n.id === row._id) ?? null)}
        />
      </Panel>
      {ouverte && <NcDrawer nc={ouverte} onClose={() => setOuverte(null)} />}
      {nouvelle && <NouvelleNcDrawer onClose={() => setNouvelle(false)} />}
    </div>
  );
}

function ResponsableCell({ nc }: { nc: NonConformite }) {
  const { userName } = useStore();
  const echue = nc.echeance && nc.statut !== "CLOTUREE" && nc.echeance < new Date().toISOString().slice(0, 10);
  return (
    <span className="inline-flex flex-col">
      <span>{nc.responsable ? userName(nc.responsable) : "—"}</span>
      {nc.echeance && <span className={cn("text-[11px]", echue ? "text-danger font-medium" : "text-muted")}>{formatDate(nc.echeance)}</span>}
    </span>
  );
}

/** Détail et traitement d’une NC (Qualité) ; lecture seule pour les autres profils. */
function NcDrawer({ nc, onClose }: { nc: NonConformite; onClose: () => void }) {
  const { state, dispatch, can, userName } = useStore();
  const writable = can("GERER_NC") && nc.statut !== "CLOTUREE";
  const [cause, setCause] = useState(nc.cause);
  const [actionImm, setActionImm] = useState<ActionImmediate | "">(nc.action_immediate);
  const [corrective, setCorrective] = useState(nc.action_corrective);
  const [responsable, setResponsable] = useState(nc.responsable ?? 0);
  const [echeance, setEcheance] = useState(nc.echeance ?? "");
  const [fichier, setFichier] = useState<File | null>(null);
  const [cloture, setCloture] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = ["nonConformites", "lots", "lotsMatieres", "controlesRealises"] as const;

  async function run(fn: () => Promise<unknown>, fermer = false) {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: fn, refresh: [...refresh] });
    setBusy(false);
    if (ok && fermer) onClose();
  }

  async function enregistrer() {
    await run(async () => {
      await api.patch(detail(endpoints.nonConformites, nc.id), {
        cause,
        action_immediate: actionImm,
        action_corrective: corrective,
        responsable: responsable || null,
        echeance: echeance || null,
      });
      if (fichier) await actions.joindrePieceQualite({ non_conformite: nc.id }, fichier);
    }, true);
  }

  return (
    <>
      <Drawer
        open
        width="lg"
        onClose={onClose}
        title={nc.numero}
        subtitle={`Ouverte le ${formatDateTime(nc.date_ouverture)}${nc.ouverte_par ? ` par ${userName(nc.ouverte_par)}` : ""}`}
        icon={<Beaker size={17} />}
        footer={
          writable ? (
            <>
              {nc.statut === "OUVERTE" && (
                <Button variant="secondary" className="mr-auto" disabled={busy} onClick={() => void run(() => actions.prendreEnChargeNC(nc.id))}>
                  Prendre en charge
                </Button>
              )}
              <Button variant="secondary" disabled={busy} onClick={() => void enregistrer()}>
                Enregistrer
              </Button>
              <Button variant="success" disabled={busy} onClick={() => setCloture(true)}>
                <CheckCheck size={14} /> Clôturer
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <NcBadge nc={nc} />
          {nc.bloquante && <StatusBadge tone="danger">Bloquante</StatusBadge>}
          {nc.decision && <StatusBadge tone="info">{DECISION_NC_LABEL[nc.decision]}</StatusBadge>}
        </div>
        <DrawerSection title="Constat">
          <p className="text-[13px]">{nc.description}</p>
          <p className="text-[12px] text-muted">{[nc.of_numero && `OF ${nc.of_numero}`, nc.lot_numero && `Lot ${nc.lot_numero}`, nc.controle_numero && `Contrôle ${nc.controle_numero}`].filter(Boolean).join(" · ")}</p>
        </DrawerSection>
        <DrawerSection title="Traitement">
          <Field label="Cause">
            <textarea className={cn(inputClass, "h-16 py-2")} disabled={!writable} value={cause} onChange={(e) => setCause(e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Action immédiate">
              <select className={inputClass} disabled={!writable} value={actionImm} onChange={(e) => setActionImm(e.target.value as ActionImmediate | "")}>
                <option value="">—</option>
                {(Object.keys(ACTION_IMMEDIATE_LABEL) as ActionImmediate[]).map((a) => (
                  <option key={a} value={a}>
                    {ACTION_IMMEDIATE_LABEL[a]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsable de l’action">
              <select className={inputClass} disabled={!writable} value={responsable} onChange={(e) => setResponsable(Number(e.target.value))}>
                <option value={0}>—</option>
                {state.annuaire
                  .filter((u) => u.actif)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom} · {u.profil_libelle}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Échéance">
              <input type="date" className={inputClass} disabled={!writable} value={echeance} onChange={(e) => setEcheance(e.target.value)} />
            </Field>
          </div>
          <Field label="Action corrective (obligatoire pour clôturer)">
            <textarea className={cn(inputClass, "h-20 py-2")} disabled={!writable} value={corrective} onChange={(e) => setCorrective(e.target.value)} />
          </Field>
          {writable && (
            <Field label="Photo / document">
              <input type="file" accept="image/*,application/pdf" className="block w-full text-[12.5px]" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
            </Field>
          )}
        </DrawerSection>
        {(nc.pieces_jointes?.length ?? 0) > 0 && (
          <DrawerSection title="Pièces jointes">
            <ul className="space-y-1">
              {nc.pieces_jointes?.map((p) => (
                <li key={p.id}>
                  <PieceJointeLien piece={p} />
                </li>
              ))}
            </ul>
          </DrawerSection>
        )}
        {nc.statut === "CLOTUREE" && (
          <DrawerSection title="Clôture">
            <p className="text-[12.5px]">
              {nc.decision ? DECISION_NC_LABEL[nc.decision] : "—"} · le {nc.date_cloture ? formatDateTime(nc.date_cloture) : "—"}
              {nc.cloturee_par ? ` par ${userName(nc.cloturee_par)}` : ""}
            </p>
          </DrawerSection>
        )}
      </Drawer>
      {cloture && (
        <ClotureNcDrawer
          nc={{ ...nc, action_corrective: corrective }}
          onClose={() => {
            setCloture(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

/** NC déclarée à la main : rattachée à un OF, un lot ou un lot matière. */
function NouvelleNcDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, articleName } = useStore();
  const [description, setDescription] = useState("");
  const [bloquante, setBloquante] = useState(false);
  const [of, setOf] = useState(0);
  const [lot, setLot] = useState(0);
  const [lotMatiere, setLotMatiere] = useState(0);
  const [actionImm, setActionImm] = useState<ActionImmediate | "">("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.post(endpoints.nonConformites, {
          description: description.trim(),
          bloquante,
          ordre_fabrication: of || null,
          lot: lot || null,
          lot_matiere: lotMatiere || null,
          action_immediate: actionImm,
        }),
      refresh: ["nonConformites"],
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Déclarer une non-conformité"
      icon={<Beaker size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!description.trim() || !(of || lot || lotMatiere) || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Déclarer"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Constat">
        <Field label="Description">
          <textarea className={cn(inputClass, "h-20 py-2")} value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
        </Field>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={bloquante} onChange={(e) => setBloquante(e.target.checked)} />
          Bloquante (empêche la clôture de l’OF / la libération du lot)
        </label>
        <Field label="Action immédiate">
          <select className={inputClass} value={actionImm} onChange={(e) => setActionImm(e.target.value as ActionImmediate | "")}>
            <option value="">—</option>
            {(Object.keys(ACTION_IMMEDIATE_LABEL) as ActionImmediate[]).map((a) => (
              <option key={a} value={a}>
                {ACTION_IMMEDIATE_LABEL[a]}
              </option>
            ))}
          </select>
        </Field>
      </DrawerSection>
      <DrawerSection title="Rattachement (au moins un)">
        <Field label="OF">
          <select className={inputClass} value={of} onChange={(e) => setOf(Number(e.target.value))}>
            <option value={0}>—</option>
            {state.ofList.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero} · {articleName(o.article)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lot de produit fini">
          <select className={inputClass} value={lot} onChange={(e) => setLot(Number(e.target.value))}>
            <option value={0}>—</option>
            {state.lots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.numero_lot} · {articleName(l.article)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lot matière">
          <select className={inputClass} value={lotMatiere} onChange={(e) => setLotMatiere(Number(e.target.value))}>
            <option value={0}>—</option>
            {state.lotsMatieres.map((l) => (
              <option key={l.id} value={l.id}>
                {l.numero} · {articleName(l.article)}
              </option>
            ))}
          </select>
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
