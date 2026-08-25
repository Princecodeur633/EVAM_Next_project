import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Coins,
  Factory,
  Handshake,
  Home,
  Package,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Banknote,
  Wrench,
} from "lucide-react";

export const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  bar: BarChart3,
  factory: Factory,
  boxes: Boxes,
  cart: ShoppingCart,
  handshake: Handshake,
  banknote: Banknote,
  truck: Truck,
  alert: AlertTriangle,
  coins: Coins,
  ledger: ClipboardList,
  sliders: SlidersHorizontal,
  shield: Shield,
  check: CheckCircle2,
  package: Package,
};

export const ROLE_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  bar: BarChart3,
  factory: Factory,
  wrench: Wrench,
  check: CheckCircle2,
  boxes: Boxes,
  cart: ShoppingCart,
  handshake: Handshake,
  banknote: Banknote,
  package: Package,
  truck: Truck,
  ledger: ClipboardList,
};

export const ACCENT_CLASS: Record<string, string> = {
  navy: "bg-primary",
  teal: "bg-teal",
  amber: "bg-warning",
  green: "bg-success",
  red: "bg-danger",
  slate: "bg-slate-500",
};

export const ACCENT_SOFT: Record<string, string> = {
  navy: "bg-primary-soft text-primary",
  teal: "bg-teal-soft text-teal",
  amber: "bg-warning-soft text-warning",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  slate: "bg-surface-2 text-muted",
};
