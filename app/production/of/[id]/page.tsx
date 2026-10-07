"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Ban, ClipboardCheck, Droplets, FileText, PackagePlus, PencilLine, Plus, Route, Shuffle, Users } from "lucide-react";
import { OfBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Historique } from "@/components/Historique";
import { AgentPicker, ChangementSerieDrawer, ComplementDrawer, estOfEau, useAgentsDisponibles } from "@/components/production";
import { ControleLigne, NcBadge, SaisieControleDrawer, controlesEnAttente } from "@/components/qualite";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, Guard, OF_STEPS, PageHeader, Panel, StatusBadge, StatusStepper, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import {
  MOTIF_PERTE_LABEL,
  NATURE_PERTE_LABEL,
  etapeLibelle,
  STATUT_DEMANDE_COMPLEMENTAIRE_LABEL,
  STATUT_DEMANDE_MATIERE_LABEL,
  STATUT_LOT_LABEL,
  STATUT_OF_LABEL,
  TYPE_SORTIE_LABEL,
} from "@/lib/labels";
import { nextOfStatut, useStore } from "@/lib/store";
import type { ConsommationLotMatiere, ControleRealise, OrdreFabrication, VerificationStockOF } from "@/lib/types";
import { cn, formatDa, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

type Onglet = "synthese" | "besoins" | "sorties" | "etapes" | "qualite" | "eau" | "lots" | "historique";

export default function OfDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, can, role } = useStore();
  const router = useRouter();
  const of = state.ofList.find((o) => o.id === Number(id));
  // Agent de production : consultation seule (stepper, besoins, étapes, pertes) ; la saisie se fait dans « Saisir ».
  const lecture = role === "AGENT_PRODUCTION";
  const [choix, setOnglet] = useState<Onglet | null>(null);
  const [annulation, setAnnulation] = useState(false);
  const [avancement, setAvancement] = useState(false);

  if (!of) return <p className="text-[13px] text-muted">Ordre de fabrication introuvable.</p>;

  const modifiable = of.statut !== "CLOTURE" && of.statut !== "ANNULE";
  const next = nextOfStatut(of.statut);
  const estEau = estOfEau(state, of);

  const besoins = state.besoinsMatieres.filter((b) => b.ordre_fabrication === of.id);
  const demandes = state.demandesMatieres.filter((d) => d.ordre_fabrication === of.id);
  const complements = state.demandesComplementaires.filter((d) => d.ordre_fabrication === of.id);
  const sorties = state.sortiesMatieres.filter((s) => s.ordre_fabrication === of.id);
  const retours = state.retoursMatieres.filter((r) => r.ordre_fabrication === of.id);
  const etapes = state.etapes.filter((e) => e.ordre_fabrication === of.id);
  const pertes = state.pertes.filter((p) => p.ordre_fabrication === of.id);
  const lots = state.lots.filter((l) => l.ordre_fabrication === of.id);
  const suivisEau = state.suivisEau.filter((s) => s.ordre_fabrication === of.id);
  const controles = state.controlesRealises.filter((c) => c.ordre_fabrication === of.id);
  const ncs = state.nonConformites.filter((n) => n.ordre_fabrication === of.id);
  const nonLivrees = demandes.filter((d) => d.statut !== "LIVREE_A_LA_PRODUCTION" && d.statut !== "ANNULEE").length;

  const tous: { value: Onglet; label: string; count?: number }[] = [
    { value: "synthese", label: "Synthèse" },
    { value: "besoins", label: "Besoins matières", count: besoins.length },
    { value: "sorties", label: "Sorties", count: sorties.length + retours.length },
    { value: "etapes", label: "Étapes & pertes", count: etapes.length + pertes.length },
    { value: "qualite", label: "Qualité", count: controlesEnAttente(controles).length + ncs.filter((n) => n.statut !== "CLOTUREE").length },
    ...(estEau ? [{ value: "eau" as const, label: "Suivi eau", count: suivisEau.length }] : []),
    { value: "lots", label: "Lots", count: lots.length },
    { value: "historique", label: "Historique" },
  ];
  const onglets = lecture ? tous.filter((t) => t.value === "besoins" || t.value === "etapes" || t.value === "qualite" || t.value === "eau") : tous;
  const onglet: Onglet = choix && onglets.some((t) => t.value === choix) ? choix : onglets[0].value;

  const peutAvancer = !lecture && can("AVANCER_OF") && next != null;
  const peutAnnuler = !lecture && can("ANNULER_OF") && modifiable;

  async function avancer() {
    setAvancement(true);
    await dispatch({ type: "AVANCER_OF", id: of!.id });
    setAvancement(false);
  }

  return (
    <div className="space-y-4 max-w-[1280px]">
      <Link href="/production/of" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> {lecture ? "Mes OF" : "Ordres de fabrication"}
      </Link>
      <PageHeader
        eyebrow="Ordre de fabrication"
        title={of.numero}
        status={<OfBadge status={of.statut} />}
        description={`${articleName(of.article)} · ${formatQty(num(of.quantite_a_produire), 0)} à produire${of.ligne_code ? ` · ligne ${of.ligne_code}` : ""}${of.usine_code ? ` (${of.usine_code})` : ""}`}
        actions={
          lecture && modifiable ? (
            <Link href={`/production/suivi?of=${of.id}&tab=etape`} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-[7px] bg-primary text-white text-[13.5px] font-medium hover:bg-primary-hover w-full sm:w-auto">
              <PencilLine size={15} /> Saisir sur cet OF
            </Link>
          ) : undefined
        }
      />
      <StatusStepper steps={OF_STEPS} current={of.statut === "ANNULE" ? "BROUILLON" : of.statut} />

      {of.statut === "PRODUCTION_TERMINEE" && (
        <Guard variant="warn" title="Production terminée — contrôle qualité en attente">
          Le stock vendable n’existe qu’après le contrôle et la libération du lot.
        </Guard>
      )}
      {of.statut === "ANNULE" && (
        <Guard variant="block" title="OF annulé">
          {of.motif_annulation || "Motif non renseigné."}
        </Guard>
      )}
      {!lecture && of.statut === "BROUILLON" && <ControleLancement of={of} />}
      {!lecture && (of.statut === "PRODUCTION_TERMINEE" || of.statut === "EN_CONTROLE") && <BlocagesCloture of={of} />}

      <Tabs label="Fiche OF" value={onglet} onChange={setOnglet} items={onglets} />

      <div className="min-h-[240px]">
        {onglet === "synthese" && <Synthese of={of} modifiable={modifiable} />}
        {onglet === "besoins" && <BesoinsMatieres of={of} modifiable={modifiable && !lecture} />}
        {onglet === "sorties" && (
          <div className="space-y-4">
            <Bloc
              titre="Sorties matières"
              meta={of.usine_code ? `Magasin de l’usine ${of.usine_code}` : undefined}
              action={
                of.statut !== "BROUILLON" ? (
                  <Button variant="secondary" className="h-8 px-3 text-[12.5px]" onClick={() => void actions.pdf("bonSortie", of.id, of.numero).catch(() => {})}>
                    <FileText size={14} /> Bon de sortie (PDF)
                  </Button>
                ) : undefined
              }
            >
              <DataTable
                emptyText="Aucune sortie pour cet OF."
                columns={[{ key: "m", label: "Matière" }, { key: "q", label: "Quantité", className: "text-right" }, { key: "t", label: "Type" }, { key: "d", label: "Date" }]}
                rows={sorties.map((s) => ({
                  m: articleName(s.matiere),
                  q: <span className="num">{formatQty(num(s.quantite_sortie), 3)}</span>,
                  t: TYPE_SORTIE_LABEL[s.type_sortie] ?? s.type_sortie,
                  d: formatDateTime(s.date_sortie),
                }))}
              />
            </Bloc>
            <Bloc titre="Retours au magasin">
              <DataTable
                emptyText="Aucun retour."
                columns={[{ key: "m", label: "Matière" }, { key: "q", label: "Quantité retournée", className: "text-right" }, { key: "d", label: "Date" }]}
                rows={retours.map((r) => ({ m: articleName(r.matiere), q: <span className="num">{formatQty(num(r.quantite_retournee), 3)}</span>, d: formatDateTime(r.date_retour) }))}
              />
            </Bloc>
            {sorties.length > 0 && <LotsConsommes of={of} />}
            {complements.length > 0 && (
              <Bloc titre="Demandes complémentaires">
                <DataTable
                  columns={[{ key: "n", label: "N°" }, { key: "m", label: "Matière" }, { key: "q", label: "Quantité", className: "text-right" }, { key: "mo", label: "Motif" }, { key: "s", label: "Statut" }]}
                  rows={complements.map((c) => ({
                    n: c.numero,
                    m: articleName(c.matiere),
                    q: <span className="num">{formatQty(num(c.quantite), 3)}</span>,
                    mo: c.motif,
                    s: STATUT_DEMANDE_COMPLEMENTAIRE_LABEL[c.statut],
                  }))}
                />
              </Bloc>
            )}
          </div>
        )}
        {onglet === "etapes" && (
          <div className="space-y-4">
            <Bloc titre="Étapes saisies par l’atelier">
              <DataTable
                emptyText="Aucune étape saisie."
                columns={[
                  { key: "e", label: "Étape" },
                  { key: "i", label: "Entrée", className: "text-right" },
                  { key: "q", label: "Produite", className: "text-right" },
                  { key: "r", label: "Rejetée", className: "text-right" },
                  { key: "h", label: "Heures machine", className: "text-right" },
                  { key: "k", label: "Énergie", className: "text-right" },
                  { key: "d", label: "Début" },
                  { key: "o", label: "Observations" },
                ]}
                rows={etapes.map((e) => ({
                  e: etapeLibelle(e.etape, state.etapesStandard),
                  i: <span className="num">{e.quantite_entree != null ? formatQty(num(e.quantite_entree), 0) : "—"}</span>,
                  q: <span className="num">{e.quantite_produite != null ? formatQty(num(e.quantite_produite), 0) : "—"}</span>,
                  r: <span className="num">{e.quantite_rejetee != null ? formatQty(num(e.quantite_rejetee), 0) : "—"}</span>,
                  h: <span className="num">{e.heures_machine_effectives != null ? formatQty(num(e.heures_machine_effectives), 2) : "—"}</span>,
                  k: e.energie_kwh != null ? <span className="num" title={e.energie_mesuree ? "Relevé compteur" : "Estimé"}>{formatQty(num(e.energie_kwh), 1)} kWh{e.energie_mesuree ? "" : " (est.)"}</span> : "—",
                  d: e.date_debut ? formatDateTime(e.date_debut) : "—",
                  o: e.observations || "—",
                }))}
              />
            </Bloc>
            <Bloc titre="Pertes">
              <DataTable
                emptyText="Aucune perte déclarée."
                columns={[
                  { key: "m", label: "Motif" },
                  { key: "n", label: "Nature" },
                  { key: "e", label: "Étape" },
                  { key: "a", label: "Matière" },
                  { key: "q", label: "Quantité", className: "text-right" },
                  ...(lecture ? [] : [{ key: "v", label: "Valeur", className: "text-right" }]),
                  { key: "d", label: "Constatée le" },
                ]}
                rows={pertes.map((p) => ({
                  m: MOTIF_PERTE_LABEL[p.motif],
                  n: p.nature ? NATURE_PERTE_LABEL[p.nature] : "—",
                  e: p.etape_code ? etapeLibelle(p.etape_code, state.etapesStandard) : "—",
                  a: p.matiere ? articleName(p.matiere) : "—",
                  q: <span className="num">{formatQty(num(p.quantite_perte), 2)}</span>,
                  ...(lecture ? {} : { v: <span className="num">{p.valeur != null ? formatDa(num(p.valeur)) : "—"}</span> }),
                  d: formatDateTime(p.date_constat),
                }))}
              />
            </Bloc>
          </div>
        )}
        {onglet === "qualite" && <QualiteOf of={of} controles={controles} />}
        {onglet === "eau" && <SuiviEauOnglet of={of} modifiable={modifiable && !lecture} />}
        {onglet === "lots" && (
          <Bloc titre="Lots issus de cet OF">
            <DataTable
              emptyText="Aucun lot : il est créé à la fin de la production."
              columns={[{ key: "n", label: "Lot" }, { key: "q", label: "Quantité", className: "text-right" }, { key: "s", label: "Statut" }, { key: "d", label: "Production" }, { key: "p", label: "Péremption" }]}
              onRowClick={(row) => router.push(String(row.href))}
              rows={lots.map((l) => ({
                href: `/production/qualite/${l.id}`,
                n: <span className="num font-medium">{l.numero_lot}</span>,
                q: <span className="num">{formatQty(num(l.quantite), 0)}</span>,
                s: <StatusBadge tone={l.statut === "LIBERE" ? "success" : l.statut === "BLOQUE" ? "danger" : "warning"}>{STATUT_LOT_LABEL[l.statut] ?? l.statut}</StatusBadge>,
                d: formatDate(l.date_production),
                p: l.date_peremption ? formatDate(l.date_peremption) : "—",
              }))}
            />
          </Bloc>
        )}
        {onglet === "historique" && <Historique endpoint={endpoints.ofList} id={of.id} />}
      </div>

      {/* Barre d’action fixée en bas de l’écran */}
      {(peutAvancer || peutAnnuler) && (
        <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-4 py-3 border-t sm:border border-line bg-surface/95 backdrop-blur-md sm:rounded-[10px] shadow-[var(--shadow)] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[12px] text-muted flex-1 min-w-0">
            {of.statut === "MATIERES_EN_PREPARATION" && nonLivrees > 0
              ? `${nonLivrees} demande(s) de matières pas encore livrée(s) par le magasin.`
              : next
                ? `Étape suivante : ${STATUT_OF_LABEL[next]}.`
                : ""}
          </p>
          <div className="flex items-center gap-2 justify-end">
            {peutAnnuler && (
              <button type="button" onClick={() => setAnnulation(true)} className="h-9 px-3 text-[12.5px] text-muted hover:text-danger inline-flex items-center gap-1.5">
                <Ban size={13} /> Annuler l’OF
              </button>
            )}
            {peutAvancer && (
              <Button disabled={avancement} onClick={() => void avancer()}>
                {avancement ? "…" : <>Avancer <ArrowRight size={14} /> {STATUT_OF_LABEL[next!]}</>}
              </Button>
            )}
          </div>
        </div>
      )}

      {annulation && <AnnulerDrawer of={of} onClose={() => setAnnulation(false)} />}
    </div>
  );
}

