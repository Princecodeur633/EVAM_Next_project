"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FriseCloture, periodeACloturer } from "@/components/comptabilite";
import { useStore } from "@/lib/store";

const ETAPE_PAR_ECRAN: Record<string, string> = {
  "/comptabilite/ecritures": "ecritures",
  "/comptabilite/export-sage": "export",
  "/comptabilite/clotures": "cloture",
  "/comptabilite/parametres": "",
};

/** Écrans « Comptabilité » : frise de clôture en tête (sauf Anomalies, qui relève du Contrôle). */
export default function ComptabiliteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, role } = useStore();
  const etape = ETAPE_PAR_ECRAN[pathname];
  // Frise réservée à qui clôture (DAF, Admin) ; la Direction consulte les écritures sans elle.
  if (etape === undefined || (role !== "COMPTABILITE_DAF" && role !== "ADMIN_SI")) return <>{children}</>;
  return (
    <div className="space-y-4">
      <FriseCloture state={state} periode={periodeACloturer(state)} actif={etape} />
      {children}
    </div>
  );
}
