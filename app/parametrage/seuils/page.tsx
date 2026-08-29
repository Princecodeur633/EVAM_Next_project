"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";

export default function SeuilsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Stocks"
        title="Seuils d'alerte"
        description="Surveillez les quantités disponibles dans le magasin."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Consultez la{" "}
        <Link href="/stocks" className="text-primary font-medium">
          situation de stock
        </Link>{" "}
        : disponible = physique − bloquée − réservée.
      </Panel>
    </div>
  );
}
