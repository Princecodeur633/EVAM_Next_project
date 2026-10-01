"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PackageCheck, Truck } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, Field, PageHeader, Panel, StatusBadge, inputClass } from "@/components/ui";
import { STATUT_CF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { CommandeFournisseur } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatQty, num } from "@/lib/utils";

type Onglet = "attendues" | "effectuees";

export default function ReceptionsPage() {
  return (
    <Suspense fallback={null}>
      <Receptions />
    </Suspense>
  );
}

function Receptions() {
  const { state, can, userName } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [onglet, setOnglet] = useState<Onglet>("attendues");
  const [q, setQ] = useState("");
  const [ouverte, setOuverte] = useState<number | null>(Number(params.get("cf")) || null);

  const attendues = state.commandesFournisseur
    .filter((c) => c.statut === "ENVOYEE" || c.statut === "PARTIELLEMENT_RECUE")
    .filter((c) => matchSearch(q, c.numero))
    .sort((a, b) => new Date(a.date_commande).getTime() - new Date(b.date_commande).getTime());
  const cfNum = (id: number) => state.commandesFournisseur.find((c) => c.id === id)?.numero ?? `Commande n°${id}`;
  const effectuees = [...state.receptions]
    .filter((r) => matchSearch(q, cfNum(r.commande), userName(r.receptionne_par)))
    .sort((a, b) => new Date(b.date_reception).getTime() - new Date(a.date_reception).getTime());
  const lignesDe = (cf: number) => state.lignesCommandeFournisseur.filter((l) => l.commande === cf);
  const cf = state.commandesFournisseur.find((c) => c.id === ouverte) ?? null;

  return (
    <div className="space-y-4 max-w-[1440px]">
      <PageHeader eyebrow="Magasin" title="Réceptions" description="Réceptionnez les livraisons fournisseurs : le stock matières suit le reçu, la commande se met à jour automatiquement." />

      <Tabs
        label="Réceptions"
        value={onglet}
        onChange={setOnglet}
        items={[
          { value: "attendues", label: "À réceptionner", icon: Truck, count: state.commandesFournisseur.filter((c) => c.statut === "ENVOYEE" || c.statut === "PARTIELLEMENT_RECUE").length },
          { value: "effectuees", label: "Réceptions effectuées", icon: PackageCheck, count: state.receptions.length },
        ]}
      />

      <Panel className="overflow-hidden">
        <FilterBar shown={onglet === "attendues" ? attendues.length : effectuees.length} total={onglet === "attendues" ? attendues.length : state.receptions.length} active={!!q} onReset={() => setQ("")}>
          <SearchInput value={q} onChange={setQ} placeholder="N° de commande…" />
        </FilterBar>
        {onglet === "attendues" ? (
          <DataTable
            emptyText="Aucune livraison fournisseur attendue."
            columns={[
              { key: "n", label: "Commande" },
              { key: "d", label: "Commandée le" },
              { key: "l", label: "Lignes", className: "text-right" },
              { key: "s", label: "Statut" },
              { key: "x", label: "", className: "text-right" },
            ]}
            rows={attendues.map((c) => {
              const lignes = lignesDe(c.id);
              const restantes = lignes.filter((l) => num(l.quantite_recue) < num(l.quantite_commandee)).length;
              return {
                n: <span className="num font-medium">{c.numero}</span>,
                d: formatDate(c.date_commande),
                l: <span className="num">{restantes}/{lignes.length} à recevoir</span>,
                s: <StatusBadge tone={c.statut === "PARTIELLEMENT_RECUE" ? "warning" : "info"}>{STATUT_CF_LABEL[c.statut]}</StatusBadge>,
                x: can("CREATE_RECEPTION") ? (
                  <Button className="h-8 px-3 text-[12.5px]" onClick={() => setOuverte(c.id)}>
                    <PackageCheck size={14} /> Réceptionner
                  </Button>
                ) : (
                  ""
                ),
              };
            })}
          />
        ) : (
          <DataTable
            emptyText="Aucune réception."
            columns={[
              { key: "c", label: "Commande" },
              { key: "p", label: "Réceptionnée par" },
              { key: "ok", label: "Conformité" },
              { key: "d", label: "Date" },
            ]}
            rows={effectuees.map((r) => ({
              c: <span className="num font-medium">{cfNum(r.commande)}</span>,
              p: userName(r.receptionne_par),
              ok: r.conforme ? <StatusBadge tone="success">Conforme</StatusBadge> : <StatusBadge tone="warning">Avec écart</StatusBadge>,
              d: formatDateTime(r.date_reception),
              href: `/approvisionnement/receptions/${r.id}`,
            }))}
            onRowClick={(row) => router.push(String(row.href))}
          />
        )}
      </Panel>

      {cf && <ReceptionDrawer key={cf.id} cf={cf} onClose={() => setOuverte(null)} />}
    </div>
  );
}

