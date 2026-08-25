"use client";

import { ROLE_LABEL } from "@/lib/seed";
import type { Role } from "@/lib/types";
import { PageHeader, Panel } from "@/components/ui";
import { cn } from "@/lib/utils";

const OBJECTS = ["Plan / OF", "Stock", "Commande", "Encaissement", "BL", "Brouillard Sage", "Paramétrage"];
const ACTIONS = ["Voir", "Créer", "Valider", "Clôturer", "Exporter"];

const MATRIX: Record<string, string[]> = {
  administrateur: ["Voir", "Créer", "Valider", "Clôturer", "Exporter"],
  direction: ["Voir"],
  responsable_production: ["Voir", "Créer", "Valider"],
  agent_production: ["Voir", "Créer"],
  controleur_qualite: ["Voir", "Clôturer"],
  magasinier: ["Voir", "Valider"],
  responsable_achats: ["Voir", "Créer", "Valider"],
  commercial: ["Voir", "Créer"],
  caissier: ["Voir", "Valider"],
  preparateur: ["Voir", "Valider"],
  logistique: ["Voir", "Valider"],
  comptabilite: ["Voir", "Valider", "Exporter"],
};

export default function DroitsPage() {
  const roles = Object.keys(ROLE_LABEL) as Role[];
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Matrice des droits" description="Objet × action. Le masquage UI suit cette matrice, il ne la précède pas." />
      <Panel className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className="text-left px-3 py-2 font-medium">Profil</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-3 py-2 font-medium text-center">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r} className="border-b border-line">
                <td className="px-3 py-2">{ROLE_LABEL[r]}</td>
                {ACTIONS.map((a) => (
                  <td key={a} className="text-center">
                    <span className={cn("inline-block h-2 w-2 rounded-full", MATRIX[r].includes(a) ? "bg-success" : "bg-slate-200")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-3 py-2 text-[11px] text-muted">Objets concernés : {OBJECTS.join(" · ")}</p>
      </Panel>
    </div>
  );
}
