"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { REF_TABS } from "@/lib/nav";
import { canReadParam } from "@/lib/roles";
import { useStore } from "@/lib/store";

/** Le hub ouvre directement le premier onglet accessible au poste. */
export default function ParametrageHubPage() {
  const router = useRouter();
  const { currentUser } = useStore();
  const role = currentUser?.role ?? null;
  const first = REF_TABS.find((t) => canReadParam(role, t.href));

  useEffect(() => {
    if (role) router.replace(first?.href ?? "/403");
  }, [role, first, router]);

  return null;
}
