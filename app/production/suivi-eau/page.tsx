"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuiviEauPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/production/suivi");
  }, [router]);
  return null;
}
