"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PackageCheck, Truck } from "lucide-react";
import { ReceptionDrawer } from "@/components/achats";
import { FilterBar, SearchInput, matchSearch } from "@/components/Filters";
import { Tabs } from "@/components/Tabs";
import { Button, DataTable, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { STATUT_CF_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDate, formatDateTime, num } from "@/lib/utils";

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
