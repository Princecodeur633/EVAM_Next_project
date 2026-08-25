import type { AppState, Material, Movement, Role, StockLine } from "./types";
import { availableQty } from "./utils";

export const PF_DEPOT = "dep-pf";
export const MP_DEPOT = "dep-mp";
export const QUARANTINE_DEPOT = "dep-q";
export const RETURNS_DEPOT = "dep-ret";

export const ACTIONS = {
  CREATE_PLAN: ["responsable_production"],
  START_OF: ["agent_production", "responsable_production"],
  SAVE_TRACKING: ["agent_production", "responsable_production"],
  ADD_LOSS: ["agent_production", "responsable_production"],
  ACK_MATERIAL_REQUEST: ["magasinier"],
  SERVE_MATERIAL_REQUEST: ["magasinier"],
  END_PRODUCTION: ["responsable_production"],
  QUALITY_CLOSE: ["controleur_qualite"],
  QUALITY_BLOCK: ["controleur_qualite"],
  CREATE_ORDER: ["commercial"],
  PAY_INVOICE: ["caissier"],
  CLOSE_CASH: ["caissier"],
  PREPARE_ORDER: ["preparateur"],
  VALIDATE_BL: ["logistique"],
  DELIVER: ["logistique"],
  CREATE_DA: ["responsable_achats"],
  SUBMIT_DA: ["responsable_achats"],
  VALIDATE_DA: ["responsable_achats"],
  REFUSE_DA: ["responsable_achats"],
  CREATE_PO: ["responsable_achats"],
  CREATE_RECEPTION: ["responsable_achats", "magasinier"],
  CONFIRM_RECEPTION: ["magasinier", "responsable_achats"],
  COUNT_INVENTORY: ["magasinier"],
  VALIDATE_INVENTORY: ["magasinier"],
  OPEN_INVENTORY: ["magasinier"],
  TRANSFER_STOCK: ["magasinier"],
  RETURN_STOCK: ["magasinier"],
  VALIDATE_DRAFT: ["comptabilite"],
  EXPORT_SAGE: ["comptabilite"],
  DECIDE_CLAIM: ["controleur_qualite", "logistique", "commercial"],
  CREATE_CLAIM: ["controleur_qualite", "logistique", "commercial"],
  ADMIN_USERS: ["administrateur"],
  UPDATE_SETTINGS: ["administrateur", "comptabilite"],
} as const;

export type ActionName = keyof typeof ACTIONS;

export function canAct(role: Role | null, action: ActionName) {
  if (!role) return false;
  return (ACTIONS[action] as readonly Role[]).includes(role);
}

export function currentRole(state: AppState): Role | null {
  const user = state.users.find((u) => u.id === state.currentUserId);
  if (!user?.active) return null;
  return user.role;
}

export function deny(state: AppState, allowed: Role[]): string | null {
  const role = currentRole(state);
  if (!role) return "Session inactive ou compte désactivé.";
  if (!allowed.includes(role)) return "Action hors périmètre de votre poste.";
  return null;
}

export function sellableQty(state: AppState, productId: string) {
  return state.stock
    .filter((s) => s.articleId === productId && s.articleType === "produit" && s.depotId === PF_DEPOT)
    .reduce((a, s) => a + availableQty(s.qty, s.reserved), 0);
}

export function materialAvail(state: AppState, materialId: string, depotId = MP_DEPOT) {
  return state.stock
    .filter((s) => s.articleId === materialId && s.articleType === "matiere" && s.depotId === depotId)
    .reduce((a, s) => a + availableQty(s.qty, s.reserved), 0);
}

export function weightedCmup(qty: number, cmup: number, addQty: number, addCost: number) {
  const total = qty + addQty;
  if (total <= 0) return addCost;
  return (qty * cmup + addQty * addCost) / total;
}

export function ofUnitCost(state: AppState, productId: string) {
  const sheet = state.sheets.find((s) => s.productId === productId && s.status === "active");
  if (!sheet) return 0;
  return [...sheet.composition, ...sheet.packaging].reduce((sum, l) => {
    const mat = state.materials.find((m) => m.id === l.materialId);
    return sum + l.qty * (mat?.cmup ?? 0);
  }, 0);
}

