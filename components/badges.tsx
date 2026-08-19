import { StatusBadge } from "@/components/ui";
import type { BlStatus, ClaimStatus, DaStatus, OfStatus, OrderStatus } from "@/lib/types";

export function OfBadge({ status }: { status: OfStatus }) {
  const map: Record<OfStatus, { tone: "neutral" | "info" | "success" | "warning" | "danger" | "teal"; label: string }> = {
    cree: { tone: "neutral", label: "Créé" },
    planifie: { tone: "info", label: "Planifié" },
    en_production: { tone: "warning", label: "En production" },
    fin_production: { tone: "teal", label: "Fin production" },
    controle_qualite: { tone: "teal", label: "Contrôle qualité" },
    cloture: { tone: "success", label: "Clôturé" },
    bloque: { tone: "danger", label: "Bloqué" },
  };
  const m = map[status];
  return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
}

export function OrderBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { tone: "neutral" | "info" | "success" | "warning" | "danger" | "teal"; label: string }> = {
    creee: { tone: "neutral", label: "Créée" },
    stock_verifie: { tone: "info", label: "Stock OK" },
    a_payer: { tone: "warning", label: "À payer" },
    payee: { tone: "success", label: "Payée" },
    suspendue: { tone: "danger", label: "Suspendue" },
    preparee: { tone: "teal", label: "Préparée" },
    livree: { tone: "success", label: "Livrée" },
    exportee: { tone: "success", label: "Exportée" },
    annulee: { tone: "neutral", label: "Annulée" },
  };
  const m = map[status];
  return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
}

export function DaBadge({ status }: { status: DaStatus }) {
  const map = {
    brouillon: { tone: "neutral" as const, label: "Brouillon" },
    soumise: { tone: "warning" as const, label: "Soumise" },
    validee: { tone: "success" as const, label: "Validée" },
    refusee: { tone: "danger" as const, label: "Refusée" },
  };
  return <StatusBadge tone={map[status].tone}>{map[status].label}</StatusBadge>;
}

export function BlBadge({ status }: { status: BlStatus }) {
  const map = {
    brouillon: { tone: "neutral" as const, label: "Brouillon" },
    verrouille: { tone: "danger" as const, label: "Verrouillé — impayé" },
    valide: { tone: "info" as const, label: "Validé" },
    livre: { tone: "success" as const, label: "Livré" },
  };
  return <StatusBadge tone={map[status].tone}>{map[status].label}</StatusBadge>;
}

export function ClaimBadge({ status }: { status: ClaimStatus }) {
  const map = {
    ouverte: { tone: "warning" as const, label: "Ouverte" },
    quarantaine: { tone: "danger" as const, label: "Quarantaine" },
    acceptee: { tone: "success" as const, label: "Acceptée" },
    rejetee: { tone: "neutral" as const, label: "Rejetée" },
  };
  return <StatusBadge tone={map[status].tone}>{map[status].label}</StatusBadge>;
}
