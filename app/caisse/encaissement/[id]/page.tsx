"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Ancien écran d’encaissement : la facture s’ouvre désormais dans le panneau de droite de « Caisse ». */
export default function EncaissementRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/caisse?facture=${id}`);
  }, [id, router]);
  return null;
}