function Bloc({ titre, action, meta, children }: { titre: string; action?: ReactNode; meta?: string; children: ReactNode }) {
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="text-[13px] font-semibold">{titre}</h2>
          {meta && <span className="text-[12px] text-muted num truncate">{meta}</span>}
        </div>
        {action}
      </div>
      {children}
    </Panel>
  );
}

function Synthese({ of, modifiable }: { of: OrdreFabrication; modifiable: boolean }) {
  const { dispatch, articleName, userName, can } = useStore();
  const agents = useAgentsDisponibles();
  const [choisis, setChoisis] = useState<number[]>(of.agents_affectes);
  const [saving, setSaving] = useState(false);
  useEffect(() => setChoisis(of.agents_affectes), [of.agents_affectes]);
  const dirty = choisis.length !== of.agents_affectes.length || choisis.some((c) => !of.agents_affectes.includes(c));
  const editable = can("AFFECTER_AGENTS_OF") && modifiable;

  async function save() {
    setSaving(true);
    await dispatch({ type: "AFFECTER_AGENTS_OF", id: of.id, agents: choisis });
    setSaving(false);
  }

  const lignes: [string, string][] = [
    ["Article", articleName(of.article)],
    ["Quantité", formatQty(num(of.quantite_a_produire), 0)],
    ["Activité", of.activite_code ?? "—"],
    ["Ligne / usine", of.ligne_code ? `${of.ligne_code}${of.usine_code ? ` · ${of.usine_code}` : ""}` : "Sans ligne (magasins par défaut)"],
    ["Circuit", of.circuit_code ?? "Aucun circuit validé"],
    ["Date prévue", of.date_prevue ? formatDate(of.date_prevue) : "—"],
    ["Responsable", userName(of.responsable)],
    ["Équipe", of.equipe || "—"],
    ["Créé le", formatDateTime(of.date_creation)],
    ["Début production", of.date_debut_production ? formatDateTime(of.date_debut_production) : "—"],
    ["Fin", of.date_fin ? formatDateTime(of.date_fin) : "—"],
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Panel className="overflow-hidden">
        <dl className="divide-y divide-line">
          {lignes.map(([k, v]) => (
            <div key={k} className="px-4 py-2.5 flex justify-between gap-3 text-[13px]">
              <dt className="text-muted shrink-0">{k}</dt>
              <dd className="text-right min-w-0 break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      {(of.etapes_prevues?.length ?? 0) > 0 && (
        <Bloc titre={`Circuit ${of.circuit_code ?? ""}`} meta={`${of.etapes_prevues?.filter((e) => e.saisies > 0).length}/${of.etapes_prevues?.length} étapes saisies`}>
          <ol className="divide-y divide-line">
            {of.etapes_prevues?.map((e) => (
              <li key={e.code} className="px-4 py-2 flex items-center gap-3 text-[12.5px]">
                <span className={cn("h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10.5px] font-semibold", e.saisies > 0 ? "bg-success text-white" : "bg-surface-2 border border-line text-muted")}>
                  {e.saisies > 0 ? "✓" : e.ordre}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{e.libelle}</span>
                  {!e.obligatoire && <span className="text-muted"> · facultative</span>}
                  {(e.poste || e.machine) && <span className="block text-[11.5px] text-muted">{[e.poste, e.machine].filter(Boolean).join(" · ")}</span>}
                </span>
                <span className="num text-muted">{e.quantite_produite != null ? formatQty(num(e.quantite_produite), 0) : "—"}</span>
              </li>
            ))}
          </ol>
        </Bloc>
      )}
      <Bloc
        titre={`Agents affectés (${of.agents_affectes.length})`}
        action={
          editable && dirty ? (
            <Button className="h-8 px-3 text-[12.5px]" disabled={saving} onClick={() => void save()}>
              {saving ? "…" : "Réaffecter"}
            </Button>
          ) : undefined
        }
      >
        <div className="p-3">
          {editable ? (
            <AgentPicker agents={agents} value={choisis} onChange={setChoisis} />
          ) : of.agents_affectes.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {of.agents_affectes.map((a) => (
                <li key={a} className="inline-flex items-center gap-1.5 text-[12.5px] px-2 py-1 rounded-[6px] bg-surface-2 border border-line">
                  <Users size={12} className="text-muted" /> {userName(a)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-muted">Aucun agent affecté.</p>
          )}
        </div>
      </Bloc>
    </div>
  );
}

function BesoinsMatieres({ of, modifiable }: { of: OrdreFabrication; modifiable: boolean }) {
  const { state, dispatch, articleName, can, role } = useStore();
  const [complement, setComplement] = useState(false);
  const [demande, setDemande] = useState(false);
  const besoins = state.besoinsMatieres.filter((b) => b.ordre_fabrication === of.id);
  const demandes = state.demandesMatieres.filter((d) => d.ordre_fabrication === of.id);
  const dejaDemandees = demandes.some((d) => d.statut !== "ANNULEE");
  // Aucune donnée financière n'est jamais transmise à l'Agent Production.
  const voitMontants = role !== "AGENT_PRODUCTION";

  const action = !modifiable ? undefined : !dejaDemandees ? (
    can("DEMANDER_MATIERES_OF") && besoins.length > 0 ? (
      <Button
        className="h-8 px-3 text-[12.5px]"
        disabled={demande}
        onClick={async () => {
          setDemande(true);
          await dispatch({ type: "DEMANDER_MATIERES_OF", id: of.id });
          setDemande(false);
        }}
      >
        <PackagePlus size={14} /> {demande ? "Envoi…" : "Demander les matières au magasin"}
      </Button>
    ) : undefined
  ) : can("CREATE_COMPLEMENT") ? (
    <Button variant="secondary" className="h-8 px-3 text-[12.5px]" onClick={() => setComplement(true)}>
      <Plus size={14} /> Demande complémentaire
    </Button>
  ) : undefined;

  return (
    <div className="space-y-4">
      <Bloc
        titre="Besoins théoriques"
        action={action}
        meta={voitMontants && of.montant_total_matieres != null ? `Montant total : ${formatDa(num(of.montant_total_matieres))}` : undefined}
      >
        <DataTable
          emptyText="Aucun besoin : fiche technique manquante ou OF pas encore calculé."
          columns={[
            { key: "m", label: "Matière" },
            { key: "q", label: "Théorique", className: "text-right" },
            { key: "d", label: "Disponible", className: "text-right" },
            { key: "x", label: "Manquant", className: "text-right" },
            { key: "s", label: "Situation" },
            ...(voitMontants ? [{ key: "mt", label: "Montant", className: "text-right" }] : []),
          ]}
          rows={besoins.map((b) => {
            const manquant = b.manquant != null ? num(b.manquant) : 0;
            return {
              m: articleName(b.matiere),
              q: <span className="num">{formatQty(num(b.quantite_theorique), 3)}</span>,
              d: <span className="num">{b.stock_disponible != null ? formatQty(num(b.stock_disponible), 3) : "—"}</span>,
              x: <span className={cn("num", manquant > 0 && "text-danger font-semibold")}>{b.manquant != null ? formatQty(manquant, 3) : "—"}</span>,
              s: b.situation ? <StatusBadge tone={manquant > 0 ? "danger" : "success"}>{b.situation}</StatusBadge> : "—",
              ...(voitMontants ? { mt: <span className="num">{b.montant != null ? formatDa(num(b.montant)) : "—"}</span> } : {}),
            };
          })}
        />
      </Bloc>
      {demandes.length > 0 && (
        <Bloc titre="Demandes au magasin">
          <DataTable
            columns={[
              { key: "n", label: "N°" },
              { key: "m", label: "Matière" },
              { key: "q", label: "Demandée", className: "text-right" },
              { key: "l", label: "Livrée", className: "text-right" },
              { key: "s", label: "Statut" },
              ...(voitMontants ? [{ key: "mt", label: "Montant", className: "text-right" }] : []),
            ]}
            rows={demandes.map((d) => ({
              n: d.numero,
              m: articleName(d.matiere),
              q: <span className="num">{formatQty(num(d.quantite_demandee), 3)}</span>,
              l: <span className="num">{d.quantite_livree != null ? formatQty(num(d.quantite_livree), 3) : "—"}</span>,
              s: <StatusBadge tone={d.statut === "LIVREE_A_LA_PRODUCTION" ? "success" : d.statut === "ANNULEE" ? "danger" : d.statut === "PREPAREE" ? "teal" : "info"}>{STATUT_DEMANDE_MATIERE_LABEL[d.statut]}</StatusBadge>,
              ...(voitMontants ? { mt: <span className="num">{d.montant != null ? formatDa(num(d.montant)) : "—"}</span> } : {}),
            }))}
          />
        </Bloc>
      )}
      {complement && <ComplementDrawer of={of} onClose={() => setComplement(false)} />}
    </div>
  );
}

function SuiviEauOnglet({ of, modifiable }: { of: OrdreFabrication; modifiable: boolean }) {
  const { state, can } = useStore();
  const [saisie, setSaisie] = useState(false);
  const suivis = state.suivisEau.filter((s) => s.ordre_fabrication === of.id);
  const pct = (perte: number, base: number) => (base ? `${formatQty((perte / base) * 100, 1)} %` : "—");

  return (
    <Bloc
      titre="Captage → traitement → embouteillage"
      action={
        can("CREATE_SUIVI_EAU") && modifiable ? (
          <Button className="h-8 px-3 text-[12.5px]" onClick={() => setSaisie(true)}>
            <Plus size={14} /> Saisir
          </Button>
        ) : undefined
      }
    >
      <DataTable
        emptyText="Aucun suivi eau saisi."
        columns={[
          { key: "c", label: "Capté (L)", className: "text-right" },
          { key: "o", label: "Après traitement (L)", className: "text-right" },
          { key: "e", label: "Embouteillage (L)", className: "text-right" },
          { key: "p", label: "Perte traitement" },
          { key: "b", label: "Bouteilles", className: "text-right" },
          { key: "r", label: "Rejet" },
        ]}
        rows={suivis.map((s) => {
          const capte = num(s.volume_capte_l);
          const obtenu = num(s.volume_obtenu_traitement_l);
          return {
            c: <span className="num">{formatQty(capte, 1)}</span>,
            o: <span className="num">{formatQty(obtenu, 1)}</span>,
            e: <span className="num">{formatQty(num(s.volume_envoye_embouteillage_l), 1)}</span>,
            p: pct(capte - obtenu, capte),
            b: <span className="num">{s.bouteilles_conformes} / {s.bouteilles_produites}</span>,
            r: pct(s.bouteilles_rejetees, s.bouteilles_produites),
          };
        })}
      />
      {saisie && <SuiviEauDrawer of={of} onClose={() => setSaisie(false)} />}
    </Bloc>
  );
}

function SuiviEauDrawer({ of, onClose }: { of: OrdreFabrication; onClose: () => void }) {
  const { dispatch } = useStore();
  const [v, setV] = useState({ capte: "", envoye: "", obtenu: "", embout: "", produites: "", conformes: "", rejetees: "", packs: "" });
  const [saving, setSaving] = useState(false);
  const n = (k: keyof typeof v) => Number(v[k]) || 0;
  const valide = n("capte") > 0 && n("obtenu") > 0 && n("embout") > 0 && n("produites") > 0;

  async function submit() {
    setSaving(true);
    const ok = await dispatch({
      type: "CREATE_SUIVI_EAU",
      ordre_fabrication: of.id,
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
    if (ok) onClose();
  }

  const champ = (k: keyof typeof v, label: string) => (
    <Field label={label}>
      <input type="number" min="0" className={cn(inputClass, "num text-right")} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} />
    </Field>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      title="Suivi eau"
      subtitle={of.numero}
      icon={<Droplets size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valide || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Volumes (litres)">
        <div className="grid grid-cols-2 gap-3">
          {champ("capte", "Capté")}
          {champ("envoye", "Envoyé traitement")}
          {champ("obtenu", "Obtenu traitement")}
          {champ("embout", "Envoyé embouteillage")}
        </div>
      </DrawerSection>
      <DrawerSection title="Bouteilles">
        <div className="grid grid-cols-2 gap-3">
          {champ("produites", "Produites")}
          {champ("conformes", "Conformes")}
          {champ("rejetees", "Rejetées")}
          {champ("packs", "Packs")}
        </div>
      </DrawerSection>
    </Drawer>
  );
}

function AnnulerDrawer({ of, onClose }: { of: OrdreFabrication; onClose: () => void }) {
  const { dispatch } = useStore();
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "ANNULER_OF", id: of.id, motif: motif.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Annuler ${of.numero}`}
      subtitle="L’annulation est définitive."
      icon={<Ban size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Retour
          </Button>
          <Button variant="danger" disabled={!motif.trim() || saving} onClick={() => void submit()}>
            {saving ? "Annulation…" : "Annuler l’OF"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Motif d’annulation">
        <textarea className={cn(inputClass, "h-24 py-2 resize-none")} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Obligatoire" autoFocus />
      </DrawerSection>
    </Drawer>
  );
}

/** Contrôle avant lancement : besoins de l’OF face au stock du magasin matières de son usine. */
function ControleLancement({ of }: { of: OrdreFabrication }) {
  const [verif, setVerif] = useState<VerificationStockOF | null>(null);
  useEffect(() => {
    let annule = false;
    void actions
      .verifierStockOf(of.id)
      .then((v) => !annule && setVerif(v))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [of.id, of.quantite_a_produire]);
  if (!verif) return null;
  if (verif.lancement_possible) {
    return (
      <Guard variant="ok" title="Stock suffisant pour lancer l’OF">
        Toutes les matières sont disponibles au « {verif.magasin} ».
      </Guard>
    );
  }
  return (
    <Guard variant={verif.blocage_actif ? "block" : "warn"} title={verif.blocage_actif ? "Lancement bloqué : stock insuffisant" : "Stock insuffisant (avertissement)"}>
      <p>Au « {verif.magasin} » :</p>
      <ul className="mt-1 space-y-0.5">
        {verif.manques.map((m) => (
          <li key={m.matiere} className="num">
            <span className="font-medium">{m.designation}</span> — besoin {formatQty(num(m.besoin), 3)}, disponible {formatQty(num(m.disponible), 3)},{" "}
            <span className="text-danger font-semibold">manque {formatQty(num(m.manquant), 3)}</span>
          </li>
        ))}
      </ul>
      {verif.blocage_actif && <p className="mt-1 text-[12px]">Approvisionnez le magasin ou ajustez la quantité avant de passer l’OF « À préparer ».</p>}
    </Guard>
  );
}

/** Ce qui empêche la clôture : contrôles bloquants non réalisés, NC bloquantes ouvertes. */
function BlocagesCloture({ of }: { of: OrdreFabrication }) {
  const [blocages, setBlocages] = useState<string[] | null>(null);
  const { state } = useStore();
  const signature = state.controlesRealises.filter((c) => c.ordre_fabrication === of.id).map((c) => c.statut).join();
  useEffect(() => {
    let annule = false;
    void actions
      .consommationReelleOf(of.id)
      .then((r) => !annule && setBlocages(r.blocages_qualite ?? []))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [of.id, of.statut, signature]);
  if (!blocages) return null;
  if (blocages.length === 0) {
    return (
      <Guard variant="ok" title="Aucun blocage qualité">
        Les contrôles bloquants sont réalisés et aucune non-conformité bloquante n’est ouverte.
      </Guard>
    );
  }
  return (
    <Guard variant="block" title="Clôture bloquée par la qualité">
      <ul className="space-y-0.5">
        {blocages.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </Guard>
  );
}

/** Traçabilité amont : lots de matières réellement consommés par les sorties de l’OF. */
function LotsConsommes({ of }: { of: OrdreFabrication }) {
  const [lots, setLots] = useState<ConsommationLotMatiere[] | null>(null);
  const { state } = useStore();
  const nbSorties = state.sortiesMatieres.filter((s) => s.ordre_fabrication === of.id).length;
  useEffect(() => {
    let annule = false;
    void actions
      .lotsConsommesOf(of.id)
      .then((l) => !annule && setLots(l))
      .catch(() => !annule && setLots([]));
    return () => {
      annule = true;
    };
  }, [of.id, nbSorties]);
  return (
    <Bloc titre="Lots matières consommés" meta="Les plus proches de leur DLC d’abord">
      <DataTable
        emptyText={lots === null ? "Chargement…" : "Aucun lot tracé (stock antérieur au suivi par lot)."}
        columns={[
          { key: "m", label: "Matière" },
          { key: "l", label: "Lot interne" },
          { key: "f", label: "Lot fournisseur" },
          { key: "q", label: "Consommé", className: "text-right" },
          { key: "r", label: "Retourné", className: "text-right" },
        ]}
        rows={(lots ?? []).map((c) => ({
          m: c.matiere,
          l: <span className="num font-medium">{c.lot_numero}</span>,
          f: c.lot_fournisseur || "—",
          q: <span className="num">{formatQty(num(c.quantite), 3)}</span>,
          r: <span className="num">{num(c.quantite_retournee) > 0 ? formatQty(num(c.quantite_retournee), 3) : "—"}</span>,
        }))}
      />
    </Bloc>
  );
}

/** Contrôles qualité, non-conformités et changements de série de l’OF. */
function QualiteOf({ of, controles }: { of: OrdreFabrication; controles: ControleRealise[] }) {
  const { state, can } = useStore();
  const [ouvert, setOuvert] = useState<ControleRealise | null>(null);
  const [serie, setSerie] = useState(false);
  const aFaire = controlesEnAttente(controles);
  const faits = controles.filter((c) => !aFaire.includes(c));
  const ncs = state.nonConformites.filter((n) => n.ordre_fabrication === of.id);
  const series = state.changementsSerie.filter((c) => c.ordre_fabrication === of.id);
  const ouvertOf = of.statut !== "CLOTURE" && of.statut !== "ANNULE" && of.statut !== "BROUILLON";

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Bloc titre={`Contrôles à réaliser (${aFaire.length})`}>
        {aFaire.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun contrôle en attente.</p>
        ) : (
          <div className="divide-y divide-line">
            {aFaire.map((c) => (
              <ControleLigne key={c.id} controle={c} onClick={() => setOuvert(c)} />
            ))}
          </div>
        )}
      </Bloc>
      <Bloc titre={`Contrôles réalisés (${faits.length})`}>
        {faits.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucun contrôle réalisé.</p>
        ) : (
          <div className="divide-y divide-line max-h-[360px] overflow-y-auto">
            {faits.map((c) => (
              <ControleLigne key={c.id} controle={c} onClick={() => setOuvert(c)} />
            ))}
          </div>
        )}
      </Bloc>
      <Bloc titre={`Non-conformités (${ncs.length})`}>
        {ncs.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12.5px] text-muted">Aucune non-conformité.</p>
        ) : (
          <ul className="divide-y divide-line">
            {ncs.map((n) => (
              <li key={n.id} className="px-4 py-2.5 flex items-start gap-3">
                <ClipboardCheck size={14} className={cn("mt-0.5 shrink-0", n.bloquante ? "text-danger" : "text-warning")} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium">
                    {n.numero}
                    {n.bloquante && <span className="text-danger"> · bloquante</span>}
                  </p>
                  <p className="text-[12px] text-muted break-words">{n.description}</p>
                </div>
                <NcBadge nc={n} />
              </li>
            ))}
          </ul>
        )}
      </Bloc>
      <Bloc
        titre={`Changements de série (${series.length})`}
        action={
          can("SAISIR_CHANGEMENT_SERIE") && ouvertOf ? (
            <Button variant="secondary" className="h-8 px-3 text-[12.5px]" onClick={() => setSerie(true)}>
              <Shuffle size={14} /> Déclarer
            </Button>
          ) : undefined
        }
      >
        <DataTable
          emptyText="Aucun changement de série."
          columns={[
            { key: "d", label: "Début" },
            { key: "a", label: "Arrêt", className: "text-right" },
            { key: "n", label: "Nettoyage", className: "text-right" },
            { key: "r", label: "Réglage", className: "text-right" },
            { key: "x", label: "Rebuts", className: "text-right" },
          ]}
          rows={series.map((c) => ({
            d: formatDateTime(c.date_debut),
            a: <span className="num">{formatQty(num(c.duree_arret_min), 0)} min</span>,
            n: <span className="num">{formatQty(num(c.duree_nettoyage_min), 0)} min</span>,
            r: <span className="num">{formatQty(num(c.duree_reglage_min), 0)} min</span>,
            x: <span className="num">{formatQty(num(c.rebuts_demarrage), 0)}</span>,
          }))}
        />
      </Bloc>
      {(of.etapes_prevues?.length ?? 0) === 0 && (
        <p className="lg:col-span-2 text-[12px] text-muted flex items-center gap-1.5">
          <Route size={13} /> Sans circuit, seuls les contrôles du plan sans étape précise sont générés pour cet OF.
        </p>
      )}
      {ouvert && <SaisieControleDrawer controle={ouvert} onClose={() => setOuvert(null)} />}
      {serie && <ChangementSerieDrawer of={of} onClose={() => setSerie(false)} />}
    </div>
  );
}
