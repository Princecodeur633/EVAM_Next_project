"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderBadge } from "@/components/badges";
import { DataTable, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDa, formatDateTime } from "@/lib/utils";

export default function CommandesPage() {
  const { state, customerName } = useStore();
  const router = useRouter();
  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Commandes clients"
        description="Aucune commande n'est validée sans vérification du stock disponible (physique − déjà réservé)."
        actions={
          <Link href="/commercial/commandes/nouvelle" className="inline-flex items-center h-8 px-3 text-[13px] font-medium rounded-[6px] bg-primary text-white">
            Nouvelle commande
          </Link>
        }
      />
      <Panel>
        <DataTable
          columns={[
            { key: "n", label: "N°" },
            { key: "c", label: "Client" },
            { key: "st", label: "Statut" },
            { key: "m", label: "Montant" },
            { key: "at", label: "Créée" },
          ]}
          rows={state.orders.map((o) => {
            const inv = state.invoices.find((i) => i.id === o.invoiceId);
            return {
              href: `/commercial/commandes/${o.id}`,
              n: <span className="num font-medium">{o.number}</span>,
              c: customerName(o.customerId),
              st: <OrderBadge status={o.status} />,
              m: <span className="num">{formatDa(inv?.amount ?? 0)}</span>,
              at: formatDateTime(o.createdAt),
            };
          })}
          onRowClick={(r) => router.push(String(r.href))}
        />
      </Panel>
    </div>
  );
}
