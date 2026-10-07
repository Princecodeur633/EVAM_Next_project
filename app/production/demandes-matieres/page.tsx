"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, PackageMinus, PackagePlus, Plus, Undo2, X } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { ComplementDrawer } from "@/components/production";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_DEMANDE_COMPLEMENTAIRE_LABEL, STATUT_DEMANDE_MATIERE_LABEL, TYPE_SORTIE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { StatutDemandeComplementaire, StatutDemandeMatiere, TypeSortie } from "@/lib/types";
import { cn, formatDateTime, formatQty, num } from "@/lib/utils";

type Onglet = "demandes" | "complements" | "sorties" | "retours";
type Formulaire = "complement" | "sortie" | "retour" | null;

const DEMANDE_TONE: Record<StatutDemandeMatiere, "info" | "teal" | "success" | "danger" | "warning"> = {
  A_PREPARER: "info",
  PARTIELLEMENT_PREPAREE: "warning",
  PREPAREE: "teal",
  LIVREE_A_LA_PRODUCTION: "success",
  ANNULEE: "danger",
};
const COMPLEMENT_TONE: Record<StatutDemandeComplementaire, "warning" | "success" | "danger"> = {
  EN_ATTENTE: "warning",
  APPROUVEE_ET_LIVREE: "success",
  REJETEE: "danger",
};

