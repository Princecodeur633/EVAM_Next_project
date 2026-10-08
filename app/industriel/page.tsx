"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRightLeft, Boxes, Building2, Check, ClipboardList, CopyPlus, Factory, GitBranch, Layers, ListOrdered, Plus, Settings2, Trash2, Wrench } from "lucide-react";
import { DrawerSection } from "@/components/Drawer";
import { RefCrud } from "@/components/RefCrud";
import { Tabs } from "@/components/Tabs";
import { Button, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, endpoints } from "@/lib/api";
import { CHAMP_ETAPE_LABEL, INDUCTEUR_LABEL, PHASE_ETAPE_LABEL, STATUT_CIRCUIT_LABEL, TYPE_EQUIPEMENT_LABEL, UNITE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { ChampEtape, Circuit, Inducteur, ParametreProduction, PhaseEtape, StatutCircuit, TypeEquipement, UniteMesure } from "@/lib/types";
import { cn, formatDa, formatQty, num } from "@/lib/utils";

type Onglet = "activites" | "usines" | "etapes" | "donnees" | "lignes" | "postes" | "equipements" | "circuits" | "conversions" | "regles";
const ONGLETS: Onglet[] = ["activites", "usines", "etapes", "donnees", "lignes", "postes", "equipements", "circuits", "conversions", "regles"];

export default function IndustrielPage() {
  return (
    <Suspense fallback={null}>
      <Industriel />
    </Suspense>
  );
}

function Industriel() {
  const { state, can } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") as Onglet | null;
  const onglet: Onglet = tab && ONGLETS.includes(tab) ? tab : "activites";
  const go = (t: Onglet) => router.replace(`/industriel?tab=${t}`, { scroll: false });

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Paramétrage"
        title="Socle industriel"
        description="Activités (Eau, Jus, Yaourt), usines, étapes du circuit de référence, lignes, postes, machines et circuits de production : créés une fois, utilisés par les OF, la qualité et les coûts. On paramètre des règles et des structures, jamais des quantités."
        status={!can("PARAM_INDUSTRIEL") ? <StatusBadge tone="neutral">Consultation</StatusBadge> : undefined}
      />
      <Tabs
        label="Socle industriel"
        value={onglet}
        onChange={go}
        items={[
          { value: "activites", label: "Activités", icon: Layers, count: state.activites.length },
          { value: "usines", label: "Usines", icon: Building2, count: state.usines.length },
          { value: "etapes", label: "Étapes", icon: ListOrdered, count: state.etapesStandard.length },
          { value: "donnees", label: "Données à saisir", icon: ClipboardList, count: state.donneesEtapes.length },
          { value: "lignes", label: "Lignes", icon: Factory, count: state.lignesProduction.length },
          { value: "postes", label: "Postes", icon: Boxes, count: state.postes.length },
          { value: "equipements", label: "Machines", icon: Wrench, count: state.equipements.length },
          { value: "circuits", label: "Circuits", icon: GitBranch, count: state.circuits.length },
          { value: "conversions", label: "Conversions", icon: ArrowRightLeft, count: state.conversions.filter((c) => c.article == null).length },
          { value: "regles", label: "Règles de production", icon: Settings2 },
        ]}
      />
      {onglet === "activites" && <Activites />}
      {onglet === "usines" && <Usines />}
      {onglet === "etapes" && <Etapes />}
      {onglet === "donnees" && <DonneesEtapes />}
      {onglet === "lignes" && <Lignes />}
      {onglet === "postes" && <Postes />}
      {onglet === "equipements" && <Equipements />}
      {onglet === "circuits" && <Circuits />}
      {onglet === "conversions" && <ConversionsGenerales />}
      {onglet === "regles" && <ReglesProduction />}
    </div>
  );
}

function useOptions() {
  const { state } = useStore();
  return {
    activites: state.activites.map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` })),
    usines: state.usines.map((u) => ({ value: u.id, label: `${u.code} · ${u.nom}` })),
    etapes: [...state.etapesStandard].sort((a, b) => a.ordre_reference - b.ordre_reference).map((e) => ({ value: e.id, label: `${e.libelle} (${e.code})` })),
    lignes: state.lignesProduction.map((l) => ({ value: l.id, label: `${l.code} · ${l.designation}` })),
    postes: state.postes.map((p) => ({ value: p.id, label: `${p.code} · ${p.designation}` })),
    equipements: state.equipements.map((e) => ({ value: e.id, label: `${e.code} · ${e.designation}` })),
    produitsFinis: state.articles.filter((a) => a.type_article === "PRODUIT_FINI" && a.actif).map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` })),
    lieux: (types: string[]) => state.depots.filter((d) => d.type_lieu && types.includes(d.type_lieu)).map((d) => ({ value: d.id, label: `${d.code ?? ""} ${d.nom}`.trim() })),
  };
}

