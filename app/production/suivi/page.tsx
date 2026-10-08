"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, ClipboardCheck, Droplets, ListChecks, Shuffle, Timer, TrendingDown } from "lucide-react";
import { OfBadge } from "@/components/badges";
import { ChangementSerieDrawer, estOfEau, etapesPourOf } from "@/components/production";
import { ControleLigne, SaisieControleDrawer, controlesEnAttente } from "@/components/qualite";
import { Tabs } from "@/components/Tabs";
import { Button, Panel, inputClass } from "@/components/ui";
import { api, endpoints } from "@/lib/api";
import { CHAMP_ETAPE_LABEL, MOTIF_PERTE_LABEL, NATURE_PERTE_LABEL, TYPE_EVENEMENT_LABEL, etapeLibelle } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ChampEtape, ControleRealise, MotifPerte, NaturePerte, TypeEvenement } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

type Onglet = "etape" | "perte" | "eau" | "session" | "controles" | "serie";
const ONGLETS: Onglet[] = ["etape", "perte", "eau", "session", "controles", "serie"];

const big = cn(inputClass, "h-11 text-[15px]");

function today(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function heure(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function SaisirPage() {
  return (
    <Suspense fallback={null}>
      <Saisir />
    </Suspense>
  );
}

/** Gabarit C : saisie atelier mobile — OF, onglets, formulaire, [Enregistrer] pleine largeur, saisies du jour. */
function Saisir() {
  const { state, articleName } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const ofs = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  const ordre = (s: string) => (s === "EN_PRODUCTION" ? 0 : s === "PRET" ? 1 : 2);
  const tries = [...ofs].sort((a, b) => ordre(a.statut) - ordre(b.statut));
  const paramOf = Number(params.get("of"));
  const ofId = tries.some((o) => o.id === paramOf) ? paramOf : (tries[0]?.id ?? 0);
  const of = state.ofList.find((o) => o.id === ofId);
  const eau = of ? estOfEau(state, of) : false;
  const aControler = controlesEnAttente(state.controlesRealises.filter((c) => c.ordre_fabrication === ofId)).length;
  const paramTab = params.get("tab") as Onglet | null;
  const onglet: Onglet = paramTab && ONGLETS.includes(paramTab) && (paramTab !== "eau" || eau) ? paramTab : "etape";

  const go = (next: { of?: number; tab?: Onglet }) => {
    const q = new URLSearchParams({ of: String(next.of ?? ofId), tab: next.tab ?? onglet });
    router.replace(`/production/suivi?${q.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-[640px] mx-auto space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-medium">Atelier</p>
        <h1 className="text-[22px] font-semibold tracking-tight">Saisir</h1>
      </div>

      {tries.length === 0 ? (
        <Panel className="px-5 py-12 text-center">
          <p className="text-[14px] font-medium">Aucun OF ouvert ne vous est affecté.</p>
          <p className="text-[12.5px] text-muted mt-1">Le responsable de production vous affecte aux OF.</p>
        </Panel>
      ) : (
        <>
          <Panel className="p-3 space-y-2">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">Ordre de fabrication</span>
              <select className={big} value={ofId} onChange={(e) => go({ of: Number(e.target.value), tab: onglet === "eau" ? "etape" : onglet })}>
                {tries.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero} · {articleName(o.article)}
                  </option>
                ))}
              </select>
            </label>
            {of && (
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="text-muted truncate">
                  {formatQty(num(of.quantite_a_produire), 0)} à produire
                  {of.ligne_code && ` · ligne ${of.ligne_code}`}
                </span>
                <OfBadge status={of.statut} />
              </div>
            )}
          </Panel>

          <Tabs
            label="Type de saisie"
            value={onglet}
            onChange={(tab) => go({ tab })}
            items={[
              { value: "etape", label: "Étape", icon: ListChecks },
              { value: "perte", label: "Perte", icon: TrendingDown },
              ...(eau ? [{ value: "eau" as const, label: "Eau", icon: Droplets }] : []),
              { value: "session", label: "Session", icon: Timer },
              { value: "controles", label: "Contrôles", icon: ClipboardCheck, count: aControler || undefined },
              { value: "serie", label: "Série & cuves", icon: Shuffle },
            ]}
          />

          {onglet === "etape" && <EtapeForm key={`e${ofId}`} ofId={ofId} />}
          {onglet === "perte" && <PerteForm key={`p${ofId}`} ofId={ofId} />}
          {onglet === "eau" && <EauForm key={`w${ofId}`} ofId={ofId} />}
          {onglet === "session" && <SessionForm key={`s${ofId}`} ofId={ofId} />}
          {onglet === "controles" && <ControlesOf key={`c${ofId}`} ofId={ofId} />}
          {onglet === "serie" && <SerieOf key={`r${ofId}`} ofId={ofId} />}
        </>
      )}
    </div>
  );
}

/** Formulaire + bouton Enregistrer collé en bas (au-dessus de la barre de navigation mobile). */
function FormShell({ children, valide, saving, onSave, recap }: { children: ReactNode; valide: boolean; saving: boolean; onSave: () => Promise<boolean>; recap: ReactNode }) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <Panel className="p-4 space-y-4">{children}</Panel>
      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-4 z-20">
        <Button
          className={cn("w-full h-12 text-[15px] shadow-[var(--shadow)]", ok && "bg-success hover:bg-success")}
          disabled={!valide || saving}
          onClick={async () => {
            if (!(await onSave())) return;
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          }}
        >
          {saving ? "Enregistrement…" : ok ? <><Check size={17} /> Enregistré</> : "Enregistrer"}
        </Button>
      </div>
      <section>
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Dernières saisies du jour</h2>
        <Panel className="overflow-hidden">{recap}</Panel>
      </section>
    </>
  );
}

function Recap({ lignes, vide }: { lignes: { k: string; a: ReactNode; b: ReactNode; c: ReactNode }[]; vide: string }) {
  if (lignes.length === 0) return <p className="px-4 py-6 text-center text-[12.5px] text-muted">{vide}</p>;
  return (
    <table className="w-full text-left text-[12.5px]">
      <tbody>
        {lignes.map((l) => (
          <tr key={l.k} className="border-b border-line last:border-0">
            <td className="px-3 py-2 text-muted num w-14">{l.a}</td>
            <td className="px-3 py-2 min-w-0">{l.b}</td>
            <td className="px-3 py-2 text-right num font-medium whitespace-nowrap">{l.c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="block text-[11px] uppercase tracking-wide text-muted mb-1.5 font-medium">{children}</span>;
}

/**
 * Saisie d’une étape : étapes du circuit de l’OF (sinon du paramétrage industriel), quantités entrée /
 * produite / rejetée ; poste, machine, arrêts, heures machine et énergie pour le coût par étape.
 */
function EtapeForm({ ofId }: { ofId: number }) {
  const { state, dispatch, ofNumero } = useStore();
  const of = state.ofList.find((o) => o.id === ofId);
  const etapes = etapesPourOf(state, of);
  const [etape, setEtape] = useState(etapes.find((e) => !e.saisies)?.code ?? etapes[0]?.code ?? "");
  const [entree, setEntree] = useState("");
  const [qty, setQty] = useState("");
  const [rejet, setRejet] = useState("");
  const [obs, setObs] = useState("");
  const [details, setDetails] = useState(false);
  const [poste, setPoste] = useState(0);
  const [machine, setMachine] = useState(0);
  const [arret, setArret] = useState("");
  const [heures, setHeures] = useState("");
  const [kwh, setKwh] = useState("");
  const [mesure, setMesure] = useState(false);
  const [fin, setFin] = useState("");
  const [saving, setSaving] = useState(false);
  const jour = state.etapes.filter((e) => today(e.date_fin) || today(e.date_debut)).slice(-8).reverse();
  // Données obligatoires de l’étape (paramétrées avec les techniciens) : 0 est accepté, pas le vide.
  const requis = new Set(state.donneesEtapes.filter((d) => d.obligatoire && d.etape_code === etape).map((d) => d.champ));
  const etoile = (champ: ChampEtape) => (requis.has(champ) ? " *" : "");
  const detailsRequis = (["poste", "equipement", "duree_arret_min", "heures_machine", "energie_kwh", "date_fin"] as ChampEtape[]).some((c) => requis.has(c));

  // Poste et machine proposés : ceux de l’étape choisie, sur la ligne de l’OF si elle est connue.
  const etapeStd = state.etapesStandard.find((e) => e.code === etape);
  const postes = state.postes.filter((p) => p.actif && p.etape === etapeStd?.id && (!of?.ligne || p.ligne === of.ligne));
  const machines = state.equipements.filter((m) => m.actif && (poste ? m.poste === poste : postes.some((p) => p.id === m.poste)));
  const incoherent = entree !== "" && qty !== "" && Number(qty) > Number(entree);

  async function save() {
    setSaving(true);
    const nb = (v: string) => (v.trim() === "" ? undefined : Number(v));
    const ok = await dispatch({
      type: "CREATE_ETAPE",
      ordre_fabrication: ofId,
      etape,
      quantite_entree: nb(entree),
      quantite_produite: Number(qty),
      quantite_rejetee: nb(rejet),
      observations: obs.trim() || undefined,
      poste: poste || null,
      equipement: machine || null,
      duree_arret_min: nb(arret),
      heures_machine: nb(heures),
      energie_kwh: nb(kwh),
      energie_mesuree: mesure && kwh.trim() !== "",
      date_fin: fin ? new Date(`${new Date().toISOString().slice(0, 10)}T${fin}`).toISOString() : undefined,
    });
    setSaving(false);
    if (ok) {
      setEntree("");
      setQty("");
      setRejet("");
      setObs("");
      setArret("");
      setHeures("");
      setKwh("");
      setFin("");
    }
    return ok;
  }

  const valeurs: Partial<Record<ChampEtape, string | number>> = {
    quantite_entree: entree,
    quantite_produite: qty,
    quantite_rejetee: rejet,
    duree_arret_min: arret,
    heures_machine: heures,
    energie_kwh: kwh,
    poste,
    equipement: machine,
    date_fin: fin,
    date_debut: "auto",
  };
  const manquants = [...requis].filter((c) => {
    const v = valeurs[c];
    return v === "" || v === 0 || v === undefined;
  });

  return (
    <FormShell
      valide={!!etape && Number(qty) > 0 && !incoherent && manquants.length === 0}
      saving={saving}
      onSave={save}
      recap={
        <Recap
          vide="Aucune étape saisie aujourd’hui."
          lignes={jour.map((e) => ({
            k: String(e.id),
            a: heure(e.date_fin ?? e.date_debut),
            b: `${ofNumero(e.ordre_fabrication)} · ${etapeLibelle(e.etape, state.etapesStandard)}`,
            c: e.quantite_produite != null ? formatQty(num(e.quantite_produite), 0) : "—",
          }))}
        />
      }
    >
      <div>
        <Label>{of?.circuit_code ? `Étape du circuit ${of.circuit_code}` : "Étape"}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {etapes.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => {
                setEtape(k.code);
                setPoste(0);
                setMachine(0);
              }}
              aria-pressed={etape === k.code}
              className={cn(
                "min-h-11 px-2 py-1.5 rounded-[8px] border text-[13px] font-medium transition-colors leading-tight",
                etape === k.code ? "bg-primary text-white border-primary" : "bg-surface border-line-strong hover:bg-surface-2",
              )}
            >
              {k.libelle}
              {(k.saisies ?? 0) > 0 && <span className={cn("block text-[10.5px] font-normal", etape === k.code ? "text-white/80" : "text-success")}>✓ saisie</span>}
              {!k.obligatoire && (of?.etapes_prevues?.length ?? 0) > 0 && (
                <span className={cn("block text-[10.5px] font-normal", etape === k.code ? "text-white/80" : "text-muted")}>facultative</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <Label>Entrée{etoile("quantite_entree")}</Label>
          <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={entree} onChange={(e) => setEntree(e.target.value)} placeholder="—" />
        </label>
        <label className="block">
          <Label>Produite</Label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            className={cn(big, "num text-right font-semibold", incoherent && "border-danger")}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="block">
          <Label>Rejetée{etoile("quantite_rejetee")}</Label>
          <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={rejet} onChange={(e) => setRejet(e.target.value)} placeholder="—" />
        </label>
      </div>
      {incoherent && <p className="text-[12px] text-danger -mt-2">La quantité produite ne peut pas dépasser la quantité entrée.</p>}
      {requis.size > 0 && (
        <p className={cn("text-[12px] -mt-1", manquants.length ? "text-warning" : "text-muted")}>
          * Données obligatoires à cette étape (0 accepté)
          {manquants.length > 0 && ` — manquant : ${manquants.map((c) => CHAMP_ETAPE_LABEL[c]).join(", ")}`}
        </p>
      )}
      <label className="block">
        <Label>Observations</Label>
        <input className={big} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Facultatif" />
      </label>
      <button type="button" onClick={() => setDetails((d) => !d)} className="flex items-center gap-1.5 text-[12.5px] font-medium text-primary">
        <ChevronDown size={14} className={cn("transition-transform", details && "rotate-180")} /> Poste, machine, arrêts et énergie
      </button>
      {(details || detailsRequis) && (
        <div className="space-y-3 rounded-[8px] border border-line bg-surface-2/50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <Label>Poste{etoile("poste")}</Label>
              <select className={big} value={poste} onChange={(e) => setPoste(Number(e.target.value))}>
                <option value={0}>—</option>
                {postes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>Machine{etoile("equipement")}</Label>
              <select className={big} value={machine} onChange={(e) => setMachine(Number(e.target.value))}>
                <option value={0}>—</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} · {m.designation}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <Label>Arrêts (min){etoile("duree_arret_min")}</Label>
              <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={arret} onChange={(e) => setArret(e.target.value)} />
            </label>
            <label className="block">
              <Label>Heures machine{etoile("heures_machine")}</Label>
              <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={heures} onChange={(e) => setHeures(e.target.value)} placeholder="auto" />
            </label>
            <label className="block">
              <Label>Énergie (kWh){etoile("energie_kwh")}</Label>
              <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={kwh} onChange={(e) => setKwh(e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[12.5px]">
            <input type="checkbox" checked={mesure} onChange={(e) => setMesure(e.target.checked)} disabled={kwh.trim() === ""} />
            kWh relevés sur un compteur (sinon : valeur estimée)
          </label>
          <label className="block">
            <Label>Heure de fin{etoile("date_fin")}</Label>
            <input type="time" className={big} value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
          <p className="text-[11.5px] text-muted">Heures machine vides : durée de l’étape moins les arrêts.</p>
        </div>
      )}
    </FormShell>
  );
}

/** Déclaration d’une perte : motif, nature (coût identifié), étape et matière perdue (valorisée au CMUP). */
function PerteForm({ ofId }: { ofId: number }) {
  const { state, dispatch, ofNumero, articleName } = useStore();
  const of = state.ofList.find((o) => o.id === ofId);
  const etapes = etapesPourOf(state, of);
  const [motif, setMotif] = useState<MotifPerte>("CASSE");
  const [nature, setNature] = useState<NaturePerte>("AUTRE");
  const [etape, setEtape] = useState("");
  const [matiere, setMatiere] = useState(0);
  const [qty, setQty] = useState("");
  const [obs, setObs] = useState("");
  const [typeQuantite, setTypeQuantite] = useState<"REELLE" | "ESTIMEE">("REELLE");
  const [saving, setSaving] = useState(false);
  const jour = state.pertes.filter((p) => today(p.date_constat)).slice(-8).reverse();
  // Matières et emballages prévus pour cet OF : la perte est alors valorisée au coût moyen.
  const matieresOf = [...new Set(state.besoinsMatieres.filter((b) => b.ordre_fabrication === ofId).map((b) => b.matiere))];

  async function save() {
    setSaving(true);
    const ok = await dispatch({
      type: "CREATE_PERTE",
      ordre_fabrication: ofId,
      quantite_perte: Number(qty),
      motif,
      nature,
      etape_code: etape,
      matiere: matiere || null,
      observations: obs.trim() || undefined,
      type_quantite: typeQuantite,
    });
    setSaving(false);
    if (ok) {
      setQty("");
      setObs("");
    }
    return ok;
  }

  return (
    <FormShell
      valide={Number(qty) > 0}
      saving={saving}
      onSave={save}
      recap={
        <Recap
          vide="Aucune perte déclarée aujourd’hui."
          lignes={jour.map((p) => ({
            k: String(p.id),
            a: heure(p.date_constat),
            b: `${ofNumero(p.ordre_fabrication)} · ${p.nature && p.nature !== "AUTRE" ? NATURE_PERTE_LABEL[p.nature] : MOTIF_PERTE_LABEL[p.motif]}`,
            c: formatQty(num(p.quantite_perte), 0),
          }))}
        />
      }
    >
      <div>
        <Label>Motif</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MOTIF_PERTE_LABEL) as MotifPerte[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMotif(k)}
              aria-pressed={motif === k}
              className={cn("h-11 px-2 rounded-[8px] border text-[13px] font-medium transition-colors", motif === k ? "bg-danger text-white border-danger" : "bg-surface border-line-strong hover:bg-surface-2")}
            >
              {MOTIF_PERTE_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <Label>Nature de la perte</Label>
          <select className={big} value={nature} onChange={(e) => setNature(e.target.value as NaturePerte)}>
            {(Object.keys(NATURE_PERTE_LABEL) as NaturePerte[]).map((k) => (
              <option key={k} value={k}>
                {NATURE_PERTE_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Label>Étape</Label>
          <select className={big} value={etape} onChange={(e) => setEtape(e.target.value)}>
            <option value="">—</option>
            {etapes.map((e) => (
              <option key={e.code} value={e.code}>
                {e.libelle}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <Label>Matière / emballage perdu</Label>
        <select className={big} value={matiere} onChange={(e) => setMatiere(Number(e.target.value))}>
          <option value={0}>Produit en cours (non valorisé)</option>
          {matieresOf.map((id) => (
            <option key={id} value={id}>
              {articleName(id)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <Label>Quantité perdue</Label>
        <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right text-[18px] font-semibold")} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
      </label>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Quantité comptée ou estimée">
        {(["REELLE", "ESTIMEE"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeQuantite(t)}
            aria-pressed={typeQuantite === t}
            className={cn("h-10 rounded-[8px] border text-[13px] font-medium", typeQuantite === t ? "bg-primary text-white border-primary" : "bg-surface border-line-strong hover:bg-surface-2")}
          >
            {t === "REELLE" ? "Comptée" : "Estimée"}
          </button>
        ))}
      </div>
      <label className="block">
        <Label>Observations</Label>
        <input className={big} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Facultatif" />
      </label>
    </FormShell>
  );
}

function EauForm({ ofId }: { ofId: number }) {
  const { state, dispatch } = useStore();
  const vide = { capte: "", envoye: "", obtenu: "", embout: "", produites: "", conformes: "", rejetees: "", packs: "" };
  const [v, setV] = useState(vide);
  const [saving, setSaving] = useState(false);
  const n = (k: keyof typeof v) => Number(v[k]) || 0;
  // Le suivi eau n’a pas de date : on affiche les derniers relevés de cet OF.
  const derniers = state.suivisEau.filter((s) => s.ordre_fabrication === ofId).slice(-5).reverse();

  async function save() {
    setSaving(true);
    const ok = await dispatch({
      type: "CREATE_SUIVI_EAU",
      ordre_fabrication: ofId,
      volume_capte_l: n("capte"),
      volume_envoye_traitement_l: n("envoye") || undefined,
      volume_obtenu_traitement_l: n("obtenu"),
      volume_envoye_embouteillage_l: n("embout"),
      bouteilles_produites: n("produites"),
      bouteilles_conformes: n("conformes"),
      bouteilles_rejetees: n("rejetees") || undefined,
      nombre_packs: n("packs") || undefined,
    });
    setSaving(false);
    if (ok) setV(vide);
    return ok;
  }

  const champ = (k: keyof typeof v, label: string) => (
    <label className="block">
      <Label>{label}</Label>
      <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} />
    </label>
  );

  return (
    <FormShell
      valide={n("capte") > 0 && n("obtenu") > 0 && n("embout") > 0 && n("produites") > 0}
      saving={saving}
      onSave={save}
      recap={
        <Recap
          vide="Aucun relevé pour cet OF."
          lignes={derniers.map((s, i) => ({ k: String(s.id), a: `#${derniers.length - i}`, b: `${formatQty(num(s.volume_capte_l), 0)} L captés`, c: `${s.bouteilles_conformes}/${s.bouteilles_produites} bt.` }))}
        />
      }
    >
      <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold">Volumes (litres)</p>
      <div className="grid grid-cols-2 gap-3">
        {champ("capte", "Capté")}
        {champ("envoye", "Envoyé traitement")}
        {champ("obtenu", "Obtenu traitement")}
        {champ("embout", "Embouteillage")}
      </div>
      <p className="text-[11px] uppercase tracking-[0.1em] text-muted font-semibold pt-1">Bouteilles</p>
      <div className="grid grid-cols-2 gap-3">
        {champ("produites", "Produites")}
        {champ("conformes", "Conformes")}
        {champ("rejetees", "Rejetées")}
        {champ("packs", "Packs")}
      </div>
    </FormShell>
  );
}

function SessionForm({ ofId }: { ofId: number }) {
  const { state, dispatch, ofNumero } = useStore();
  const now = new Date();
  const [heureDebut, setHeureDebut] = useState(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  const [equipe, setEquipe] = useState("");
  const [v, setV] = useState({ entree: "", produite: "", conforme: "", rejetee: "" });
  const [arrets, setArrets] = useState("");
  const [incidents, setIncidents] = useState("");
  const [saving, setSaving] = useState(false);
  const date = now.toISOString().slice(0, 10);
  const jour = state.suivisProduction.filter((s) => s.date === date && state.ofList.some((o) => o.id === s.ordre_fabrication)).slice(-8).reverse();

  async function save() {
    setSaving(true);
    const n = (k: keyof typeof v) => (v[k] ? Number(v[k]) : undefined);
    const ok = await dispatch({
      type: "CREATE_SUIVI_PROD",
      ordre_fabrication: ofId,
      date,
      heure_debut: `${heureDebut}:00`,
      quantite_entree: Number(v.entree),
      quantite_produite: n("produite"),
      quantite_conforme: n("conforme"),
      quantite_rejetee: n("rejetee"),
      equipe: equipe.trim() || undefined,
      arrets: arrets.trim() || undefined,
      incidents: incidents.trim() || undefined,
    });
    setSaving(false);
    if (ok) {
      setV({ entree: "", produite: "", conforme: "", rejetee: "" });
      setArrets("");
      setIncidents("");
    }
    return ok;
  }

  const champ = (k: keyof typeof v, label: string) => (
    <label className="block">
      <Label>{label}</Label>
      <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} />
    </label>
  );

  return (
    <FormShell
      valide={Number(v.entree) > 0 && !!heureDebut}
      saving={saving}
      onSave={save}
      recap={
        <Recap
          vide="Aucune session aujourd’hui."
          lignes={jour.map((s) => ({ k: String(s.id), a: s.heure_debut.slice(0, 5), b: `${ofNumero(s.ordre_fabrication)}${s.equipe ? ` · ${s.equipe}` : ""}`, c: s.quantite_produite != null ? formatQty(num(s.quantite_produite), 0) : formatQty(num(s.quantite_entree), 0) }))}
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <Label>Heure de début</Label>
          <input type="time" className={big} value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
        </label>
        <label className="block">
          <Label>Équipe</Label>
          <input className={big} value={equipe} onChange={(e) => setEquipe(e.target.value)} placeholder="Matin, A…" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {champ("entree", "Entrée")}
        {champ("produite", "Produite")}
        {champ("conforme", "Conforme")}
        {champ("rejetee", "Rejetée")}
      </div>
      <label className="block">
        <Label>Arrêts</Label>
        <input className={big} value={arrets} onChange={(e) => setArrets(e.target.value)} placeholder="Ex. 15 min réglage" />
      </label>
      <label className="block">
        <Label>Incidents</Label>
        <input className={big} value={incidents} onChange={(e) => setIncidents(e.target.value)} placeholder="Facultatif" />
      </label>
    </FormShell>
  );
}

/** Contrôles qualité générés pour l’OF par le plan (démarrage, périodiques, chaque lot, changement de série). */
function ControlesOf({ ofId }: { ofId: number }) {
  const { state } = useStore();
  const [ouvert, setOuvert] = useState<ControleRealise | null>(null);
  const tous = state.controlesRealises.filter((c) => c.ordre_fabrication === ofId);
  const aFaire = controlesEnAttente(tous);
  const faits = tous
    .filter((c) => !aFaire.includes(c))
    .sort((a, b) => (b.date_realisation ?? "").localeCompare(a.date_realisation ?? ""))
    .slice(0, 8);

  return (
    <>
      <Panel className="overflow-hidden">
        <div className="px-3 py-2 border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-[0.1em] text-muted font-semibold">À réaliser ({aFaire.length})</div>
        {aFaire.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun contrôle en attente pour cet OF.</p>
        ) : (
          <div className="divide-y divide-line">
            {aFaire.map((c) => (
              <ControleLigne key={c.id} controle={c} onClick={() => setOuvert(c)} />
            ))}
          </div>
        )}
      </Panel>
      <section>
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Derniers contrôles réalisés</h2>
        <Panel className="overflow-hidden">
          {faits.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun contrôle réalisé.</p>
          ) : (
            <div className="divide-y divide-line">
              {faits.map((c) => (
                <ControleLigne key={c.id} controle={c} onClick={() => setOuvert(c)} />
              ))}
            </div>
          )}
        </Panel>
      </section>
      <p className="text-[11.5px] text-muted">Les contrôles sont générés par le plan de contrôle au démarrage de l’OF, à chaque lot et après un changement de série.</p>
      {ouvert && <SaisieControleDrawer controle={ouvert} onClose={() => setOuvert(null)} />}
    </>
  );
}

/** Changements de série enregistrés sur l’OF, et déclaration d’un nouveau. */
function SerieOf({ ofId }: { ofId: number }) {
  const { state, can, articleName } = useStore();
  const of = state.ofList.find((o) => o.id === ofId);
  const [ouvert, setOuvert] = useState(false);
  const series = state.changementsSerie.filter((c) => c.ordre_fabrication === ofId);
  const lance = !!of && of.statut !== "BROUILLON";

  return (
    <>
      <Panel className="p-4 space-y-3">
        <p className="text-[13px] text-muted">Avant de démarrer un nouveau format ou produit sur la ligne : temps d’arrêt, nettoyage, réglage, essais et rebuts de démarrage.</p>
        {can("SAISIR_CHANGEMENT_SERIE") && (
          <Button className="w-full h-11" disabled={!lance} onClick={() => setOuvert(true)}>
            <Shuffle size={16} /> Déclarer un changement de série
          </Button>
        )}
        {!lance && <p className="text-[12px] text-warning">L’OF doit être lancé pour enregistrer un changement de série.</p>}
      </Panel>
      <section>
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Changements de série de l’OF</h2>
        <Panel className="overflow-hidden">
          <Recap
            vide="Aucun changement de série."
            lignes={series.map((c) => ({
              k: String(c.id),
              a: heure(c.date_debut),
              b: c.article_precedent ? `Depuis ${articleName(c.article_precedent)}` : formatDateTime(c.date_debut),
              c: `${formatQty(num(c.duree_arret_min) + num(c.duree_nettoyage_min) + num(c.duree_reglage_min), 0)} min`,
            }))}
          />
        </Panel>
      </section>
      {ouvert && of && <ChangementSerieDrawer of={of} onClose={() => setOuvert(false)} />}
      <EvenementsOf ofId={ofId} />
    </>
  );
}

/** Cuve préparée, nettoyage / désinfection, arrêt puis redémarrage : chaque événement génère les contrôles prévus au plan. */
function EvenementsOf({ ofId }: { ofId: number }) {
  const { state, dispatch, can } = useStore();
  const of = state.ofList.find((o) => o.id === ofId);
  const enProduction = of?.statut === "EN_PRODUCTION";
  const [type, setType] = useState<TypeEvenement>("CUVE");
  const [equipement, setEquipement] = useState(0);
  const [cuve, setCuve] = useState("");
  const [volume, setVolume] = useState("");
  const [duree, setDuree] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const evenements = state.evenementsProduction.filter((e) => e.ordre_fabrication === ofId);
  const equipements = state.equipements.filter(
    (m) => m.actif && (type !== "CUVE" || m.type_equipement === "CUVE" || m.type_equipement === "MELANGEUR"),
  );

  async function save() {
    setSaving(true);
    const nb = (v: string) => (v.trim() === "" ? null : Number(v));
    const ok = await dispatch({
      type: "EXEC",
      run: () =>
        api.post(endpoints.evenementsProduction, {
          ordre_fabrication: ofId,
          type_evenement: type,
          equipement: equipement || null,
          numero_cuve: cuve.trim(),
          volume: type === "CUVE" ? nb(volume) : null,
          duree_min: nb(duree),
          observations: obs.trim(),
        }),
      refresh: ["evenementsProduction", "controlesRealises"],
    });
    setSaving(false);
    if (ok) {
      setCuve("");
      setVolume("");
      setDuree("");
      setObs("");
    }
  }

  return (
    <>
      {can("SAISIR_EVENEMENT_PRODUCTION") && (
        <Panel className="p-4 space-y-3">
          <p className="text-[13px] text-muted">Cuve préparée, nettoyage ou arrêt/redémarrage : les contrôles prévus pour cet événement sont générés.</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_EVENEMENT_LABEL) as TypeEvenement[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setType(k);
                  setEquipement(0);
                }}
                aria-pressed={type === k}
                className={cn("min-h-11 px-2 py-1.5 rounded-[8px] border text-[12.5px] font-medium leading-tight", type === k ? "bg-primary text-white border-primary" : "bg-surface border-line-strong hover:bg-surface-2")}
              >
                {TYPE_EVENEMENT_LABEL[k]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <Label>{type === "CUVE" ? "Cuve / mélangeur" : "Machine"}</Label>
              <select className={big} value={equipement} onChange={(e) => setEquipement(Number(e.target.value))}>
                <option value={0}>—</option>
                {equipements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} · {m.designation}
                  </option>
                ))}
              </select>
            </label>
            {type === "CUVE" ? (
              <label className="block">
                <Label>N° de cuvée</Label>
                <input className={big} value={cuve} onChange={(e) => setCuve(e.target.value)} placeholder="Facultatif" />
              </label>
            ) : (
              <label className="block">
                <Label>Durée (min)</Label>
                <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={duree} onChange={(e) => setDuree(e.target.value)} />
              </label>
            )}
          </div>
          {type === "CUVE" && (
            <label className="block">
              <Label>Volume (L)</Label>
              <input type="number" inputMode="decimal" min="0" className={cn(big, "num text-right")} value={volume} onChange={(e) => setVolume(e.target.value)} />
            </label>
          )}
          <label className="block">
            <Label>Observations</Label>
            <input className={big} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Facultatif" />
          </label>
          <Button className="w-full h-11" disabled={!enProduction || saving} onClick={() => void save()}>
            {saving ? "Enregistrement…" : "Enregistrer l’événement"}
          </Button>
          {!enProduction && <p className="text-[12px] text-warning">L’OF doit être en production pour enregistrer un événement.</p>}
        </Panel>
      )}
      <section>
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted font-semibold mb-2">Événements de l’OF</h2>
        <Panel className="overflow-hidden">
          <Recap
            vide="Aucun événement."
            lignes={evenements.map((e) => ({
              k: String(e.id),
              a: heure(e.date),
              b: `${TYPE_EVENEMENT_LABEL[e.type_evenement]}${e.numero_cuve ? ` · ${e.numero_cuve}` : ""}`,
              c: e.volume != null ? `${formatQty(num(e.volume), 0)} L` : e.duree_min != null ? `${formatQty(num(e.duree_min), 0)} min` : "—",
            }))}
          />
        </Panel>
      </section>
    </>
  );
}