/** Tiroir unique : lignes de la commande, « Qté reçue » pré-remplie avec le reste dû, écart en direct. */
function ReceptionDrawer({ cf, onClose }: { cf: CommandeFournisseur; onClose: () => void }) {
  const { state, dispatch, articleName } = useStore();
  const lignes = state.lignesCommandeFournisseur.filter((l) => l.commande === cf.id);
  const reste = (l: (typeof lignes)[number]) => Math.max(0, num(l.quantite_commandee) - num(l.quantite_recue));
  const [recu, setRecu] = useState<Record<number, string>>(() => Object.fromEntries(lignes.map((l) => [l.id, String(reste(l))])));
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  const ecart = (l: (typeof lignes)[number]) => (Number(recu[l.id]) || 0) - reste(l);
  const aRecevoir = lignes.filter((l) => (Number(recu[l.id]) || 0) > 0);
  const conforme = lignes.every((l) => ecart(l) === 0);

  async function valider() {
    setSaving(true);
    const ok = await dispatch({
      type: "RECEVOIR_COMMANDE",
      commande: cf.id,
      conforme,
      observations: observations.trim(),
      lignes: aRecevoir.map((l) => ({ ligne_commande: l.id, quantite_recue: Number(recu[l.id]) })),
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title={`Réceptionner ${cf.numero}`}
      subtitle={`Commandée le ${formatDate(cf.date_commande)} · ${STATUT_CF_LABEL[cf.statut]}`}
      icon={<PackageCheck size={17} />}
      footer={
        <>
          <span className="mr-auto text-[12px]">{conforme ? <span className="text-success font-medium">Conforme à la commande</span> : <span className="text-warning font-medium">Réception avec écart</span>}</span>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={aRecevoir.length === 0 || saving} onClick={() => void valider()}>
            {saving ? "Validation…" : "Valider la réception"}
          </Button>
        </>
      }
    >
      <div className="rounded-[9px] border border-line overflow-x-auto">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="bg-surface-2 border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
              <th className="px-3 py-2 font-medium">Article</th>
              <th className="px-3 py-2 font-medium text-right">Reste dû</th>
              <th className="px-3 py-2 font-medium text-right">Qté reçue</th>
              <th className="px-3 py-2 font-medium text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[12.5px] text-muted">
                  Aucune ligne sur cette commande.
                </td>
              </tr>
            )}
            {lignes.map((l) => {
              const e = ecart(l);
              return (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="text-[13px] font-medium">{articleName(l.article)}</p>
                    <p className="text-[11.5px] text-muted num">
                      Commandé {formatQty(num(l.quantite_commandee), 2)} · déjà reçu {formatQty(num(l.quantite_recue), 2)}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[13px] num">{formatQty(reste(l), 2)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      aria-label={`Quantité reçue ${articleName(l.article)}`}
                      className="h-9 w-28 border border-line-strong rounded-[6px] px-2 text-[13px] text-right num bg-surface focus:border-primary outline-none"
                      value={recu[l.id] ?? ""}
                      onChange={(ev) => setRecu((m) => ({ ...m, [l.id]: ev.target.value }))}
                    />
                  </td>
                  <td className={cn("px-3 py-2.5 text-right text-[13px] num font-semibold", e === 0 ? "text-success" : e < 0 ? "text-warning" : "text-danger")}>
                    {e === 0 ? "✓" : `${e > 0 ? "+" : ""}${formatQty(e, 2)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Field label="Observations">
        <textarea className={cn(inputClass, "h-20 py-2 resize-none")} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder={conforme ? "Facultatif" : "Expliquez l’écart (casse, manquant…)"} />
      </Field>
    </Drawer>
  );
}
