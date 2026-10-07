"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator, CheckCircle2, Droplets, Layers, ListTree, Receipt, Wrench } from "lucide-react";
import { DrawerSection } from "@/components/Drawer";
import { KpiCard } from "@/components/charts";
import { RefCrud } from "@/components/RefCrud";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, Guard, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import {
  CATEGORIE_COUT_LABEL,
  CATEGORIE_ECONOMIQUE_LABEL,
  INDUCTEUR_LABEL,
  NIVEAU_REPARTITION_LABEL,
  STATUT_DONNEE_LABEL,
  STATUT_REPARTITION_LABEL,
  TRAITEMENT_LABEL,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import type {
  CategorieCout,
  CategorieEconomique,
  Charge,
  ControleDoubleCompte,
  CoutEauTraitee,
  CoutRevientPeriode,
  Inducteur,
  RepartitionCout,
  StatutDonnee,
  StatutRepartition,
  Traitement,
} from "@/lib/types";
import { cn, formatDa, formatQty, num } from "@/lib/utils";

type Onglet = "charges" | "revient" | "eau" | "natures";

const TONE_REPARTITION: Record<StatutRepartition, "neutral" | "success" | "warning" | "danger"> = {
  A_REPARTIR: "neutral",
  REPARTIE: "success",
  PARTIELLE: "warning",
  NON_REPARTIE: "danger",
};

function moisCourant() {
  return new Date().toISOString().slice(0, 7);
}

const opt = <T extends string>(labels: Record<T, string>) => (Object.keys(labels) as T[]).map((k) => ({ value: k, label: labels[k] }));

/**
 * Coûts en cascade : charge → étape → direct / indirect → activité → OF → produit → pack → unité.
 * Une charge commune se répartit avec l’inducteur qui explique sa consommation ; jamais de clé
 * arbitraire : sans valeur d’inducteur, la charge reste non répartie. Stockage et distribution
 * sont calculés à part du coût de production.
 */
export default function CoutsCascadePage() {
  const { can } = useStore();
  const [periode, setPeriode] = useState(moisCourant());
  const [onglet, setOnglet] = useState<Onglet>("charges");
  const gestion = can("GERER_COUTS_CASCADE");

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Coûts"
        title="Coûts en cascade"
        description="Chaque charge est rattachée à l’étape où elle est consommée puis répartie par son inducteur (m³ d’eau, bouteilles, heures machine…) jusqu’à l’OF et au produit. La chaîne de calcul de chaque montant est conservée."
        actions={
          <Field label="Période">
            <input type="month" className={cn(inputClass, "w-[160px]")} value={periode} onChange={(e) => setPeriode(e.target.value)} />
          </Field>
        }
      />
      <CalculPeriode periode={periode} gestion={gestion} />
      <Tabs
        label="Coûts en cascade"
        value={onglet}
        onChange={setOnglet}
        items={[
          { value: "charges", label: "Charges", icon: Receipt },
          { value: "revient", label: "Coût de revient", icon: Calculator },
          { value: "eau", label: "Eau traitée", icon: Droplets },
          { value: "natures", label: "Éléments de coût", icon: Layers },
        ]}
      />
      {onglet === "charges" && <Charges periode={periode} gestion={gestion} />}
      {onglet === "revient" && <CoutRevient periode={periode} />}
      {onglet === "eau" && <EauTraitee periode={periode} />}
      {onglet === "natures" && <Natures gestion={gestion} />}
    </div>
  );
}