export default function MatieresAtelierPage() {
  const { state, dispatch, articleName, ofNumero, can, role } = useStore();
  const magasin = role === "MAGASINIER";
  const [onglet, setOnglet] = useState<Onglet>("demandes");
  const [aServir, setAServir] = useState(true);
  const [form, setForm] = useState<Formulaire>(null);
  const [q, setQ] = useState("");
  const [livraison, setLivraison] = useState<Record<number, string>>({});

  const ofLink = (id: number) => (
    <Link href={`/production/of/${id}`} className="num font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
      {ofNumero(id)}
    </Link>
  );
  const match = (of: number, matiere: number, ...autres: unknown[]) => matchSearch(q, ofNumero(of), articleName(matiere), ...autres);

  const ouverte = (statut: string) => statut !== "LIVREE_A_LA_PRODUCTION" && statut !== "ANNULEE";
  const demandes = useMemo(
    () =>
      state.demandesMatieres
        .filter((d) => (!aServir || ouverte(d.statut)) && match(d.ordre_fabrication, d.matiere, d.numero))
        .sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.demandesMatieres, q, aServir],
  );
  const reste = (d: (typeof demandes)[number]) => Math.max(0, num(d.quantite_demandee) - num(d.quantite_livree));
  const complements = state.demandesComplementaires.filter((d) => match(d.ordre_fabrication, d.matiere, d.numero, d.motif));
  const sorties = state.sortiesMatieres.filter((s) => match(s.ordre_fabrication, s.matiere, s.motif));
  const retours = state.retoursMatieres.filter((r) => match(r.ordre_fabrication, r.matiere));

  const enCours = state.demandesMatieres.filter((d) => d.statut !== "LIVREE_A_LA_PRODUCTION" && d.statut !== "ANNULEE").length;
  const enAttente = state.demandesComplementaires.filter((d) => d.statut === "EN_ATTENTE").length;

  const actionsOnglet: Record<Onglet, { label: string; form: Formulaire; droit: boolean; icon: typeof Plus } | null> = {
    demandes: null,
    complements: { label: "Demande complémentaire", form: "complement", droit: can("CREATE_COMPLEMENT"), icon: PackagePlus },
    sorties: { label: "Sortie manuelle", form: "sortie", droit: can("CREATE_SORTIE"), icon: PackageMinus },
    retours: { label: "Retour matière", form: "retour", droit: can("CREATE_RETOUR_MAT"), icon: Undo2 },
  };
  const action = actionsOnglet[onglet];
  const total = { demandes: state.demandesMatieres.length, complements: state.demandesComplementaires.length, sorties: state.sortiesMatieres.length, retours: state.retoursMatieres.length }[onglet];
  const shown = { demandes: demandes.length, complements: complements.length, sorties: sorties.length, retours: retours.length }[onglet];

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Production"
        title={magasin ? "Servir l’atelier" : "Matières atelier"}
        description={
          magasin
            ? "Livrez les matières demandées par l’atelier : la quantité à livrer est pré-remplie avec le reste dû, une livraison partielle est possible."
            : "Suivi des demandes au magasin, des compléments, des sorties et des retours. Les demandes se créent depuis la fiche de l’OF (onglet Besoins matières)."
        }
        actions={
          action?.droit ? (
            <Button onClick={() => setForm(action.form)}>
              <Plus size={15} /> {action.label}
            </Button>
          ) : null
        }
      />

      <Tabs
        label="Matières atelier"
        value={onglet}
        onChange={setOnglet}
        items={[
          { value: "demandes", label: "Demandes", count: enCours },
          { value: "complements", label: "Compléments", count: enAttente },
          { value: "sorties", label: "Sorties", count: state.sortiesMatieres.length },
          { value: "retours", label: "Retours", count: state.retoursMatieres.length },
        ]}
      />

      <Panel className="overflow-hidden">
        <FilterBar shown={shown} total={total} active={!!q || (onglet === "demandes" && !aServir)} onReset={() => { setQ(""); setAServir(true); }}>
          <SearchInput value={q} onChange={setQ} placeholder="OF, matière, numéro…" />
          {onglet === "demandes" && (
            <Segmented
              label="Demandes"
              value={aServir ? "SERVIR" : "TOUTES"}
              onChange={(v) => setAServir(v === "SERVIR")}
              options={[
                { value: "SERVIR", label: "À servir", count: enCours },
                { value: "TOUTES", label: "Toutes" },
              ]}
            />
          )}
        </FilterBar>

        {onglet === "demandes" && (
          <DataTable
            emptyText="Aucune demande. Elles se créent depuis la fiche de l’OF."
            columns={[
              { key: "n", label: "N°" },
              { key: "of", label: "OF" },
              { key: "m", label: "Matière" },
              { key: "q", label: "Demandée", className: "text-right" },
              { key: "ql", label: "Livrée", className: "text-right" },
              { key: "s", label: "Statut" },
              ...(can("LIVRER_DEMANDE_MATIERE") ? [{ key: "a", label: "Qté à livrer", className: "text-right" }] : []),
            ]}
            rows={demandes.map((d) => ({
              n: d.numero,
              of: ofLink(d.ordre_fabrication),
              m: articleName(d.matiere),
              q: <span className="num">{formatQty(num(d.quantite_demandee), 3)}</span>,
              ql: <span className="num">{d.quantite_livree != null ? formatQty(num(d.quantite_livree), 3) : "—"}</span>,
              s: <StatusBadge tone={DEMANDE_TONE[d.statut]}>{STATUT_DEMANDE_MATIERE_LABEL[d.statut]}</StatusBadge>,
              a:
                can("LIVRER_DEMANDE_MATIERE") && d.statut !== "LIVREE_A_LA_PRODUCTION" && d.statut !== "ANNULEE" ? (
                  <span className="flex gap-2 items-center justify-end">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      aria-label="Quantité à livrer"
                      className="h-8 w-28 border border-line-strong rounded-[6px] px-2 text-[12.5px] text-right num bg-surface focus:border-primary outline-none"
                      value={livraison[d.id] ?? String(reste(d))}
                      onChange={(e) => setLivraison((m) => ({ ...m, [d.id]: e.target.value }))}
                    />
                    <Button
                      className="h-8 px-3 text-[12px]"
                      disabled={!(Number(livraison[d.id] ?? reste(d)) > 0)}
                      onClick={() => {
                        const saisie = Number(livraison[d.id] ?? reste(d));
                        void dispatch({ type: "LIVRER_DEMANDE_MATIERE", id: d.id, quantite_livree: saisie }).then((ok) => {
                          if (!ok) return;
                          setLivraison((m) => {
                            const suite = { ...m };
                            delete suite[d.id];
                            return suite;
                          });
                        });
                      }}
                    >
                      Livrer
                    </Button>
                  </span>
                ) : (
                  ""
                ),
            }))}
          />
        )}

        {onglet === "complements" && (
          <DataTable
            emptyText="Aucune demande complémentaire."
            columns={[
              { key: "n", label: "N°" },
              { key: "of", label: "OF" },
              { key: "m", label: "Matière" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "mo", label: "Motif" },
              { key: "s", label: "Statut" },
              { key: "a", label: "" },
            ]}
            rows={complements.map((d) => ({
              n: d.numero,
              of: ofLink(d.ordre_fabrication),
              m: articleName(d.matiere),
              q: <span className="num">{formatQty(num(d.quantite), 3)}</span>,
              mo: <span className="text-muted">{d.motif}</span>,
              s: <StatusBadge tone={COMPLEMENT_TONE[d.statut]}>{STATUT_DEMANDE_COMPLEMENTAIRE_LABEL[d.statut]}</StatusBadge>,
              a:
                can("APPROUVER_COMPLEMENT") && d.statut === "EN_ATTENTE" ? (
                  <span className="flex gap-1.5 justify-end">
                    <Button variant="success" className="h-8 px-2.5 text-[12px]" onClick={() => void dispatch({ type: "APPROUVER_COMPLEMENT", id: d.id })}>
                      <Check size={13} /> Approuver
                    </Button>
                    <Button variant="secondary" className="h-8 px-2.5 text-[12px] text-danger" onClick={() => void dispatch({ type: "REJETER_COMPLEMENT", id: d.id })}>
                      <X size={13} /> Rejeter
                    </Button>
                  </span>
                ) : (
                  ""
                ),
            }))}
          />
        )}

        {onglet === "sorties" && (
          <DataTable
            emptyText="Aucune sortie."
            columns={[
              { key: "of", label: "OF" },
              { key: "m", label: "Matière" },
              { key: "q", label: "Quantité", className: "text-right" },
              { key: "t", label: "Type" },
              { key: "mo", label: "Motif" },
              { key: "d", label: "Date" },
            ]}
            rows={sorties.map((s) => ({
              of: ofLink(s.ordre_fabrication),
              m: articleName(s.matiere),
              q: <span className="num">{formatQty(num(s.quantite_sortie), 3)}</span>,
              t: <StatusBadge tone={s.type_sortie === "COMPLEMENTAIRE" ? "warning" : "neutral"}>{TYPE_SORTIE_LABEL[s.type_sortie] ?? s.type_sortie}</StatusBadge>,
              mo: s.motif || "—",
              d: formatDateTime(s.date_sortie),
            }))}
          />
        )}

        {onglet === "retours" && (
          <DataTable
            emptyText="Aucun retour."
            columns={[
              { key: "of", label: "OF" },
              { key: "m", label: "Matière" },
              { key: "q", label: "Quantité retournée", className: "text-right" },
              { key: "d", label: "Date" },
            ]}
            rows={retours.map((r) => ({
              of: ofLink(r.ordre_fabrication),
              m: articleName(r.matiere),
              q: <span className="num">{formatQty(num(r.quantite_retournee), 3)}</span>,
              d: formatDateTime(r.date_retour),
            }))}
          />
        )}
      </Panel>

      {form === "complement" && <ComplementDrawer onClose={() => setForm(null)} />}
      {form === "sortie" && <SortieDrawer onClose={() => setForm(null)} />}
      {form === "retour" && <RetourDrawer onClose={() => setForm(null)} />}
    </div>
  );
}

function OfSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { state, articleName } = useStore();
  const ofs = state.ofList.filter((o) => o.statut !== "CLOTURE" && o.statut !== "ANNULE");
  return (
    <Field label="OF">
      <select className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value))} autoFocus>
        <option value={0}>Choisir un OF…</option>
        {ofs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.numero} · {articleName(o.article)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function MatiereSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { matieres } = useStore();
  return (
    <Field label="Matière">
      <select className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={0}>Choisir…</option>
        {matieres.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} · {a.designation}
          </option>
        ))}
      </select>
    </Field>
  );
}

function SortieDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [of, setOf] = useState(0);
  const [matiere, setMatiere] = useState(0);
  const [lot, setLot] = useState(0);
  // Lots libérés et non périmés de la matière ; le backend vérifie qu’ils sont au magasin de l’usine de l’OF.
  const lots = state.lotsMatieres.filter((l) => l.article === matiere && l.statut === "LIBERE" && !l.est_perime && Number(l.quantite_restante) > 0);
  const [qty, setQty] = useState("");
  const [type, setType] = useState<TypeSortie>("NORMALE");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const motifObligatoire = type === "COMPLEMENTAIRE";
  const valide = of && matiere && Number(qty) > 0 && (!motifObligatoire || motif.trim());

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_SORTIE", ordre_fabrication: of, matiere, quantite_sortie: Number(qty), type_sortie: type, motif: motif.trim(), lot_matiere: lot || null });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Sortie manuelle"
      subtitle="Hors livraison de demande (celle-ci génère sa sortie automatiquement)."
      icon={<PackageMinus size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valide || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Sortir"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Sortie">
        <OfSelect value={of} onChange={setOf} />
        <MatiereSelect
          value={matiere}
          onChange={(m) => {
            setMatiere(m);
            setLot(0);
          }}
        />
        {lots.length > 0 && (
          <Field label="Lot">
            <select className={inputClass} value={lot} onChange={(e) => setLot(Number(e.target.value))}>
              <option value={0}>Automatique (DLC la plus proche d’abord)</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.numero}
                  {l.lot_fournisseur ? ` · fourn. ${l.lot_fournisseur}` : ""} · reste {l.quantite_restante}
                  {l.date_peremption ? ` · DLC ${l.date_peremption}` : ""} · {l.depot_nom}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantité">
            <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TypeSortie)}>
              {(Object.keys(TYPE_SORTIE_LABEL) as TypeSortie[]).map((k) => (
                <option key={k} value={k}>
                  {TYPE_SORTIE_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={motifObligatoire ? "Motif (obligatoire)" : "Motif"}>
          <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}

function RetourDrawer({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [of, setOf] = useState(0);
  const [matiere, setMatiere] = useState(0);
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_RETOUR_MAT", ordre_fabrication: of, matiere, quantite_retournee: Number(qty) });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Retour matière"
      subtitle="Matière non consommée rendue au magasin."
      icon={<Undo2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!of || !matiere || !(Number(qty) > 0) || saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Retourner"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Retour">
        <OfSelect value={of} onChange={setOf} />
        <MatiereSelect value={matiere} onChange={setMatiere} />
        <Field label="Quantité retournée">
          <input type="number" min="0" step="any" className={cn(inputClass, "num text-right")} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}
