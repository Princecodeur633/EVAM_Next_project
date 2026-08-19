"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <div className="max-w-lg">
      <PageHeader
        eyebrow="Accès"
        title="Hors périmètre"
        description="Cet écran n’appartient pas à votre poste. Le menu a été filtré pour que vous ne voyiez que ce que vous avez le droit de faire."
      />
      <Link href="/accueil" className="inline-flex items-center h-9 px-3.5 text-[13px] font-medium rounded-[6px] bg-primary text-white">
        Retour à mon poste
      </Link>
    </div>
  );
}
