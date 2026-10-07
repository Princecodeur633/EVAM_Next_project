"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, FileDown, Plus, Receipt, Undo2 } from "lucide-react";
import { Drawer, DrawerSection } from "@/components/Drawer";
import { FilterBar, SearchInput, Segmented, matchSearch } from "@/components/Filters";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { actions, fetchImpayes, type FactureImpayee } from "@/lib/api";
import { telechargerFacturePdf } from "@/lib/facturePdf";
import { STATUT_AVOIR_LABEL, STATUT_FACTURE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Avoir, Facture } from "@/lib/types";
import { cn, formatDa, formatDate, formatDateTime, num } from "@/lib/utils";

type Onglet = "factures" | "impayes" | "avoirs";
const ONGLETS: Onglet[] = ["factures", "impayes", "avoirs"];

export default function FacturationPage() {
  return (
    <Suspense fallback={null}>
      <Facturation />
    </Suspense>
  );
}

function Facturation() {
  const { state, can } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const p = params.get("onglet") as Onglet | null;
  const onglet: Onglet = p && ONGLETS.includes(p) ? p : "factures";
  const [impayes, setImpayes] = useState<FactureImpayee[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [emettre, setEmettre] = useState(false);

  useEffect(() => {
    let annule = false;
    fetchImpayes()
      .then((d) => !annule && setImpayes(d))
      .catch(() => !annule && setErreur("Impossible de charger les impayés."));
    return () => {
      annule = true;
    };
  }, [state.factures.length]);

  const nonSoldees = state.factures.filter((f) => f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE");

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader
        eyebrow="Vente"
        title="Facturation"
        description="Factures émises, impayés et avoirs clients."
        actions={
          onglet === "avoirs" && can("CREATE_AVOIR") ? (
            <Button onClick={() => setEmettre(true)}>
              <Plus size={15} /> Émettre un avoir
            </Button>
          ) : null
        }
      />
      <Tabs
        label="Facturation"
        value={onglet}
        onChange={(o) => router.replace(`/commercial/facturation?onglet=${o}`, { scroll: false })}
        items={[
          { value: "factures", label: "Factures", icon: Receipt, count: nonSoldees.length },
          { value: "impayes", label: "Impayés", icon: CalendarClock, count: impayes?.length },
          { value: "avoirs", label: "Avoirs", icon: Undo2, count: state.avoirs.filter((a) => a.statut === "EMIS").length },
        ]}
      />
      {onglet === "factures" && <Factures />}
      {onglet === "impayes" && <Impayes rows={impayes} erreur={erreur} />}
      {onglet === "avoirs" && <Avoirs />}
      {emettre && <EmettreAvoirDrawer onClose={() => setEmettre(false)} />}
    </div>
  );
}

const FACTURE_TONE: Record<Facture["statut"], "warning" | "success" | "info" | "danger"> = { EMISE: "warning", PARTIELLEMENT_PAYEE: "info", PAYEE: "success", ANNULEE: "danger" };

function Factures() {
  const { state, clientName, articleName } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [vue, setVue] = useState<"NON_SOLDEES" | "TOUTES">("NON_SOLDEES");
  const echue = (f: Facture) => !!f.date_echeance && new Date(f.date_echeance) < new Date(new Date().toDateString());
  const rows = state.factures
    .filter((f) => vue === "TOUTES" || f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE")
    .filter((f) => matchSearch(q, f.numero, clientName(f.client)))
    .sort((a, b) => new Date(b.date_emission).getTime() - new Date(a.date_emission).getTime());

  return (
    <Panel className="overflow-hidden">
      <FilterBar shown={rows.length} total={state.factures.length} active={!!q || vue !== "NON_SOLDEES"} onReset={() => { setQ(""); setVue("NON_SOLDEES"); }}>
        <SearchInput value={q} onChange={setQ} placeholder="N° de facture, client…" />
        <Segmented label="Vue" value={vue} onChange={setVue} options={[{ value: "NON_SOLDEES", label: "Non soldées" }, { value: "TOUTES", label: "Toutes" }]} />
      </FilterBar>
      <DataTable
        emptyText="Aucune facture."
        columns={[
          { key: "n", label: "Facture" },
          { key: "c", label: "Client" },
          { key: "e", label: "Émise le" },
          { key: "ech", label: "Échéance" },
          { key: "m", label: "Montant TTC", className: "text-right" },
          { key: "s", label: "Statut" },
          { key: "pdf", label: "" },
        ]}
        rows={rows.map((f) => {
          const client = state.clients.find((c) => c.id === f.client);
          const commande = state.commandes.find((c) => c.id === f.commande);
          const lignes = state.lignesFacture.filter((l) => l.facture === f.id);
          const ouverte = f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE";
          // PDF officiel du backend (identité de l’entreprise, IFU, montant en lettres) ;
          // à défaut (backend indisponible), génération locale à partir des mêmes montants.
          const pdfLocal = client && commande && lignes.length > 0 ? () => telechargerFacturePdf({ facture: f, client, commande, lignes, articleName }) : null;
          return {
            n: <span className="num font-medium">{f.numero}</span>,
            c: clientName(f.client),
            e: formatDate(f.date_emission),
            ech: f.date_echeance ? <span className={cn(ouverte && echue(f) && "text-danger font-medium")}>{formatDate(f.date_echeance)}</span> : "Comptant",
            m: <span className="num">{formatDa(num(f.montant_total))}</span>,
            s: <StatusBadge tone={FACTURE_TONE[f.statut]}>{STATUT_FACTURE_LABEL[f.statut]}</StatusBadge>,
            pdf: (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary text-[12px] font-medium hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  void actions.pdf("facture", f.id, f.numero).catch(() => pdfLocal?.());
                }}
              >
                <FileDown size={13} /> PDF
              </button>
            ),
            href: `/commercial/commandes/${f.commande}`,
          };
        })}
        onRowClick={(row) => router.push(String(row.href))}
      />
    </Panel>
  );
}

