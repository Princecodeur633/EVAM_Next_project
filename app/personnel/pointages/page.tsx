"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, History, Trash2 } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { FilterSelect } from "@/components/Filters";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { ApiError, actions, api, detail, endpoints } from "@/lib/api";
import { PRESENCE_LABEL, STATUT_POINTAGE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { FeuillePointage, LigneFeuillePointage, Pointage, Presence } from "@/lib/types";
import { cn, dateISO, formatDate } from "@/lib/utils";

type Onglet = "feuille" | "historique";
type Saisie = { presence: Presence | ""; absence_justifiee: boolean; motif_absence: string; observations: string };

const PRESENCES = Object.keys(PRESENCE_LABEL) as Presence[];

const saisieDe = (l: LigneFeuillePointage): Saisie => ({
  presence: l.pointage?.presence ?? "",
  absence_justifiee: l.pointage?.absence_justifiee ?? false,
  motif_absence: l.pointage?.motif_absence ?? "",
  observations: l.pointage?.observations ?? "",
});

/** Aplatit les erreurs renvoyées pour un ouvrier (liste de messages ou champ → messages). */
function texteErreur(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(texteErreur).join(" ");
  if (v && typeof v === "object") return Object.values(v).map(texteErreur).join(" ");
  return "";
}

/** Une ligne par ouvrier et par jour. Saisie et validation par le RH ; consultation pour les autres. */
export default function PointagesPage() {
  const { can } = useStore();
  const saisie = can("GERER_POINTAGES");
  const [choix, setOnglet] = useState<Onglet>("feuille");
  const onglet: Onglet = saisie ? choix : "historique";

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Personnel" title="Pointages" description="La journée de chaque ouvrier : présent, demi-journée ou absent. Un pointage validé ne change plus, et sert au calcul de la paie." />
      {saisie && (
        <Tabs
          label="Pointages"
          value={onglet}
          onChange={setOnglet}
          items={[
            { value: "feuille", label: "Feuille du jour", icon: CalendarDays },
            { value: "historique", label: "Historique", icon: History },
          ]}
        />
      )}
      {onglet === "feuille" ? <FeuilleDuJour /> : <Historique modifiable={saisie} />}
    </div>
  );
}

function FeuilleDuJour() {
  const { dispatch } = useStore();
  const [date, setDate] = useState(dateISO());
  const [feuille, setFeuille] = useState<FeuillePointage | null>(null);
  const [saisies, setSaisies] = useState<Record<number, Saisie>>({});
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const charger = useCallback(async (jour: string) => {
    try {
      const f = await actions.feuillePointage(jour);
      setFeuille(f);
      setSaisies(Object.fromEntries(f.lignes.map((l) => [l.ouvrier, saisieDe(l)])));
      setErreurs({});
    } catch {
      setFeuille(null);
    }
  }, []);

  useEffect(() => {
    void charger(date);
  }, [charger, date]);

  const maj = (id: number, champs: Partial<Saisie>) => setSaisies((s) => ({ ...s, [id]: { ...s[id], ...champs } }));
  const lignes = feuille?.lignes ?? [];
  const aEnregistrer = lignes.filter((l) => l.pointage?.statut !== "VALIDE" && saisies[l.ouvrier]?.presence);
  const aValider = lignes.filter((l) => l.pointage?.statut === "SAISI").length;

  async function enregistrer() {
    setBusy(true);
    setErreurs({});
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        try {
          await actions.saisirPointagesJour(
            date,
            aEnregistrer.map((l) => {
              const s = saisies[l.ouvrier];
              return { ouvrier: l.ouvrier, presence: s.presence as Presence, absence_justifiee: s.absence_justifiee, motif_absence: s.motif_absence, observations: s.observations };
            }),
          );
        } catch (e) {
          const detailErreurs = e instanceof ApiError ? (e.body as { erreurs?: Record<string, unknown> } | null)?.erreurs : undefined;
          if (detailErreurs) setErreurs(Object.fromEntries(Object.entries(detailErreurs).map(([id, v]) => [id, texteErreur(v)])));
          throw e;
        }
      },
      refresh: ["pointages"],
    });
    if (ok) await charger(date);
    setBusy(false);
  }

  async function validerJournee() {
    setBusy(true);
    const ok = await dispatch({ type: "EXEC", run: () => actions.validerPointagesPeriode(date, date), refresh: ["pointages"] });
    if (ok) await charger(date);
    setBusy(false);
  }

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="sm:w-44">
          <Field label="Jour">
            <input type="date" className={inputClass} max={dateISO()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" disabled={busy || aValider === 0} onClick={() => void validerJournee()}>
          <CheckCircle2 size={14} /> Valider la journée ({aValider})
        </Button>
        <Button disabled={busy || aEnregistrer.length === 0} onClick={() => void enregistrer()}>
          Enregistrer la feuille
        </Button>
      </div>
      <DataTable
        emptyText="Aucun ouvrier actif sous contrat ce jour-là."
        columns={[
          { key: "o", label: "Ouvrier" },
          { key: "a", label: "Affectation du jour" },
          { key: "p", label: "Présence" },
          { key: "j", label: "Absence" },
          { key: "n", label: "Observations" },
          { key: "s", label: "Statut" },
        ]}
        rows={lignes.map((l) => {
          const s = saisies[l.ouvrier] ?? saisieDe(l);
          const fige = l.pointage?.statut === "VALIDE";
          const erreur = erreurs[String(l.ouvrier)];
          return {
            o: (
              <span className="inline-flex flex-col">
                <span>{l.nom}</span>
                <span className="text-[11.5px] text-muted num">{l.matricule}</span>
                {erreur && <span className="text-[11.5px] text-danger">{erreur}</span>}
              </span>
            ),
            a: l.affectations.map((a) => [a.etape_libelle, a.poste_code, a.of_numero].filter(Boolean).join(" · ")).join(" ; ") || "—",
            p: (
              <select className={cn(inputClass, "w-36")} disabled={fige} value={s.presence} onChange={(e) => maj(l.ouvrier, { presence: e.target.value as Presence | "" })}>
                <option value="">Non pointé</option>
                {PRESENCES.map((p) => (
                  <option key={p} value={p}>
                    {PRESENCE_LABEL[p]}
                  </option>
                ))}
              </select>
            ),
            j:
              s.presence === "ABSENT" || s.presence === "DEMI_JOURNEE" ? (
                <span className="inline-flex flex-col gap-1">
                  <label className="flex items-center gap-1.5 text-[12px]">
                    <input type="checkbox" disabled={fige} checked={s.absence_justifiee} onChange={(e) => maj(l.ouvrier, { absence_justifiee: e.target.checked })} />
                    Justifiée
                  </label>
                  {s.absence_justifiee && <input className={cn(inputClass, "w-40")} disabled={fige} placeholder="Motif" value={s.motif_absence} onChange={(e) => maj(l.ouvrier, { motif_absence: e.target.value })} />}
                </span>
              ) : (
                "—"
              ),
            n: <input className={cn(inputClass, "w-40")} disabled={fige} value={s.observations} onChange={(e) => maj(l.ouvrier, { observations: e.target.value })} />,
            s: l.pointage ? <StatusBadge tone={fige ? "success" : "warning"}>{STATUT_POINTAGE_LABEL[l.pointage.statut]}</StatusBadge> : <span className="text-muted">—</span>,
          };
        })}
      />
    </Panel>
  );
}