const actif = (v: boolean) => (v ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Inactif</StatusBadge>);

function Activites() {
  const { state, can } = useStore();
  return (
    <RefCrud
      titre="Activités"
      description="Domaines industriels des produits, recettes, équipements et règles. Le code est généré depuis la désignation (EAU, JUS, YAOURT)."
      items={state.activites}
      endpoint={endpoints.activites}
      refresh={["activites"]}
      writable={can("PARAM_INDUSTRIEL")}
      rechercheDans={(a) => [a.code, a.designation]}
      libelleItem={(a) => `${a.code} · ${a.designation}`}
      valeursInitiales={{ designation: "", regles_specifiques: "", actif: true }}
      champs={[
        { cle: "designation", label: "Désignation", requis: true },
        { cle: "actif", label: "Active", type: "checkbox" },
        { cle: "regles_specifiques", label: "Règles spécifiques", type: "textarea" },
      ]}
      colonnes={[
        { cle: "c", label: "Code", rendu: (a) => <span className="num font-medium">{a.code}</span> },
        { cle: "d", label: "Désignation", rendu: (a) => a.designation },
        { cle: "u", label: "Usines", rendu: (a) => state.usines.filter((u) => u.activites.includes(a.id)).map((u) => u.code).join(", ") || "—" },
        { cle: "s", label: "Statut", rendu: (a) => actif(a.actif) },
      ]}
    />
  );
}

function Usines() {
  const { state, can } = useStore();
  const o = useOptions();
  const nomLieu = (id: number | null) => state.depots.find((d) => d.id === id)?.nom ?? "Par défaut";
  return (
    <RefCrud
      titre="Usines"
      description="Sites de production (distincts des dépôts extérieurs). Le magasin matières et le stock produits finis d’une usine reçoivent les mouvements de ses OF."
      items={state.usines}
      endpoint={endpoints.usines}
      refresh={["usines"]}
      writable={can("PARAM_INDUSTRIEL")}
      rechercheDans={(u) => [u.code, u.nom, u.localisation]}
      libelleItem={(u) => `${u.code} · ${u.nom}`}
      valeursInitiales={{ nom: "", localisation: "", activites: [], magasin_matieres: 0, stock_produits_finis: 0, actif: true }}
      champs={[
        { cle: "nom", label: "Nom", requis: true },
        { cle: "localisation", label: "Adresse / localisation" },
        { cle: "magasin_matieres", label: "Magasin matières", type: "select", options: o.lieux(["MAGASIN_MATIERES", "STOCK_USINE"]), aide: "Sinon « Magasin principal »." },
        { cle: "stock_produits_finis", label: "Stock produits finis", type: "select", options: o.lieux(["STOCK_USINE"]), aide: "Sinon « Dépôt produits finis »." },
        { cle: "activites", label: "Activités produites", type: "multi", options: o.activites },
        { cle: "actif", label: "Active", type: "checkbox" },
      ]}
      colonnes={[
        { cle: "c", label: "Code", rendu: (u) => <span className="num font-medium">{u.code}</span> },
        { cle: "n", label: "Nom", rendu: (u) => u.nom },
        { cle: "a", label: "Activités", rendu: (u) => (u.activites_codes ?? []).join(", ") || "—" },
        { cle: "m", label: "Magasin matières", rendu: (u) => nomLieu(u.magasin_matieres) },
        { cle: "p", label: "Stock produits finis", rendu: (u) => nomLieu(u.stock_produits_finis) },
        { cle: "s", label: "Statut", rendu: (u) => actif(u.actif) },
      ]}
    />
  );
}

