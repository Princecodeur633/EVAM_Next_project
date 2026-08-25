"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Banknote, Boxes, Factory, FileWarning } from "lucide-react";
import { BarChart, CapacityGauge, DonutChart, KpiCard, LineChart, WidgetCard } from "@/components/charts";
import { OfBadge, OrderBadge } from "@/components/badges";
import { DataTable, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatQty } from "@/lib/utils";

export default function DashboardPage() {
  const { state, productName, customerName } = useStore();
  const router = useRouter();

  const stockPf = state.stock.filter((s) => s.articleType === "produit" && s.depotId === "dep-pf");
  const stockUnits = stockPf.reduce((a, s) => a + s.qty, 0);
  const reserved = stockPf.reduce((a, s) => a + s.reserved, 0);
  const caJour = state.payments.filter((p) => p.success && p.at.startsWith("2026-08-19")).reduce((a, p) => a + p.amount, 0);
  const caTotal = state.payments.filter((p) => p.success).reduce((a, p) => a + p.amount, 0);
  const ofOpen = state.ofList.filter((o) => !["cloture", "bloque"].includes(o.status)).length;
  const suspendues = state.invoices.filter((i) => i.status === "suspendue").length;
  const aPayer = state.invoices.filter((i) => i.status === "a_payer").reduce((a, i) => a + i.amount, 0);
  const alertes = state.materials.filter((m) => {
    const qty = state.stock.filter((s) => s.articleId === m.id && s.depotId === "dep-mp").reduce((a, s) => a + s.qty, 0);
    return qty < m.minStock;
  }).length;

  const caSerie = [
    { label: "Lun", value: 18200 },
    { label: "Mar", value: 22100 },
    { label: "Mer", value: 19840 },
    { label: "Jeu", value: 28800 },
    { label: "Ven", value: caJour || 43320 },
    { label: "Sam", value: 9600 },
  ];

  const stockByFamily = [
    {
      label: "Eau",
      value: stockPf.filter((s) => state.products.find((p) => p.id === s.articleId)?.family === "eau").reduce((a, s) => a + s.qty, 0),
      color: "var(--chart-1)",
    },
    {
      label: "Jus",
      value: stockPf.filter((s) => state.products.find((p) => p.id === s.articleId)?.family === "jus").reduce((a, s) => a + s.qty, 0),
      color: "var(--chart-2)",
    },
    {
      label: "Yaourt",
      value: stockPf.filter((s) => state.products.find((p) => p.id === s.articleId)?.family === "yaourt").reduce((a, s) => a + s.qty, 0),
      color: "var(--chart-3)",
    },
  ];

  const ofPipeline = [
    { label: "Planifié", value: state.ofList.filter((o) => o.status === "planifie").length },
    { label: "Prod.", value: state.ofList.filter((o) => o.status === "en_production").length },
    { label: "Fin prod.", value: state.ofList.filter((o) => o.status === "fin_production").length },
    { label: "Clôturé", value: state.ofList.filter((o) => o.status === "cloture").length },
    { label: "Bloqué", value: state.ofList.filter((o) => o.status === "bloque").length },
  ];

  const financeMix = [
    { label: "Payées", value: state.invoices.filter((i) => i.status === "payee").length, color: "var(--chart-5)" },
    { label: "À payer", value: state.invoices.filter((i) => i.status === "a_payer").length, color: "var(--chart-3)" },
    { label: "Suspendues", value: suspendues, color: "var(--danger)" },
  ];

  const ligneCapacity = [
    { label: "Ligne eau A", used: 78, capacity: 100 },
    { label: "Ligne jus B", used: 54, capacity: 100 },
    { label: "Ligne yaourt C", used: 91, capacity: 100 },
  ];

  const margeRows = state.products.map((p) => {
    const cmup = state.stock.find((s) => s.articleId === p.id && s.depotId === "dep-pf")?.cmup ?? 0;
    return { label: p.name.split(" ")[0], value: Math.max(0, Math.round(p.priceHt - cmup)) };
  });

  return (
    <div className="anim-in space-y-6">
      <PageHeader
        eyebrow="Direction · Pilotage"
        title="Tableau de bord"
        description="Indicateurs vitaux, finance, capacité atelier et performance stock. Lecture seule — chaque chiffre pointe vers le flux réel."
      />

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <button type="button" className="text-left" onClick={() => router.push("/stocks")}>
          <KpiCard
            label="Stock PF vendable"
            value={formatQty(stockUnits)}
            hint={`${formatQty(reserved)} réservés`}
            icon={<Boxes size={15} />}
          />
        </button>
        <KpiCard
          label="CA encaissé (jour)"
          value={formatDa(caJour)}
          hint="Paiements réussis uniquement"
          tone="success"
          delta="+12%"
          icon={<Banknote size={15} />}
        />
        <button type="button" className="text-left" onClick={() => router.push("/production/of")}>
          <KpiCard label="OF en cours" value={ofOpen} hint="Hors clôturés / bloqués" tone="warning" icon={<Factory size={15} />} />
        </button>
        <button type="button" className="text-left" onClick={() => router.push("/caisse/suspendues")}>
          <KpiCard
            label="Factures suspendues"
            value={suspendues}
            hint="Jamais exportables Sage"
            tone="danger"
            icon={<FileWarning size={15} />}
          />
        </button>
        <button type="button" className="text-left" onClick={() => router.push("/stocks/alertes")}>
          <KpiCard
            label="Alertes seuils"
            value={alertes}
            hint="Matières sous minimum"
            tone={alertes ? "warning" : "default"}
            icon={<AlertTriangle size={15} />}
          />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <WidgetCard
          className="lg:col-span-2"
          title="Encaissements — 6 derniers jours"
          subtitle="Finance · CA réalisé (hors factures suspendues)"
          action={<span className="text-[11px] num text-muted">Cumul {formatDa(caTotal)}</span>}
        >
          <LineChart data={caSerie} height={180} format={(n) => formatDa(n)} />
        </WidgetCard>

        <WidgetCard title="Portefeuille factures" subtitle="Finance · répartition des statuts">
          <DonutChart data={financeMix} centerValue={formatDa(aPayer)} centerLabel="à encaisser" />
        </WidgetCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <WidgetCard title="Pipeline OF" subtitle="Production · charge atelier">
          <BarChart data={ofPipeline} height={170} />
        </WidgetCard>

        <WidgetCard title="Stock PF par famille" subtitle="Capacité vendable (dépôt PF)">
          <DonutChart data={stockByFamily} centerValue={formatQty(stockUnits)} centerLabel="unités" />
        </WidgetCard>

        <WidgetCard title="Capacité lignes" subtitle="Atelier · taux d'occupation du jour">
          <div className="space-y-4">
            {ligneCapacity.map((l) => (
              <CapacityGauge key={l.label} label={l.label} used={l.used} capacity={l.capacity} unit="%" />
            ))}
          </div>
        </WidgetCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <WidgetCard title="Marge unitaire indicative" subtitle="Prix HT − CMUP stock PF">
          <BarChart data={margeRows} height={160} format={(n) => formatDa(n)} />
        </WidgetCard>

        <div className="lg:col-span-2 evam-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex justify-between items-center">
            <div>
              <h2 className="text-[13px] font-semibold">Ordres de fabrication actifs</h2>
              <p className="text-[11.5px] text-muted">Cliquez pour ouvrir la fiche OF</p>
            </div>
            <button type="button" onClick={() => router.push("/production/of")} className="text-[12px] text-primary hover:underline font-medium">
              Tous les OF
            </button>
          </div>
          <DataTable
            columns={[
              { key: "id", label: "OF" },
              { key: "p", label: "Produit" },
              { key: "st", label: "Statut" },
              { key: "lot", label: "Lot", className: "num" },
            ]}
            rows={state.ofList
              .filter((o) => o.status !== "cloture")
              .map((o) => ({
                href: `/production/of/${o.id}`,
                id: <span className="num">{o.id}</span>,
                p: productName(o.productId),
                st: <OfBadge status={o.status} />,
                lot: o.lot ?? "—",
              }))}
            onRowClick={(row) => router.push(String(row.href))}
          />
        </div>
      </div>

      <div className="evam-card overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex justify-between items-center">
          <div>
            <h2 className="text-[13px] font-semibold">Commandes commerciales</h2>
            <p className="text-[11.5px] text-muted">Cycle commande → paiement → livraison</p>
          </div>
          <button type="button" onClick={() => router.push("/commercial/commandes")} className="text-[12px] text-primary hover:underline font-medium">
            Commercial
          </button>
        </div>
        <DataTable
          columns={[
            { key: "n", label: "Commande" },
            { key: "c", label: "Client" },
            { key: "st", label: "Statut" },
          ]}
          rows={state.orders.map((o) => ({
            href: `/commercial/commandes/${o.id}`,
            n: <span className="num">{o.number}</span>,
            c: customerName(o.customerId),
            st: <OrderBadge status={o.status} />,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </div>
    </div>
  );
}