export function unitPriceForCustomer(state: AppState, customerId: string, productId: string) {
  const product = state.products.find((p) => p.id === productId);
  const customer = state.customers.find((c) => c.id === customerId);
  const tariff = state.tariffs.find((t) => t.id === customer?.tariffId);
  return Math.round((product?.priceHt ?? 0) * (tariff?.factor ?? 1));
}

type InboundArgs = {
  articleId: string;
  articleType: "produit" | "matiere";
  depotId: string;
  qty: number;
  unitCost: number;
  lot?: string;
  origin: string;
};

export function inbound(
  stock: StockLine[],
  movements: Movement[],
  materials: Material[],
  args: InboundArgs,
): { stock: StockLine[]; movements: Movement[]; materials: Material[] } {
  const nextStock = stock.map((s) => ({ ...s }));
  const idx = nextStock.findIndex(
    (s) =>
      s.articleId === args.articleId &&
      s.articleType === args.articleType &&
      s.depotId === args.depotId &&
      (args.lot ? s.lot === args.lot : !s.lot),
  );
  let cmup = args.unitCost;
  if (idx >= 0) {
    const line = nextStock[idx];
    cmup = weightedCmup(line.qty, line.cmup, args.qty, args.unitCost);
    nextStock[idx] = { ...line, qty: line.qty + args.qty, cmup };
  } else {
    nextStock.unshift({
      id: `st-${Date.now()}-${args.articleId}-${args.depotId}`,
      articleId: args.articleId,
      articleType: args.articleType,
      depotId: args.depotId,
      lot: args.lot,
      qty: args.qty,
      reserved: 0,
      cmup,
    });
  }
  let nextMaterials = materials;
  if (args.articleType === "matiere") {
    const totalQty = nextStock.filter((s) => s.articleId === args.articleId && s.articleType === "matiere").reduce((a, s) => a + s.qty, 0);
    const totalVal = nextStock
      .filter((s) => s.articleId === args.articleId && s.articleType === "matiere")
      .reduce((a, s) => a + s.qty * s.cmup, 0);
    const matCmup = totalQty > 0 ? totalVal / totalQty : args.unitCost;
    nextMaterials = materials.map((m) => (m.id === args.articleId ? { ...m, cmup: matCmup } : m));
  }
  return {
    stock: nextStock,
    materials: nextMaterials,
    movements: [
      {
        id: `mv-${Date.now()}-${args.articleId}-${Math.random().toString(16).slice(2, 6)}`,
        type: "entree",
        articleId: args.articleId,
        articleType: args.articleType,
        qty: args.qty,
        depotId: args.depotId,
        lot: args.lot,
        origin: args.origin,
        cmup,
        at: new Date().toISOString(),
      },
      ...movements,
    ],
  };
}

export function outbound(
  stock: StockLine[],
  movements: Movement[],
  args: {
    articleId: string;
    articleType: "produit" | "matiere";
    depotId: string;
    qty: number;
    origin: string;
    consumeReserved?: boolean;
  },
): { ok: true; stock: StockLine[]; movements: Movement[] } | { ok: false; need: number; available: number } {
  const next = stock.map((s) => ({ ...s }));
  let remaining = args.qty;
  const available = next
    .filter((s) => s.articleId === args.articleId && s.articleType === args.articleType && s.depotId === args.depotId)
    .reduce((a, s) => a + (args.consumeReserved ? s.reserved : availableQty(s.qty, s.reserved)), 0);
  if (available < remaining) return { ok: false, need: args.qty, available };

  const nextMovements = [...movements];
  for (let i = 0; i < next.length && remaining > 0; i++) {
    const s = next[i];
    if (s.articleId !== args.articleId || s.articleType !== args.articleType || s.depotId !== args.depotId) continue;
    const take = args.consumeReserved
      ? Math.min(s.reserved, remaining)
      : Math.min(availableQty(s.qty, s.reserved), remaining);
    if (take <= 0) continue;
    remaining -= take;
    next[i] = args.consumeReserved
      ? { ...s, qty: s.qty - take, reserved: s.reserved - take }
      : { ...s, qty: s.qty - take };
    nextMovements.unshift({
      id: `mv-${Date.now()}-${s.id}-${take}`,
      type: "sortie",
      articleId: args.articleId,
      articleType: args.articleType,
      qty: take,
      depotId: args.depotId,
      lot: s.lot,
      origin: args.origin,
      cmup: s.cmup,
      at: new Date().toISOString(),
    });
  }
  return { ok: true, stock: next, movements: nextMovements };
}

