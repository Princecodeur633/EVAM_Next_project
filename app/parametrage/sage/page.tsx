"use client";

import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";

export default function SagePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Comptabilité"
        title="Exports vers la comptabilité"
        description="Les fichiers de période se génèrent depuis le module comptable."
      />
      <Panel className="p-5 text-[13px] text-muted leading-relaxed">
        Ouvrez{" "}
        <Link href="/comptabilite/export-sage" className="text-primary font-medium">
          Comptabilité → Exports comptables
        </Link>{" "}
        pour les ventes, encaissements, achats et le journal.
      </Panel>
    </div>
  );
}
