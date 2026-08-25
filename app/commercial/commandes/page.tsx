"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderBadge } from "@/components/badges";
import { Button, DataTable, PageHeader, Panel } from "@/components/ui";
import { TYPE_COMMANDE_LABEL } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function CommandesPage() {
  const { state, clientName, can } = useStore();
  const router = useRouter();
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ventes"
        title="Commandes clients"
        description="Suivez les commandes, de la saisie à la facturation."
        actions={can("CREATE_COMMANDE") ? <Link href="/commercial/commandes/nouvelle"><Button>Nouvelle commande</Button></Link> : null}
      />
      <Panel>
        <DataTable
          columns={[{ key: "n", label: "N°" }, { key: "c", label: "Client" }, { key: "t", label: "Type" }, { key: "s", label: "Statut" }, { key: "d", label: "Date" }]}
          rows={state.commandes.map((c) => ({
            n: <span className="num font-medium">{c.numero}</span>,
            c: clientName(c.client),
            t: TYPE_COMMANDE_LABEL[c.type_commande] ?? c.type_commande,
            s: <OrderBadge status={c.statut} />,
            d: formatDateTime(c.date_commande),
            href: `/commercial/commandes/${c.id}`,
          }))}
          onRowClick={(row) => router.push(String(row.href))}
        />
      </Panel>
    </div>
  );
}