function Etapes() {
  const { state, can } = useStore();
  const o = useOptions();
  const items = [...state.etapesStandard].sort((a, b) => a.ordre_reference - b.ordre_reference);
  return (
    <RefCrud
      titre="Étapes du circuit de référence"
      description="Captage → stockage produit fini. Liste paramétrable : une nouvelle étape (ex. fermentation) s’ajoute sans redéploiement. Le code ne change plus une fois utilisé ; stockage produit fini et distribution sont hors coût de production."
      items={items}
      endpoint={endpoints.etapesStandard}
      refresh={["etapesStandard"]}
      writable={can("PARAM_INDUSTRIEL")}
      rechercheDans={(e) => [e.code, e.libelle, e.description]}
      libelleItem={(e) => e.libelle}
      valeursInitiales={{ code: "", libelle: "", phase: "CONDITIONNEMENT", ordre_reference: 0, sous_etape_de: 0, description: "", actif: true }}
      champs={[
        { cle: "libelle", label: "Libellé", requis: true },
        { cle: "code", label: "Code", creationSeulement: true, placeholder: "auto depuis le libellé" },
        { cle: "phase", label: "Phase", type: "select", options: (Object.keys(PHASE_ETAPE_LABEL) as PhaseEtape[]).map((p) => ({ value: p, label: PHASE_ETAPE_LABEL[p] })), requis: true },
        { cle: "ordre_reference", label: "Ordre dans le circuit de référence", type: "number" },
        { cle: "sous_etape_de", label: "Sous-étape de", type: "select", options: o.etapes },
        { cle: "actif", label: "Active", type: "checkbox" },
        { cle: "description", label: "Ce qui se passe à cette étape", type: "textarea" },
      ]}
      colonnes={[
        { cle: "o", label: "Ordre", rendu: (e) => <span className="num">{e.ordre_reference}</span> },
        { cle: "l", label: "Étape", rendu: (e) => (e.sous_etape_de ? <span className="pl-4 text-muted">↳ {e.libelle}</span> : <span className="font-medium">{e.libelle}</span>) },
        { cle: "c", label: "Code", rendu: (e) => <span className="num text-[12px]">{e.code}</span> },
        { cle: "p", label: "Phase", rendu: (e) => (e.phase === "APRES_PRODUCTION" ? <StatusBadge tone="neutral">Hors coût de production</StatusBadge> : PHASE_ETAPE_LABEL[e.phase]) },
        { cle: "s", label: "Statut", rendu: (e) => actif(e.actif) },
      ]}
    />
  );
}

/** Q33 : données réelles à saisir à chaque étape ; une donnée obligatoire accepte 0, jamais le vide. */
function DonneesEtapes() {
  const { state, can } = useStore();
  const o = useOptions();
  const libelleEtape = (id: number) => state.etapesStandard.find((e) => e.id === id)?.libelle ?? `Étape n°${id}`;
  const ordre = (id: number) => state.etapesStandard.find((e) => e.id === id)?.ordre_reference ?? 0;
  return (
    <RefCrud
      titre="Données à saisir par étape"
      description="Liste validée avec les techniciens : l’atelier ne peut pas enregistrer une étape sans ses données obligatoires (0 est accepté)."
      items={[...state.donneesEtapes].sort((a, b) => ordre(a.etape) - ordre(b.etape) || a.champ.localeCompare(b.champ))}
      endpoint={endpoints.donneesEtapes}
      refresh={["donneesEtapes"]}
      writable={can("PARAM_DONNEES_ETAPES")}
      rechercheDans={(d) => [libelleEtape(d.etape), CHAMP_ETAPE_LABEL[d.champ]]}
      libelleItem={(d) => `${libelleEtape(d.etape)} · ${CHAMP_ETAPE_LABEL[d.champ]}`}
      supprimable={() => true}
      valeursInitiales={{ etape: 0, champ: "quantite_produite", obligatoire: true }}
      champs={[
        { cle: "etape", label: "Étape", type: "select", requis: true, options: o.etapes },
        { cle: "champ", label: "Donnée", type: "select", requis: true, options: (Object.keys(CHAMP_ETAPE_LABEL) as ChampEtape[]).map((c) => ({ value: c, label: CHAMP_ETAPE_LABEL[c] })) },
        { cle: "obligatoire", label: "Obligatoire", type: "checkbox" },
      ]}
      colonnes={[
        { cle: "e", label: "Étape", rendu: (d) => libelleEtape(d.etape) },
        { cle: "c", label: "Donnée", rendu: (d) => CHAMP_ETAPE_LABEL[d.champ] },
        { cle: "o", label: "Saisie", rendu: (d) => (d.obligatoire ? <StatusBadge tone="warning">Obligatoire</StatusBadge> : <StatusBadge tone="neutral">Facultative</StatusBadge>) },
      ]}
    />
  );
}