function Impayes({ rows, erreur }: { rows: FactureImpayee[] | null; erreur: string | null }) {
  const [q, setQ] = useState("");
  const liste = (rows ?? []).filter((f) => matchSearch(q, f.facture, f.client)).sort((a, b) => b.jours_retard - a.jours_retard);
  const total = liste.reduce((a, f) => a + num(f.restant), 0);
  const graves = liste.filter((f) => f.jours_retard > 30).length;
  return (
    <div className="space-y-3">
      {graves > 0 && (
        <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-4 py-3 flex items-center gap-3 text-[13px]" role="alert">
          <AlertTriangle size={17} className="text-danger shrink-0" />
          <p>
            <span className="font-semibold text-danger">{graves} facture{graves > 1 ? "s" : ""} en retard de plus de 30 jours.</span>{" "}
            <span className="text-ink/80">Restant dû total : <span className="num font-semibold">{formatDa(total)}</span></span>
          </p>
        </div>
      )}
      <Panel className="overflow-hidden">
        <FilterBar shown={liste.length} total={rows?.length ?? 0} active={!!q} onReset={() => setQ("")}>
          <SearchInput value={q} onChange={setQ} placeholder="Facture, client…" />
        </FilterBar>
        {erreur ? (
          <p className="p-4 text-[13px] text-danger">{erreur}</p>
        ) : rows === null ? (
          <p className="p-6 text-center text-[13px] text-muted">Chargement…</p>
        ) : (
          <DataTable
            emptyText="Aucune facture échue non soldée."
            columns={[
              { key: "f", label: "Facture" },
              { key: "c", label: "Client" },
              { key: "e", label: "Échéance" },
              { key: "m", label: "Montant", className: "text-right" },
              { key: "r", label: "Restant dû", className: "text-right" },
              { key: "j", label: "Retard" },
            ]}
            rows={liste.map((f) => ({
              f: <span className="num font-medium">{f.facture}</span>,
              c: f.client,
              e: f.echeance ? formatDate(f.echeance) : "—",
              m: <span className="num">{formatDa(num(f.montant))}</span>,
              r: <span className={cn("num font-semibold", f.jours_retard > 30 && "text-danger")}>{formatDa(num(f.restant))}</span>,
              j: <StatusBadge tone={f.jours_retard > 30 ? "danger" : "warning"}>{f.jours_retard} j</StatusBadge>,
            }))}
          />
        )}
      </Panel>
    </div>
  );
}