/** Calcul de la période (répartition + coût réel des OF) et contrôle de non double compte. */
function CalculPeriode({ periode, gestion }: { periode: string; gestion: boolean }) {
  const { dispatch } = useStore();
  const [controle, setControle] = useState<ControleDoubleCompte | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const verifier = useCallback(async () => {
    try {
      setControle(await actions.controleDoubleCompte(periode));
    } catch {
      setControle(null);
    }
  }, [periode]);

  useEffect(() => {
    setMessage(null);
    void verifier();
  }, [verifier]);

  async function calculer() {
    setBusy("calcul");
    let texte = "";
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        const r = await actions.calculerCascade(periode);
        texte = `${r.charges} charge(s) traitée(s) : ${r.repartie} répartie(s), ${r.partielle} partielle(s), ${r.non_repartie} non répartie(s) ; ${r.ofs_recalcules} OF recalculé(s).`;
      },
      refresh: ["charges", "coutsReels"],
    });
    setBusy(null);
    if (ok) {
      setMessage(texte);
      void verifier();
    }
  }

  async function amortissements() {
    setBusy("amort");
    let texte = "";
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        const r = await actions.genererAmortissements(periode);
        texte = r.length ? `${r.length} charge(s) d’amortissement créée(s) depuis les équipements.` : "Aucune nouvelle charge d’amortissement (déjà générées ou équipements sans valeur).";
      },
      refresh: ["charges", "naturesCout"],
    });
    setBusy(null);
    if (ok) setMessage(texte);
  }

  return (
    <div className="space-y-3">
      {gestion && (
        <Panel className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-[12.5px] text-muted flex-1">
            Saisissez les charges de <span className="font-medium text-ink">{periode}</span>, générez les amortissements, puis lancez le calcul : répartition complète et mise à jour du coût réel des OF.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy != null} onClick={() => void amortissements()}>
              <Wrench size={14} /> {busy === "amort" ? "…" : "Générer les amortissements"}
            </Button>
            <Button disabled={busy != null} onClick={() => void calculer()}>
              <Calculator size={14} /> {busy === "calcul" ? "Calcul…" : "Calculer la période"}
            </Button>
          </div>
        </Panel>
      )}
      {message && (
        <Guard variant="ok" title="Calcul terminé">
          {message}
        </Guard>
      )}
      {controle &&
        (controle.conforme ? (
          <p className="text-[12.5px] text-success flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Aucun double compte : chaque niveau ventile exactement le montant du niveau supérieur.
          </p>
        ) : (
          <Guard variant="block" title="Écarts de répartition (double compte)">
            <ul className="space-y-0.5">
              {controle.anomalies.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Guard>
        ))}
    </div>
  );
}

function Charges({ periode, gestion }: { periode: string; gestion: boolean }) {
  const { state } = useStore();
  const charges = state.charges.filter((c) => c.periode === periode);
  const total = charges.reduce((a, c) => a + num(c.montant), 0);
  const nonReparties = charges.filter((c) => c.statut_repartition === "NON_REPARTIE" || c.statut_repartition === "PARTIELLE");
  const natures = state.naturesCout.filter((n) => n.actif).map((n) => ({ value: n.id, label: `${n.libelle}${n.etape_libelle ? ` [${n.etape_libelle}]` : ""}` }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Charges de la période" value={formatDa(total)} hint={`${charges.length} charge(s)`} />
        <KpiCard label="Réparties" value={charges.filter((c) => c.statut_repartition === "REPARTIE").length} tone="success" />
        <KpiCard label="À répartir" value={charges.filter((c) => c.statut_repartition === "A_REPARTIR").length} tone="teal" />
        <KpiCard label="Non / partiellement réparties" value={nonReparties.length} tone={nonReparties.length ? "danger" : "success"} />
      </div>
      <RefCrud
        titre={`Charges ${periode}`}
        description="Factures, salaires, maintenance, amortissements… Directe si elle vise un OF, une activité (cuve dédiée) ou une tournée ; commune sinon (ex. forage)."
        items={charges}
        endpoint={endpoints.charges}
        refresh={["charges"]}
        writable={gestion}
        rechercheDans={(c) => [c.numero, c.nature_libelle, c.source, c.etape]}
        libelleItem={(c) => `${c.numero} · ${c.nature_libelle ?? ""}`}
        supprimable={() => true}
        vide="Aucune charge saisie pour cette période."
        valeursInitiales={{ nature: 0, periode, montant: "", activite: 0, equipement: 0, ordre_fabrication: 0, tournee: 0, statut_donnee: "REEL", source: "", observations: "" }}
        champs={[
          { cle: "nature", label: "Élément de coût", type: "select", options: natures, requis: true },
          { cle: "periode", label: "Période (AAAA-MM)", requis: true },
          { cle: "montant", label: "Montant (FCFA)", type: "number", requis: true },
          { cle: "statut_donnee", label: "Donnée", type: "select", options: opt<StatutDonnee>(STATUT_DONNEE_LABEL) },
          { cle: "activite", label: "Activité (vide = commune)", type: "select", options: state.activites.map((a) => ({ value: a.id, label: a.designation })) },
          { cle: "equipement", label: "Équipement", type: "select", options: state.equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })) },
          { cle: "ordre_fabrication", label: "OF (charge directe)", type: "select", options: state.ofList.map((o) => ({ value: o.id, label: o.numero })) },
          { cle: "tournee", label: "Tournée (distribution)", type: "select", options: state.tournees.map((t) => ({ value: t.id, label: t.numero })) },
          { cle: "source", label: "Source", placeholder: "facture SBEE n°…, relevé compteur", pleineLargeur: true },
          { cle: "observations", label: "Observations", type: "textarea" },
        ]}
        colonnes={[
          { cle: "n", label: "N°", rendu: (c) => <span className="num font-medium">{c.numero}</span> },
          {
            cle: "e",
            label: "Élément de coût",
            rendu: (c) => (
              <span className="inline-flex flex-col">
                <span>{c.nature_libelle}</span>
                <span className="text-[11.5px] text-muted">
                  {c.etape ?? "Sans étape"}
                  {c.inducteur ? ` · ${INDUCTEUR_LABEL[c.inducteur]}` : ""}
                </span>
              </span>
            ),
          },
          { cle: "c", label: "Catégorie", rendu: (c) => (c.categorie ? CATEGORIE_COUT_LABEL[c.categorie] : "—") },
          { cle: "m", label: "Montant", className: "text-right", rendu: (c) => <span className="num">{formatDa(num(c.montant))}</span> },
          { cle: "d", label: "Donnée", rendu: (c) => (c.statut_donnee === "ESTIME" ? <StatusBadge tone="warning">Estimé</StatusBadge> : "Réel") },
          {
            cle: "r",
            label: "Répartition",
            rendu: (c) => (
              <span className="inline-flex flex-col gap-0.5">
                <StatusBadge tone={TONE_REPARTITION[c.statut_repartition]}>{STATUT_REPARTITION_LABEL[c.statut_repartition]}</StatusBadge>
                {c.motif_non_repartition && <span className="text-[11px] text-muted whitespace-normal max-w-[260px]">{c.motif_non_repartition}</span>}
              </span>
            ),
          },
        ]}
        actionsDrawer={(c) => <ChaineCalcul charge={c} />}
      />
    </div>
  );
}