function Lignes() {
  const { state, can, articleName } = useStore();
  const o = useOptions();
  return (
    <RefCrud
      titre="Lignes de production"
      description="Où un produit peut être fabriqué. Sans format coché, la ligne accepte tous les formats de son activité ; l’activité ne change plus dès que la ligne a des OF."
      items={state.lignesProduction}
      endpoint={endpoints.lignesProduction}
      refresh={["lignesProduction"]}
      writable={can("PARAM_INDUSTRIEL")}
      rechercheDans={(l) => [l.code, l.designation, l.usine_code, l.activite_code]}
      libelleItem={(l) => `${l.code} · ${l.designation}`}
      valeursInitiales={{ designation: "", usine: 0, activite: 0, cadence_nominale: "", unite_cadence: "", formats_compatibles: [], actif: true }}
      champs={[
        { cle: "designation", label: "Désignation", requis: true },
        { cle: "usine", label: "Usine", type: "select", options: o.usines, requis: true },
        { cle: "activite", label: "Activité", type: "select", options: o.activites, requis: true },
        { cle: "cadence_nominale", label: "Capacité / cadence", type: "number" },
        { cle: "unite_cadence", label: "Unité de cadence", placeholder: "bouteilles/heure" },
        { cle: "actif", label: "Active", type: "checkbox" },
        { cle: "formats_compatibles", label: "Formats compatibles (vide = tous ceux de l’activité)", type: "multi", options: o.produitsFinis },
      ]}
      colonnes={[
        { cle: "c", label: "Code", rendu: (l) => <span className="num font-medium">{l.code}</span> },
        { cle: "d", label: "Désignation", rendu: (l) => l.designation },
        { cle: "u", label: "Usine", rendu: (l) => l.usine_code ?? "—" },
        { cle: "a", label: "Activité", rendu: (l) => l.activite_code ?? "—" },
        { cle: "k", label: "Cadence", rendu: (l) => (l.cadence_nominale ? `${formatQty(num(l.cadence_nominale), 0)} ${l.unite_cadence}` : "—") },
        {
          cle: "f",
          label: "Formats",
          rendu: (l) => (l.formats_compatibles.length ? <span title={l.formats_compatibles.map((id) => articleName(id)).join("\n")}>{l.formats_compatibles.length} format(s)</span> : "Tous"),
        },
        { cle: "s", label: "Statut", rendu: (l) => actif(l.actif) },
      ]}
    />
  );
}

function Postes() {
  const { state, can } = useStore();
  const o = useOptions();
  const items = [...state.postes].sort((a, b) => a.ligne - b.ligne || a.ordre - b.ordre);
  return (
    <RefCrud
      titre="Postes"
      description="Fonction de production au sein d’une ligne (le poste décrit la fonction, la machine l’équipement)."
      items={items}
      endpoint={endpoints.postes}
      refresh={["postes"]}
      writable={can("PARAM_INDUSTRIEL")}
      rechercheDans={(p) => [p.code, p.designation, p.ligne_code, p.etape_code]}
      libelleItem={(p) => `${p.code} · ${p.designation}`}
      valeursInitiales={{ designation: "", ligne: 0, etape: 0, ordre: 0, formats_compatibles: [], actif: true }}
      champs={[
        { cle: "ligne", label: "Ligne", type: "select", options: o.lignes, requis: true },
        { cle: "etape", label: "Fonction / étape", type: "select", options: o.etapes, requis: true },
        { cle: "designation", label: "Désignation", placeholder: "auto : libellé de l’étape" },
        { cle: "ordre", label: "Ordre sur la ligne", type: "number" },
        { cle: "actif", label: "Actif", type: "checkbox" },
        { cle: "formats_compatibles", label: "Formats compatibles (vide = ceux de la ligne)", type: "multi", options: o.produitsFinis },
      ]}
      colonnes={[
        { cle: "c", label: "Code", rendu: (p) => <span className="num font-medium">{p.code}</span> },
        { cle: "d", label: "Désignation", rendu: (p) => p.designation },
        { cle: "l", label: "Ligne", rendu: (p) => p.ligne_code ?? "—" },
        { cle: "e", label: "Étape", rendu: (p) => p.etape_code ?? "—" },
        { cle: "o", label: "Ordre", rendu: (p) => <span className="num">{p.ordre}</span> },
        { cle: "s", label: "Statut", rendu: (p) => actif(p.actif) },
      ]}
    />
  );
}