function Avoirs() {
  const { state, clientName, can } = useStore();
  const [q, setQ] = useState("");
  const [appliquer, setAppliquer] = useState<Avoir | null>(null);
  const rows = state.avoirs
    .filter((a) => matchSearch(q, a.numero, clientName(a.client), a.motif))
    .sort((a, b) => Number(b.statut === "EMIS") - Number(a.statut === "EMIS") || new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
  const factureNum = (id: number | null) => (id ? (state.factures.find((f) => f.id === id)?.numero ?? `#${id}`) : "—");

  return (
    <Panel className="overflow-hidden">
      <FilterBar shown={rows.length} total={state.avoirs.length} active={!!q} onReset={() => setQ("")}>
        <SearchInput value={q} onChange={setQ} placeholder="N°, client, motif…" />
      </FilterBar>
      <DataTable
        emptyText="Aucun avoir."
        columns={[
          { key: "n", label: "Avoir" },
          { key: "c", label: "Client" },
          { key: "m", label: "Montant", className: "text-right" },
          { key: "o", label: "Facture d’origine" },
          { key: "x", label: "Motif" },
          { key: "s", label: "Statut" },
          { key: "a", label: "", className: "text-right" },
        ]}
        rows={rows.map((a) => ({
          n: <span className="num font-medium">{a.numero}</span>,
          c: clientName(a.client),
          m: <span className="num">{formatDa(num(a.montant))}</span>,
          o: factureNum(a.facture_origine),
          x: <span className="text-muted">{a.motif}</span>,
          s: (
            <span className="inline-flex flex-col gap-0.5">
              <StatusBadge tone={a.statut === "EMIS" ? "info" : a.statut === "UTILISE" ? "success" : "danger"}>{STATUT_AVOIR_LABEL[a.statut] ?? a.statut}</StatusBadge>
              {a.facture_utilisation && <span className="text-[11px] text-muted">sur {factureNum(a.facture_utilisation)}</span>}
            </span>
          ),
          a: (
            <span className="inline-flex items-center gap-2 justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary text-[12px] font-medium hover:underline"
                onClick={() => void actions.pdf("avoir", a.id, a.numero).catch(() => {})}
              >
                <FileDown size={13} /> PDF
              </button>
              {a.statut === "EMIS" && can("UTILISER_AVOIR") && (
                <Button variant="secondary" className="h-8 px-3 text-[12.5px]" onClick={() => setAppliquer(a)}>
                  Appliquer
                </Button>
              )}
            </span>
          ),
        }))}
      />
      {appliquer && <AppliquerAvoirDrawer avoir={appliquer} onClose={() => setAppliquer(null)} />}
    </Panel>
  );
}

function EmettreAvoirDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [client, setClient] = useState(0);
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [origine, setOrigine] = useState(0);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "CREATE_AVOIR", client, montant: Number(montant), motif: motif.trim(), facture_origine: origine || undefined });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Émettre un avoir"
      subtitle="Crédit client à valoir sur une prochaine facture."
      icon={<Undo2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!client || !(Number(montant) > 0) || !motif.trim() || saving} onClick={() => void submit()}>
            {saving ? "Émission…" : "Émettre"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Avoir">
        <Field label="Client">
          <select className={inputClass} value={client} onChange={(e) => { setClient(Number(e.target.value)); setOrigine(0); }} autoFocus>
            <option value={0}>Choisir…</option>
            {state.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Facture d’origine (facultatif)">
          <select className={inputClass} value={origine} onChange={(e) => setOrigine(Number(e.target.value))} disabled={!client}>
            <option value={0}>—</option>
            {state.factures
              .filter((f) => f.client === client)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.numero} · {formatDa(num(f.montant_total))}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Montant">
          <input type="number" min="0" className={cn(inputClass, "num text-right")} value={montant} onChange={(e) => setMontant(e.target.value)} />
        </Field>
        <Field label="Motif (obligatoire)">
          <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Retour, geste commercial…" />
        </Field>
      </DrawerSection>
    </Drawer>
  );
}

function AppliquerAvoirDrawer({ avoir, onClose }: { avoir: Avoir; onClose: () => void }) {
  const { state, dispatch, clientName } = useStore();
  const factures = state.factures.filter((f) => f.client === avoir.client && (f.statut === "EMISE" || f.statut === "PARTIELLEMENT_PAYEE"));
  const [facture, setFacture] = useState(factures[0]?.id ?? 0);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await dispatch({ type: "UTILISER_AVOIR", id: avoir.id, facture });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Appliquer ${avoir.numero}`}
      subtitle={`${clientName(avoir.client)} · ${formatDa(num(avoir.montant))} · émis le ${formatDateTime(avoir.date_creation)}`}
      icon={<Undo2 size={17} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!facture || saving} onClick={() => void submit()}>
            {saving ? "Application…" : "Appliquer"}
          </Button>
        </>
      }
    >
      <DrawerSection title="Facture du client" hint="Factures non soldées de ce client.">
        {factures.length === 0 ? (
          <p className="text-[12.5px] text-muted">Aucune facture non soldée pour ce client.</p>
        ) : (
          <Field label="Facture">
            <select className={inputClass} value={facture} onChange={(e) => setFacture(Number(e.target.value))}>
              {factures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.numero} · {formatDa(num(f.montant_total))}
                </option>
              ))}
            </select>
          </Field>
        )}
      </DrawerSection>
    </Drawer>
  );
}