/** Chaîne de calcul d’une charge : activité → OF → produit, avec clé, quote-part et coût unitaire. */
function ChaineCalcul({ charge }: { charge: Charge }) {
  const [lignes, setLignes] = useState<RepartitionCout[] | null>(null);
  useEffect(() => {
    let annule = false;
    void actions
      .cascadeCharge(charge.id)
      .then((r) => !annule && setLignes(r.repartitions))
      .catch(() => !annule && setLignes([]));
    return () => {
      annule = true;
    };
  }, [charge.id, charge.statut_repartition]);

  return (
    <DrawerSection title="Chaîne de calcul" hint="Calculée par « Calculer la période ».">
      {!lignes ? (
        <p className="text-[12.5px] text-muted">Chargement…</p>
      ) : lignes.length === 0 ? (
        <p className="text-[12.5px] text-muted">Pas encore répartie.</p>
      ) : (
        <ul className="rounded-[9px] border border-line divide-y divide-line">
          {lignes.map((l) => (
            <li key={l.id} className={cn("px-3 py-2 text-[12.5px]", l.niveau === "OF" && "pl-6", (l.niveau === "PRODUIT" || l.niveau === "ARTICLE") && "pl-9")}>
              <div className="flex justify-between gap-3">
                <span>
                  <ListTree size={12} className="inline text-muted mr-1" />
                  {NIVEAU_REPARTITION_LABEL[l.niveau]} : <span className="font-medium">{l.of_numero ?? l.article_code ?? l.activite_code ?? "—"}</span>
                  {l.etape_libelle && <span className="text-muted"> · {l.etape_libelle}</span>}
                </span>
                <span className="num font-semibold">{formatDa(num(l.montant))}</span>
              </div>
              <p className="text-[11.5px] text-muted num">
                {INDUCTEUR_LABEL[l.inducteur]}
                {l.valeur_cle_part != null && l.valeur_cle_totale != null && ` : ${formatQty(num(l.valeur_cle_part), 2)} / ${formatQty(num(l.valeur_cle_totale), 2)} ${l.unite_cle}`}
                {` · quote-part ${formatQty(num(l.quote_part) * 100, 2)} %`}
                {l.cout_par_unite != null && ` · ${formatQty(num(l.cout_par_unite), 2)} FCFA / unité`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DrawerSection>
  );
}

function useDonnees<T>(charger: () => Promise<T>, cle: string) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    let annule = false;
    setDonnees(null);
    setErreur(null);
    void charger()
      .then((d) => !annule && setDonnees(d))
      .catch((e) => !annule && setErreur(e instanceof Error ? e.message : "Données indisponibles."));
    return () => {
      annule = true;
    };
    // `cle` résume les dépendances (période + données rechargées).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
  return { donnees, erreur };
}

function CoutRevient({ periode }: { periode: string }) {
  const { state } = useStore();
  const { donnees, erreur } = useDonnees<CoutRevientPeriode>(() => actions.coutRevient(periode), `${periode}-${state.charges.length}-${state.coutsReels.length}`);
  if (erreur) return <Panel className="p-4 text-[13px] text-danger">{erreur}</Panel>;
  if (!donnees) return <Panel className="p-4 text-[13px] text-muted">Calcul…</Panel>;
  const m = (v: string | number | null) => (v == null ? "—" : formatDa(num(v)));
  return (
    <div className="space-y-4">
      {donnees.charges_non_reparties.length > 0 && (
        <Guard variant="warn" title={`${donnees.charges_non_reparties.length} charge(s) non ou partiellement répartie(s)`}>
          <ul className="space-y-0.5">
            {donnees.charges_non_reparties.map((c) => (
              <li key={c.charge}>
                <span className="num font-medium">{c.charge}</span> · {c.nature} · {formatDa(num(c.montant))}
                {c.motif && <span className="text-muted"> — {c.motif}</span>}
              </li>
            ))}
          </ul>
        </Guard>
      )}
      <Panel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <h2 className="text-[13px] font-semibold">Coût de revient complet par produit</h2>
          <span className="text-[12px] text-muted">production + stockage + distribution</span>
        </div>
        <DataTable
          emptyText="Aucune production sur la période."
          columns={[
            { key: "a", label: "Produit" },
            { key: "u", label: "Unités", className: "text-right" },
            { key: "p", label: "Production / unité", className: "text-right" },
            { key: "s", label: "Stockage / unité", className: "text-right" },
            { key: "d", label: "Distribution / unité", className: "text-right" },
            { key: "c", label: "Revient complet / unité", className: "text-right" },
            { key: "t", label: "Total", className: "text-right" },
          ]}
          rows={donnees.produits.map((p) => ({
            a: (
              <span className="inline-flex flex-col">
                <span className="font-medium">{p.designation}</span>
                <span className="text-[11.5px] text-muted">{p.article}</span>
              </span>
            ),
            u: <span className="num">{formatQty(num(p.unites), 0)}</span>,
            p: <span className="num">{m(p.production_par_unite)}</span>,
            s: <span className="num">{m(p.stockage_par_unite)}</span>,
            d: <span className="num">{m(p.distribution_par_unite)}</span>,
            c: <span className="num font-semibold">{m(p.cout_revient_complet_par_unite)}</span>,
            t: <span className="num">{m(p.cout_revient_complet)}</span>,
          }))}
        />
      </Panel>
      <Panel className="overflow-hidden">
        <h2 className="px-4 py-3 border-b border-line text-[13px] font-semibold">Coût de production par OF</h2>
        <DataTable
          emptyText="Aucun OF sur la période."
          columns={[
            { key: "o", label: "OF" },
            { key: "q", label: "Produit (unités / packs)", className: "text-right" },
            { key: "m", label: "Matières", className: "text-right" },
            { key: "mo", label: "Main-d’œuvre", className: "text-right" },
            { key: "c", label: "Charges réparties", className: "text-right" },
            { key: "t", label: "Coût de production", className: "text-right" },
            { key: "u", label: "/ unité", className: "text-right" },
            { key: "p", label: "/ pack", className: "text-right" },
          ]}
          rows={donnees.ofs.map((o) => ({
            o: (
              <span className="inline-flex flex-col" title={Object.entries(o.charges_par_etape).map(([k, v]) => `${k} : ${formatDa(num(v))}`).join("\n")}>
                <span className="num font-medium">{o.of}</span>
                <span className="text-[11.5px] text-muted">{o.article}</span>
              </span>
            ),
            q: (
              <span className="num">
                {formatQty(num(o.unites), 0)} / {formatQty(num(o.packs), 0)}
              </span>
            ),
            m: <span className="num">{m(o.matieres)}</span>,
            mo: <span className="num">{m(o.main_oeuvre)}</span>,
            c: <span className="num">{m(o.charges_reparties)}</span>,
            t: <span className="num font-semibold">{m(o.cout_production)}</span>,
            u: <span className="num">{o.cout_par_unite != null ? formatQty(num(o.cout_par_unite), 2) : "—"}</span>,
            p: <span className="num">{o.cout_par_pack != null ? formatQty(num(o.cout_par_pack), 2) : "—"}</span>,
          }))}
        />
      </Panel>
    </div>
  );
}

function EauTraitee({ periode }: { periode: string }) {
  const { state } = useStore();
  const { donnees, erreur } = useDonnees<CoutEauTraitee[]>(() => actions.coutEauTraitee(periode), `${periode}-${state.charges.length}`);
  if (erreur) return <Panel className="p-4 text-[13px] text-danger">{erreur}</Panel>;
  if (!donnees) return <Panel className="p-4 text-[13px] text-muted">Calcul…</Panel>;
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h2 className="text-[13px] font-semibold">Coût de l’eau traitée par activité</h2>
        <p className="text-[12px] text-muted">Charges amont (captage, traitement, stockage process) imputées à l’activité / litres utilisés par ses OF. Sert à valoriser l’eau traitée des recettes.</p>
      </div>
      <DataTable
        emptyText="Aucune activité."
        columns={[
          { key: "a", label: "Activité" },
          { key: "c", label: "Charges amont", className: "text-right" },
          { key: "l", label: "Litres utilisés", className: "text-right" },
          { key: "pl", label: "Coût / litre", className: "text-right" },
          { key: "pm", label: "Coût / m³", className: "text-right" },
        ]}
        rows={donnees.map((d) => ({
          a: <span className="font-medium">{d.activite}</span>,
          c: <span className="num">{formatDa(num(d.charges_amont))}</span>,
          l: <span className="num">{formatQty(num(d.litres), 0)}</span>,
          pl: <span className="num">{d.cout_par_litre != null ? `${formatQty(num(d.cout_par_litre), 4)} FCFA` : "—"}</span>,
          pm: <span className="num">{d.cout_par_m3 != null ? formatDa(num(d.cout_par_m3)) : "—"}</span>,
        }))}
      />
    </Panel>
  );
}

function Natures({ gestion }: { gestion: boolean }) {
  const { state } = useStore();
  const etapes = [...state.etapesStandard].sort((a, b) => a.ordre_reference - b.ordre_reference).map((e) => ({ value: e.id, label: e.libelle }));
  return (
    <RefCrud
      titre="Éléments de coût"
      description="Pour chaque élément : l’étape où il est consommé, direct ou indirect, et l’inducteur qui justifie sa répartition. Une charge indirecte se répartit toujours avec un inducteur (pas de clé arbitraire)."
      items={[...state.naturesCout].sort((a, b) => a.categorie.localeCompare(b.categorie) || a.libelle.localeCompare(b.libelle))}
      endpoint={endpoints.naturesCout}
      refresh={["naturesCout"]}
      writable={gestion}
      rechercheDans={(n) => [n.code, n.libelle, n.etape_libelle, INDUCTEUR_LABEL[n.inducteur]]}
      libelleItem={(n) => `${n.code} · ${n.libelle}`}
      valeursInitiales={{
        libelle: "",
        etape: 0,
        categorie: "PRODUCTION",
        categorie_economique: "AUTRE",
        traitement: "INDIRECT",
        inducteur: "HEURES_MACHINE",
        justification: "",
        date_debut: "",
        date_fin: "",
        actif: true,
      }}
      champs={[
        { cle: "libelle", label: "Élément de coût", requis: true },
        { cle: "etape", label: "Étape", type: "select", options: etapes },
        { cle: "categorie", label: "Catégorie", type: "select", requis: true, options: opt<CategorieCout>(CATEGORIE_COUT_LABEL) },
        { cle: "categorie_economique", label: "Catégorie économique", type: "select", options: opt<CategorieEconomique>(CATEGORIE_ECONOMIQUE_LABEL) },
        { cle: "traitement", label: "Traitement", type: "select", requis: true, options: opt<Traitement>(TRAITEMENT_LABEL) },
        { cle: "inducteur", label: "Clé / inducteur", type: "select", requis: true, options: opt<Inducteur>(INDUCTEUR_LABEL) },
        { cle: "date_debut", label: "Valide à partir du", type: "date" },
        { cle: "date_fin", label: "Valide jusqu’au", type: "date" },
        { cle: "actif", label: "Actif", type: "checkbox" },
        { cle: "justification", label: "Justification de la clé", type: "textarea" },
      ]}
      colonnes={[
        { cle: "l", label: "Élément", rendu: (n) => <span className="font-medium">{n.libelle}</span> },
        { cle: "e", label: "Étape", rendu: (n) => n.etape_libelle ?? "—" },
        { cle: "c", label: "Catégorie", rendu: (n) => CATEGORIE_COUT_LABEL[n.categorie] },
        { cle: "t", label: "Traitement", rendu: (n) => TRAITEMENT_LABEL[n.traitement] },
        { cle: "i", label: "Inducteur", rendu: (n) => INDUCTEUR_LABEL[n.inducteur] },
        { cle: "s", label: "Statut", rendu: (n) => (n.actif ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>) },
      ]}
    />
  );
}