function Equipements() {
  const { state, can } = useStore();
  const o = useOptions();
  const usine = (id: number) => state.usines.find((u) => u.id === id)?.code ?? "—";
  const activite = (id: number | null) => (id ? (state.activites.find((a) => a.id === id)?.code ?? "—") : null);
  return (
    <RefCrud
      titre="Machines et équipements"
      description="Sans activité, l’équipement est commun (ex. forage partagé par Eau, Jus et Yaourt : ses charges se répartissent) ; avec une activité, il est dédié (ses charges vont directement à l’activité). Valeur et durée donnent l’amortissement mensuel de la cascade de coûts."
      items={state.equipements}
      endpoint={endpoints.equipements}
      refresh={["equipements"]}
      writable={can("PARAM_INDUSTRIEL")}
      rechercheDans={(e) => [e.code, e.designation, TYPE_EQUIPEMENT_LABEL[e.type_equipement]]}
      libelleItem={(e) => `${e.code} · ${e.designation}`}
      valeursInitiales={{
        designation: "",
        type_equipement: "AUTRE",
        usine: 0,
        poste: 0,
        activite: 0,
        cadence_nominale: "",
        unite_cadence: "",
        compteur_energie: false,
        compteur_heures: false,
        compteur_pieces: false,
        compteur_volume: false,
        valeur_acquisition: "",
        duree_amortissement_mois: "",
        date_mise_en_service: "",
        formats_compatibles: [],
        postes_supplementaires: [],
        inducteur_amortissement: "",
        actif: true,
      }}
      champs={[
        { cle: "designation", label: "Désignation", requis: true },
        { cle: "type_equipement", label: "Type", type: "select", options: (Object.keys(TYPE_EQUIPEMENT_LABEL) as TypeEquipement[]).map((t) => ({ value: t, label: TYPE_EQUIPEMENT_LABEL[t] })), requis: true },
        { cle: "usine", label: "Usine", type: "select", options: o.usines, requis: true },
        { cle: "poste", label: "Poste", type: "select", options: o.postes },
        { cle: "postes_supplementaires", label: "Autres postes réalisés (machine combinée, ex. remplissage + bouchage)", type: "multi", options: o.postes, pleineLargeur: true },
        { cle: "activite", label: "Activité dédiée (vide = commun)", type: "select", options: o.activites },
        { cle: "cadence_nominale", label: "Capacité / cadence", type: "number" },
        { cle: "unite_cadence", label: "Unité de cadence" },
        { cle: "valeur_acquisition", label: "Valeur d’acquisition (FCFA)", type: "number" },
        { cle: "duree_amortissement_mois", label: "Durée d’amortissement (mois)", type: "number" },
        {
          cle: "inducteur_amortissement",
          label: "Clé d’imputation de l’amortissement",
          type: "select",
          aide: "Vide : volume d’eau pour l’amont commun, heures machine ailleurs.",
          options: (Object.keys(INDUCTEUR_LABEL) as Inducteur[]).map((i) => ({ value: i, label: INDUCTEUR_LABEL[i] })),
        },
        { cle: "date_mise_en_service", label: "Mise en service", type: "date" },
        { cle: "compteur_energie", label: "Compteur d’énergie (kWh)", type: "checkbox" },
        { cle: "compteur_heures", label: "Compteur d’heures de marche", type: "checkbox" },
        { cle: "compteur_pieces", label: "Compteur de pièces", type: "checkbox" },
        { cle: "compteur_volume", label: "Débitmètre / compteur de volume", type: "checkbox" },
        { cle: "actif", label: "Actif", type: "checkbox" },
      ]}
      colonnes={[
        { cle: "c", label: "Code", rendu: (e) => <span className="num font-medium">{e.code}</span> },
        { cle: "d", label: "Désignation", rendu: (e) => e.designation },
        { cle: "t", label: "Type", rendu: (e) => TYPE_EQUIPEMENT_LABEL[e.type_equipement] },
        { cle: "u", label: "Usine", rendu: (e) => usine(e.usine) },
        { cle: "a", label: "Activité", rendu: (e) => activite(e.activite) ?? <StatusBadge tone="teal">Commun</StatusBadge> },
        { cle: "m", label: "Amortissement / mois", className: "text-right", rendu: (e) => <span className="num">{e.amortissement_mensuel != null ? formatDa(num(e.amortissement_mensuel)) : "—"}</span> },
        { cle: "s", label: "Statut", rendu: (e) => actif(e.actif) },
      ]}
    />
  );
}

const TONE_CIRCUIT: Record<StatutCircuit, "warning" | "success" | "neutral"> = { BROUILLON: "warning", VALIDE: "success", ARCHIVE: "neutral" };

