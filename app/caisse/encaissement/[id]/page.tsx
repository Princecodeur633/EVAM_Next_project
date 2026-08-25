"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EncaissementRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/caisse"); }, [router]);
  return null;
}
