import { StatusBadge } from "@/components/ui";
import {
  STATUT_BL_LABEL,
  STATUT_CMD_LABEL,
  STATUT_DA_LABEL,
  STATUT_LOT_LABEL,
  STATUT_OF_LABEL,
} from "@/lib/labels";
import type { StatutBL, StatutCommande, StatutDemandeAchat, StatutLot, StatutOF } from "@/lib/types";

const TONE = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  teal: "teal",
} as const;

type Tone = (typeof TONE)[keyof typeof TONE];

export function OfBadge({ status }: { status: StatutOF }) {
  const tones: Record<StatutOF, Tone> = {
    BROUILLON: "neutral",
    PLANIFIE: "info",
    LANCE: "teal",
    EN_PRODUCTION: "warning",
    TERMINE: "teal",
    CONTROLE_QUALITE: "teal",
    LIBERE: "success",
    CLOTURE: "success",
  };
  return <StatusBadge tone={tones[status]}>{STATUT_OF_LABEL[status]}</StatusBadge>;
}

export function OrderBadge({ status }: { status: StatutCommande }) {
  const tones: Record<StatutCommande, Tone> = {
    BROUILLON: "neutral",
    VALIDEE: "info",
    EN_PREPARATION: "warning",
    LIVREE: "success",
    FACTUREE: "success",
    ANNULEE: "neutral",
  };
  return <StatusBadge tone={tones[status]}>{STATUT_CMD_LABEL[status]}</StatusBadge>;
}

export function DaBadge({ status }: { status: StatutDemandeAchat }) {
  const tones: Record<StatutDemandeAchat, Tone> = {
    EN_ATTENTE: "warning",
    APPROUVEE: "success",
    REJETEE: "danger",
    TRANSFORMEE: "teal",
  };
  return <StatusBadge tone={tones[status]}>{STATUT_DA_LABEL[status]}</StatusBadge>;
}

export function BlBadge({ status }: { status: StatutBL }) {
  const tones: Record<StatutBL, Tone> = {
    EN_LIVRAISON: "info",
    LIVREE: "success",
    PARTIELLEMENT_LIVREE: "warning",
    RETOURNEE: "danger",
  };
  return <StatusBadge tone={tones[status]}>{STATUT_BL_LABEL[status]}</StatusBadge>;
}

export function LotBadge({ status }: { status: StatutLot }) {
  const tones: Record<StatutLot, Tone> = {
    EN_ATTENTE: "warning",
    CONFORME: "teal",
    NON_CONFORME: "danger",
    BLOQUE: "danger",
    LIBERE: "success",
  };
  return <StatusBadge tone={tones[status]}>{STATUT_LOT_LABEL[status]}</StatusBadge>;
}

export function ClaimBadge({ status }: { status: string }) {
  return <StatusBadge tone="neutral">{status}</StatusBadge>;
}
