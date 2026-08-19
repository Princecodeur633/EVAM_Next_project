"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <div>
      <PageHeader eyebrow="Accès" title="403 — Profil non habilité" description="Cet écran n'appartient pas à votre rôle. Le menu a été filtré pour éviter les actions hors périmètre." />
      <Link href="/" className="inline-flex items-center h-8 px-3 text-[13px] font-medium rounded-[6px] bg-primary text-white">
        Retour à l'accueil de rôle
      </Link>
    </div>
  );
}