function Historique({ modifiable }: { modifiable: boolean }) {
  const { state, dispatch } = useStore();
  const [du, setDu] = useState(() => `${dateISO().slice(0, 8)}01`);
  const [au, setAu] = useState(dateISO());
  const [ouvrier, setOuvrier] = useState("");
  const [busy, setBusy] = useState(false);

  const lignes = state.pointages
    .filter((p) => p.date >= du && p.date <= au && (!ouvrier || p.ouvrier === Number(ouvrier)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.ouvrier_nom.localeCompare(b.ouvrier_nom));
  const aValider = lignes.filter((p) => p.statut === "SAISI").length;

  async function executer(run: () => Promise<unknown>) {
    setBusy(true);
    await dispatch({ type: "EXEC", run, refresh: ["pointages"] });
    setBusy(false);
  }

  const lieu = (p: Pointage) => [p.etape_libelle, p.poste_code, p.of_numero].filter(Boolean).join(" · ") || "—";

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="sm:w-40">
          <Field label="Du">
            <input type="date" className={inputClass} value={du} onChange={(e) => setDu(e.target.value)} />
          </Field>
        </div>
        <div className="sm:w-40">
          <Field label="Au">
            <input type="date" className={inputClass} value={au} onChange={(e) => setAu(e.target.value)} />
          </Field>
        </div>
        <FilterSelect label="Ouvrier" allLabel="Tous les ouvriers" value={ouvrier} onChange={setOuvrier} options={state.ouvriers.map((o) => ({ value: String(o.id), label: o.nom_complet }))} />
        <div className="flex-1" />
        {modifiable && (
          <Button variant="secondary" disabled={busy || aValider === 0} onClick={() => void executer(() => actions.validerPointagesPeriode(du, au, ouvrier ? Number(ouvrier) : undefined))}>
            <CheckCircle2 size={14} /> Valider la période ({aValider})
          </Button>
        )}
      </div>
      <DataTable
        emptyText="Aucun pointage sur cette période."
        columns={[
          { key: "d", label: "Jour" },
          { key: "o", label: "Ouvrier" },
          { key: "p", label: "Présence" },
          { key: "l", label: "Lieu de travail" },
          { key: "n", label: "Observations" },
          { key: "s", label: "Statut" },
          { key: "x", label: "" },
        ]}
        rows={lignes.map((p) => ({
          d: formatDate(p.date),
          o: `${p.ouvrier_matricule} · ${p.ouvrier_nom}`,
          p: (
            <span className="inline-flex flex-col">
              <span>{PRESENCE_LABEL[p.presence]}</span>
              {p.absence_justifiee && <span className="text-[11.5px] text-muted">Justifiée : {p.motif_absence}</span>}
            </span>
          ),
          l: lieu(p),
          n: p.observations || "—",
          s: <StatusBadge tone={p.statut === "VALIDE" ? "success" : "warning"}>{STATUT_POINTAGE_LABEL[p.statut]}</StatusBadge>,
          x:
            modifiable && p.statut === "SAISI" ? (
              <span className="inline-flex items-center gap-2">
                <button className="text-success text-[12px]" disabled={busy} onClick={() => void executer(() => actions.validerPointage(p.id))}>
                  Valider
                </button>
                <button className="text-danger" aria-label="Supprimer le pointage" disabled={busy} onClick={() => void executer(() => api.del(detail(endpoints.pointages, p.id)))}>
                  <Trash2 size={14} />
                </button>
              </span>
            ) : null,
        }))}
      />
    </Panel>
  );
}
