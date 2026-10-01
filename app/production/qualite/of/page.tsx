"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Ancien écran « OF reçus » : c’est désormais l’onglet « À créer » des lots qualité. */
export default function OfRecusQualitePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/production/qualite?tab=creer");
  }, [router]);
  return null;
}