function Circuits() {
  const { state, can, articleName } = useStore();
  const o = useOptions();
  const writable = can("PARAM_INDUSTRIEL");
  const ligne = (id: number | null) => (id ? (state.lignesProduction.find((l) => l.id === id)?.code ?? "—") : "Toutes");
  return (
    <RefCrud
      titre="Circuits de production"
      description="L’ordre des opérations pour une activité, un format et éventuellement une ligne. Brouillon → Validé → Archivé : une seule version validée par périmètre ; l’OF reçoit automatiquement le circuit validé le plus précis."
      items={[...state.circuits].sort((a, b) => a.code.localeCompare(b.code) || b.version - a.version)}
      endpoint={endpoints.circuits}
      refresh={["circuits"]}
      writable={writable}
      rechercheDans={(c) => [c.code, c.designation, c.activite_code]}
      libelleItem={(c) => `${c.code} v${c.version} · ${c.designation}`}
      supprimable={(c) => c.statut === "BROUILLON"}
      valeursInitiales={{ designation: "", activite: 0, article: 0, ligne: 0, observations: "" }}
      champs={[
        { cle: "designation", label: "Désignation", requis: true },
        { cle: "activite", label: "Activité", type: "select", options: o.activites, requis: true },
        { cle: "article", label: "Format (vide = tous les formats)", type: "select", options: o.produitsFinis },
        { cle: "ligne", label: "Ligne (facultatif)", type: "select", options: o.lignes },
        { cle: "observations", label: "Observations", type: "textarea" },
      ]}
      colonnes={[
        { cle: "c", label: "Circuit", rendu: (c) => <span className="num font-medium">{c.code} v{c.version}</span> },
        { cle: "d", label: "Désignation", rendu: (c) => c.designation },
        { cle: "a", label: "Activité", rendu: (c) => c.activite_code ?? "—" },
        { cle: "f", label: "Format", rendu: (c) => (c.article ? articleName(c.article) : "Tous") },
        { cle: "l", label: "Ligne", rendu: (c) => ligne(c.ligne) },
        { cle: "e", label: "Étapes", className: "text-right", rendu: (c) => <span className="num">{c.etapes.length}</span> },
        { cle: "s", label: "Statut", rendu: (c) => <StatusBadge tone={TONE_CIRCUIT[c.statut]}>{STATUT_CIRCUIT_LABEL[c.statut]}</StatusBadge> },
      ]}
      actionsDrawer={(c, fermer) => <EtapesCircuit circuit={c} writable={writable} onDone={fermer} />}
    />
  );
}

