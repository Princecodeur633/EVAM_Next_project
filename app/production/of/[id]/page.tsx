"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Ban, Droplets, PackagePlus, Plus, Users } from "lucide-react";
import { OfBadge } from "@/components/badges";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { Historique } from "@/components/Historique";
import { AgentPicker, ComplementDrawer, useAgentsDisponibles } from "@/components/production";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, Guard, OF_STEPS, PageHeader, Panel, StatusBadge, StatusStepper, inputClass } from "@/components/ui";
import { endpoints } from "@/lib/api";
import {
  ETAPE_LABEL,
  MOTIF_PERTE_LABEL,
  STATUT_DEMANDE_COMPLEMENTAIRE_LABEL,
  STATUT_DEMANDE_MATIERE_LABEL,
  STATUT_LOT_LABEL,
  STATUT_OF_LABEL,
  TYPE_SORTIE_LABEL,
} from "@/lib/labels";
import { nextOfStatut, useStore } from "@/lib/store";
import type { OrdreFabrication } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

type Onglet = "synthese" | "besoins" | "sorties" | "etapes" | "eau" | "lots" | "historique";

export default function OfDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, articleName, can } = useStore();
  const of = state.ofList.find((o) => o.id === Number(id));
  const [onglet, setOnglet] = useState<Onglet>("synthese");
  const [annulation, setAnnulation] = useState(false);
  const [avancement, setAvancement] = useState(false);

  if (!of) return <p className="text-[13px] text-muted">Ordre de fabrication introuvable.</p>;

  const modifiable = of.statut !== "CLOTURE" && of.statut !== "ANNULE";
  const next = nextOfStatut(of.statut);
  const article = state.articles.find((a) => a.id === of.article);
  const famille = state.famillesArticle.find((f) => f.id === article?.famille);
  const estEau = famille?.nom.toLowerCase().includes("eau") ?? false;

  const besoins = state.besoinsMatieres.filter((b) => b.ordre_fabrication === of.id);
  const demandes = state.demandesMatieres.filter((d) => d.ordre_fabrication === of.id);
  const complements = state.demandesComplementaires.filter((d) => d.ordre_fabrication === of.id);
  const sorties = state.sortiesMatieres.filter((s) => s.ordre_fabrication === of.id);
  const retours = state.retoursMatieres.filter((r) => r.ordre_fabrication === of.id);
  const etapes = state.etapes.filter((e) => e.ordre_fabrication === of.id);
  const pertes = state.pertes.filter((p) => p.ordre_fabrication === of.id);
  const lots = state.lots.filter((l) => l.ordre_fabrication === of.id);
  const suivisEau = state.suivisEau.filter((s) => s.ordre_fabrication === of.id);
  const nonLivrees = demandes.filter((d) => d.statut !== "LIVREE_A_LA_PRODUCTION" && d.statut !== "ANNULEE").length;

  const onglets: { value: Onglet; label: string; count?: number }[] = [
    { value: "synthese", label: "Synthèse" },
    { value: "besoins", label: "Besoins matières", count: besoins.length },
    { value: "sorties", label: "Sorties", count: sorties.length + retours.length },
    { value: "etapes", label: "Étapes & pertes", count: etapes.length + pertes.length },
    ...(estEau ? [{ value: "eau" as const, label: "Suivi eau", count: suivisEau.length }] : []),
    { value: "lots", label: "Lots", count: lots.length },
    { value: "historique", label: "Historique" },
  ];

  const peutAvancer = can("AVANCER_OF") && next != null;
  const peutAnnuler = can("ANNULER_OF") && modifiable;

  async function avancer() {
    setAvancement(true);
    await dispatch({ type: "AVANCER_OF", id: of!.id });
    setAvancement(false);
  }

  return (
    <div className="space-y-4 max-w-[1280px]">
      <Link href="/production/of" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft size={13} /> Ordres de fabrication
      </Link>
      <PageHeader
        eyebrow="Ordre de fabrication"
        title={of.numero}
        status={<OfBadge status={of.statut} />}
        description={`${articleName(of.article)} · ${formatQty(num(of.quantite_a_produire), 0)} à produire`}
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

      <Tabs label="Fiche OF" value={onglet} onChange={setOnglet} items={onglets} />

      <div className="min-h-[240px]">
        {onglet === "synthese" && <Synthese of={of} modifiable={modifiable} />}
        {onglet === "besoins" && <BesoinsMatieres of={of} modifiable={modifiable} />}
        {onglet === "sorties" && (
          <div className="space-y-4">
            <Bloc titre="Sorties matières">
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
                columns={[{ key: "e", label: "Étape" }, { key: "q", label: "Quantité produite", className: "text-right" }, { key: "d", label: "Début" }, { key: "f", label: "Fin" }, { key: "o", label: "Observations" }]}
                rows={etapes.map((e) => ({
                  e: ETAPE_LABEL[e.etape],
                  q: <span className="num">{e.quantite_produite != null ? formatQty(num(e.quantite_produite), 0) : "—"}</span>,
                  d: e.date_debut ? formatDateTime(e.date_debut) : "—",
                  f: e.date_fin ? formatDateTime(e.date_fin) : "—",
                  o: e.observations || "—",
                }))}
              />
            </Bloc>
            <Bloc titre="Pertes">
              <DataTable
                emptyText="Aucune perte déclarée."
                columns={[{ key: "m", label: "Motif" }, { key: "q", label: "Quantité", className: "text-right" }, { key: "t", label: "Taux" }, { key: "d", label: "Constatée le" }]}
                rows={pertes.map((p) => ({
                  m: MOTIF_PERTE_LABEL[p.motif],
                  q: <span className="num">{formatQty(num(p.quantite_perte), 2)}</span>,
                  t: p.taux_perte != null ? `${num(p.taux_perte)} %` : "—",
                  d: formatDateTime(p.date_constat),
                }))}
              />
            </Bloc>
          </div>
        )}
        {onglet === "eau" && <SuiviEauOnglet of={of} modifiable={modifiable} />}
        {onglet === "lots" && (
          <Bloc titre="Lots issus de cet OF">
            <DataTable
              emptyText="Aucun lot : il est créé à la fin de la production."
              columns={[{ key: "n", label: "Lot" }, { key: "q", label: "Quantité", className: "text-right" }, { key: "s", label: "Statut" }, { key: "d", label: "Production" }, { key: "p", label: "Péremption" }]}
              rows={lots.map((l) => ({
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

function Bloc({ titre, action, children }: { titre: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold">{titre}</h2>
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
  const { state, dispatch, articleName, can } = useStore();
  const [complement, setComplement] = useState(false);
  const [demande, setDemande] = useState(false);
  const besoins = state.besoinsMatieres.filter((b) => b.ordre_fabrication === of.id);
  const demandes = state.demandesMatieres.filter((d) => d.ordre_fabrication === of.id);
  const dejaDemandees = demandes.some((d) => d.statut !== "ANNULEE");

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
      <Bloc titre="Besoins théoriques" action={action}>
        <DataTable
          emptyText="Aucun besoin : fiche technique manquante ou OF pas encore calculé."
          columns={[
            { key: "m", label: "Matière" },
            { key: "q", label: "Théorique", className: "text-right" },
            { key: "d", label: "Disponible", className: "text-right" },
            { key: "x", label: "Manquant", className: "text-right" },
            { key: "s", label: "Situation" },
          ]}
          rows={besoins.map((b) => {
            const manquant = b.manquant != null ? num(b.manquant) : 0;
            return {
              m: articleName(b.matiere),
              q: <span className="num">{formatQty(num(b.quantite_theorique), 3)}</span>,
              d: <span className="num">{b.stock_disponible != null ? formatQty(num(b.stock_disponible), 3) : "—"}</span>,
              x: <span className={cn("num", manquant > 0 && "text-danger font-semibold")}>{b.manquant != null ? formatQty(manquant, 3) : "—"}</span>,
              s: b.situation ? <StatusBadge tone={manquant > 0 ? "danger" : "success"}>{b.situation}</StatusBadge> : "—",
            };
          })}
        />
      </Bloc>
      {demandes.length > 0 && (
        <Bloc titre="Demandes au magasin">
          <DataTable
            columns={[{ key: "n", label: "N°" }, { key: "m", label: "Matière" }, { key: "q", label: "Demandée", className: "text-right" }, { key: "l", label: "Livrée", className: "text-right" }, { key: "s", label: "Statut" }]}
            rows={demandes.map((d) => ({
              n: d.numero,
              m: articleName(d.matiere),
              q: <span className="num">{formatQty(num(d.quantite_demandee), 3)}</span>,
              l: <span className="num">{d.quantite_livree != null ? formatQty(num(d.quantite_livree), 3) : "—"}</span>,
              s: <StatusBadge tone={d.statut === "LIVREE_A_LA_PRODUCTION" ? "success" : d.statut === "ANNULEE" ? "danger" : d.statut === "PREPAREE" ? "teal" : "info"}>{STATUT_DEMANDE_MATIERE_LABEL[d.statut]}</StatusBadge>,
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