export function transferStock(
  stock: StockLine[],
  movements: Movement[],
  materials: Material[],
  args: {
    articleId: string;
    articleType: "produit" | "matiere";
    fromDepotId: string;
    toDepotId: string;
    qty: number;
    origin: string;
    lot?: string;
  },
): { ok: true; stock: StockLine[]; movements: Movement[]; materials: Material[] } | { ok: false; message: string } {
  const src = stock.find(
    (s) =>
      s.articleId === args.articleId &&
      s.articleType === args.articleType &&
      s.depotId === args.fromDepotId &&
      (args.lot ? s.lot === args.lot : true) &&
      availableQty(s.qty, s.reserved) > 0,
  );
  if (!src) return { ok: false, message: "Aucune ligne source disponible pour ce transfert." };
  const take = Math.min(args.qty, availableQty(src.qty, src.reserved));
  const afterOut = outbound(stock, movements, {
    articleId: args.articleId,
    articleType: args.articleType,
    depotId: args.fromDepotId,
    qty: take,
    origin: args.origin,
  });
  if (!afterOut.ok) return { ok: false, message: `Stock insuffisant pour transférer ${args.qty}.` };
  const afterIn = inbound(afterOut.stock, afterOut.movements, materials, {
    articleId: args.articleId,
    articleType: args.articleType,
    depotId: args.toDepotId,
    qty: take,
    unitCost: src.cmup,
    lot: src.lot,
    origin: args.origin,
  });
  const lastMv = afterIn.movements[0];
  if (lastMv) {
    lastMv.type = "transfert";
    lastMv.destDepotId = args.toDepotId;
  }
  return { ok: true, ...afterIn };
}

export function adjustLine(
  stock: StockLine[],
  movements: Movement[],
  args: { articleId: string; depotId: string; physical: number; origin: string },
) {
  const next = stock.map((s) => ({ ...s }));
  const idx = next.findIndex((s) => s.articleId === args.articleId && s.depotId === args.depotId);
  if (idx < 0) return { stock: next, movements };
  const line = next[idx];
  const delta = args.physical - line.qty;
  next[idx] = { ...line, qty: args.physical };
  if (delta === 0) return { stock: next, movements };
  return {
    stock: next,
    movements: [
      {
        id: `mv-adj-${Date.now()}-${line.id}`,
        type: "ajustement" as const,
        articleId: args.articleId,
        articleType: line.articleType,
        qty: Math.abs(delta),
        depotId: args.depotId,
        lot: line.lot,
        origin: `${args.origin} (${delta > 0 ? "+" : ""}${delta})`,
        cmup: line.cmup,
        at: new Date().toISOString(),
      },
      ...movements,
    ],
  };
}

export function reserveSellable(
  stock: StockLine[],
  productId: string,
  qty: number,
): { ok: true; stock: StockLine[] } | { ok: false; available: number } {
  const available = stock
    .filter((s) => s.articleId === productId && s.articleType === "produit" && s.depotId === PF_DEPOT)
    .reduce((a, s) => a + availableQty(s.qty, s.reserved), 0);
  if (available < qty) return { ok: false, available };
  let remaining = qty;
  const next = stock.map((s) => {
    if (s.articleId !== productId || s.articleType !== "produit" || s.depotId !== PF_DEPOT || remaining <= 0) return s;
    const take = Math.min(availableQty(s.qty, s.reserved), remaining);
    remaining -= take;
    return { ...s, reserved: s.reserved + take };
  });
  return { ok: true, stock: next };
}

export function releaseReserved(stock: StockLine[], productId: string, qty: number) {
  let remaining = qty;
  return stock.map((s) => {
    if (s.articleId !== productId || s.articleType !== "produit" || remaining <= 0) return s;
    const take = Math.min(s.reserved, remaining);
    remaining -= take;
    return { ...s, reserved: s.reserved - take };
  });
}