/** Étapes d’un circuit (modifiables en brouillon), validation et nouvelle version. */
function EtapesCircuit({ circuit, writable, onDone }: { circuit: Circuit; writable: boolean; onDone: () => void }) {
  const { state, dispatch } = useStore();
  const brouillon = circuit.statut === "BROUILLON";
  const etapes = [...circuit.etapes].sort((a, b) => a.ordre - b.ordre);
  const prochainOrdre = (etapes.at(-1)?.ordre ?? 0) + 10;
  const [etape, setEtape] = useState(0);
  const [ordre, setOrdre] = useState(String(prochainOrdre));
  const [obligatoire, setObligatoire] = useState(true);
  const [poste, setPoste] = useState(0);
  const [machine, setMachine] = useState(0);
  const [temps, setTemps] = useState("");
  const [perte, setPerte] = useState("");
  const dejaLa = new Set(etapes.map((e) => e.etape));
  const choix = [...state.etapesStandard].filter((e) => e.actif && !dejaLa.has(e.id)).sort((a, b) => a.ordre_reference - b.ordre_reference);
  const postes = state.postes.filter((p) => p.etape === etape && (!circuit.ligne || p.ligne === circuit.ligne));
  const machines = state.equipements.filter((m) => (poste ? m.poste === poste : postes.some((p) => p.id === m.poste)));
  const run = (fn: () => Promise<unknown>) => dispatch({ type: "EXEC", run: fn, refresh: ["circuits"] });

  async function ajouter() {
    const ok = await run(() =>
      actions.ajouterEtapeCircuit({
        circuit: circuit.id,
        etape,
        ordre: Number(ordre),
        obligatoire,
        poste: poste || null,
        equipement: machine || null,
        temps_theorique_min: temps === "" ? null : temps,
        perte_theorique_pct: perte === "" ? null : perte,
      }),
    );
    if (ok) {
      setEtape(0);
      setPoste(0);
      setMachine(0);
      setTemps("");
      setPerte("");
      setOrdre(String(Number(ordre) + 10));
    }
  }

  return (
    <>
      <DrawerSection title={`Étapes (${etapes.length})`} hint={brouillon ? "Modifiables tant que le circuit est en brouillon." : "Circuit validé ou archivé : ses étapes sont figées (créez une nouvelle version)."}>
        <ol className="rounded-[9px] border border-line divide-y divide-line">
          {etapes.length === 0 && <li className="px-3 py-4 text-center text-[12.5px] text-muted">Aucune étape.</li>}
          {etapes.map((e) => (
            <li key={e.id} className="px-3 py-2 flex items-center gap-2 text-[12.5px]">
              <span className="num w-8 text-muted">{e.ordre}</span>
              <span className="flex-1 min-w-0">
                <span className="font-medium">{e.etape_libelle ?? e.etape_code}</span>
                {!e.obligatoire && <span className="text-muted"> · facultative</span>}
                {(e.temps_theorique_min || e.perte_theorique_pct) && (
                  <span className="block text-[11.5px] text-muted">
                    {e.temps_theorique_min ? `${formatQty(num(e.temps_theorique_min), 0)} min` : ""}
                    {e.temps_theorique_min && e.perte_theorique_pct ? " · " : ""}
                    {e.perte_theorique_pct ? `perte ${formatQty(num(e.perte_theorique_pct), 2)} %` : ""}
                  </span>
                )}
              </span>
              {brouillon && writable && (
                <button
                  type="button"
                  aria-label="Retirer l’étape"
                  className="h-7 w-7 rounded-[6px] flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft"
                  onClick={() => void run(() => actions.supprimerEtapeCircuit(e.id))}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ol>
        {brouillon && writable && (
          <div className="rounded-[9px] border border-primary/30 bg-primary-soft/30 p-3 space-y-2">
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <Field label="Étape">
                <select className={inputClass} value={etape} onChange={(e) => setEtape(Number(e.target.value))}>
                  <option value={0}>Choisir…</option>
                  {choix.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.libelle}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ordre">
                <input className={cn(inputClass, "num text-right")} type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Poste">
                <select className={inputClass} value={poste} onChange={(e) => setPoste(Number(e.target.value))} disabled={!etape}>
                  <option value={0}>—</option>
                  {postes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Machine">
                <select className={inputClass} value={machine} onChange={(e) => setMachine(Number(e.target.value))} disabled={!etape}>
                  <option value={0}>—</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} · {m.designation}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Temps théorique (min)">
                <input className={cn(inputClass, "num text-right")} type="number" min="0" step="any" value={temps} onChange={(e) => setTemps(e.target.value)} />
              </Field>
              <Field label="Perte théorique (%)">
                <input className={cn(inputClass, "num text-right")} type="number" min="0" max="100" step="any" value={perte} onChange={(e) => setPerte(e.target.value)} />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[12.5px]">
                <input type="checkbox" checked={obligatoire} onChange={(e) => setObligatoire(e.target.checked)} />
                Étape obligatoire
              </label>
              <Button className="h-8" disabled={!etape || ordre === ""} onClick={() => void ajouter()}>
                <Plus size={14} /> Ajouter l’étape
              </Button>
            </div>
          </div>
        )}
      </DrawerSection>
      {writable && (
        <DrawerSection title="Version">
          <div className="flex flex-wrap gap-2">
            {brouillon && (
              <Button
                variant="success"
                disabled={etapes.length === 0}
                onClick={async () => {
                  if (await run(() => actions.validerCircuit(circuit.id))) onDone();
                }}
              >
                <Check size={14} /> Valider le circuit
              </Button>
            )}
            {circuit.statut !== "BROUILLON" && (
              <Button
                variant="secondary"
                onClick={async () => {
                  if (await run(() => actions.nouvelleVersionCircuit(circuit.id))) onDone();
                }}
              >
                <CopyPlus size={14} /> Créer une nouvelle version
              </Button>
            )}
          </div>
          <p className="text-[12px] text-muted">La validation archive la version validée précédente du même périmètre (activité, format, ligne).</p>
        </DrawerSection>
      )}
    </>
  );
}

function ConversionsGenerales() {
  const { state, can } = useStore();
  const unites = (Object.keys(UNITE_LABEL) as UniteMesure[]).map((u) => ({ value: u, label: UNITE_LABEL[u] }));
  const articles = state.articles.filter((a) => a.actif).map((a) => ({ value: a.id, label: `${a.code} · ${a.designation}` }));
  const nomArticle = (id: number | null) => (id ? (state.articles.find((a) => a.id === id)?.code ?? `#${id}`) : null);
  return (
    <RefCrud
      titre="Conversions d’unités"
      description="Une seule table pour tous les modules (« il ne faut pas coder une conversion différente dans chaque module ») : 1 sac = 25 kg (sucre), 1 carton = 6 bouteilles. Sans article : conversion générale. kg ↔ g, L ↔ cL et m³ ↔ L sont déjà connues ; une conversion vaut dans les deux sens."
      items={state.conversions}
      endpoint={endpoints.conversions}
      refresh={["conversions"]}
      writable={can("GERER_CONVERSIONS")}
      rechercheDans={(c) => [c.article_code, c.unite_source, c.unite_cible]}
      libelleItem={(c) => `1 ${UNITE_LABEL[c.unite_source]} = ${formatQty(num(c.facteur), 4)} ${UNITE_LABEL[c.unite_cible]}`}
      supprimable={() => true}
      valeursInitiales={{ article: 0, unite_source: "SAC", facteur: "", unite_cible: "KG" }}
      champs={[
        { cle: "article", label: "Article (vide = conversion générale)", type: "select", options: articles },
        { cle: "unite_source", label: "1 unité de", type: "select", options: unites, requis: true },
        { cle: "facteur", label: "vaut", type: "number", requis: true },
        { cle: "unite_cible", label: "unités de", type: "select", options: unites, requis: true },
      ]}
      colonnes={[
        { cle: "c", label: "Conversion", rendu: (c) => <span className="num">1 {UNITE_LABEL[c.unite_source]} = {formatQty(num(c.facteur), 4)} {UNITE_LABEL[c.unite_cible]}</span> },
        { cle: "a", label: "Article", rendu: (c) => nomArticle(c.article) ?? <StatusBadge tone="neutral">Générale</StatusBadge> },
      ]}
    />
  );
}

/** Capacité journalière d'une ligne, base du planning (heures ouvrées par jour). */
function CapacitePlanning({ valeur, writable, onSave }: { valeur: string; writable: boolean; onSave: (heures: string) => void }) {
  const [heures, setHeures] = useState(valeur);
  const valide = Number(heures) > 0 && Number(heures) <= 24;
  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-3.5">
      <Field label="Heures de production par jour et par ligne">
        <input type="number" min="1" max="24" step="0.5" className={cn(inputClass, "w-[120px] num text-right")} disabled={!writable} value={heures} onChange={(e) => setHeures(e.target.value)} />
      </Field>
      {writable && heures !== valeur && (
        <Button disabled={!valide} onClick={() => onSave(heures)}>
          Enregistrer
        </Button>
      )}
      <p className="text-[12px] text-muted basis-full">Capacité du planning par ligne : 8 h (une équipe), 16 h (deux équipes) ou 24 h.</p>
    </div>
  );
}

/** Règles de production (une seule fiche) : blocage du lancement et de la clôture, capacité du planning. */
function ReglesProduction() {
  const { dispatch, can } = useStore();
  const writable = can("PARAM_PRODUCTION");
  const [regles, setRegles] = useState<ParametreProduction | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    void actions
      .parametresProduction()
      .then((r) => !annule && setRegles(r))
      .catch((e) => !annule && setErreur(e instanceof Error ? e.message : "Règles indisponibles."));
    return () => {
      annule = true;
    };
  }, []);

  async function enregistrer(champs: Partial<ParametreProduction>) {
    let resultat: ParametreProduction | null = null;
    const ok = await dispatch({
      type: "EXEC",
      run: async () => {
        resultat = await actions.modifierParametresProduction(champs);
      },
      refresh: [],
    });
    if (ok && resultat) setRegles(resultat);
  }

  if (erreur) return <Panel className="p-4 text-[13px] text-muted">{erreur}</Panel>;
  if (!regles) return <Panel className="p-4 text-[13px] text-muted">Chargement…</Panel>;

  type RegleBooleenne = "bloquer_lancement_stock_insuffisant" | "controle_qualite_bloque_cloture";
  const basculer = (cle: RegleBooleenne) => void enregistrer({ [cle]: !regles[cle] });

  const ligne = (cle: RegleBooleenne, titre: string, aide: string) => (
    <label className="flex items-start gap-3 px-4 py-3.5">
      <input type="checkbox" className="mt-1" disabled={!writable} checked={regles[cle]} onChange={() => basculer(cle)} />
      <span>
        <span className="block text-[13px] font-medium">{titre}</span>
        <span className="block text-[12px] text-muted">{aide}</span>
      </span>
    </label>
  );

  return (
    <Panel className="divide-y divide-line">
      <div className="px-4 py-3">
        <h2 className="text-[13.5px] font-semibold">Règles de production</h2>
        <p className="text-[12px] text-muted">Modifiables par l’Administrateur SI ; la Direction les consulte.</p>
      </div>
      <CapacitePlanning
        key={regles.heures_ouvrees_par_jour ?? ""}
        valeur={regles.heures_ouvrees_par_jour ?? ""}
        writable={writable}
        onSave={(heures) => void enregistrer({ heures_ouvrees_par_jour: heures })}
      />
      {ligne(
        "bloquer_lancement_stock_insuffisant",
        "Bloquer le lancement d’un OF si le stock est insuffisant",
        "Décoché : le manque au magasin matières de l’usine est seulement signalé (avertissement) au passage « À préparer ».",
      )}
      {ligne(
        "controle_qualite_bloque_cloture",
        "Bloquer la clôture si des contrôles bloquants manquent ou sont non conformes",
        "Contrôles bloquants non réalisés et non-conformités bloquantes ouvertes empêchent de clôturer l’OF.",
      )}
    </Panel>
  );
}
