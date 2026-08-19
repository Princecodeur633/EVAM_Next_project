"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { seedState } from "./seed";
import type {
  AppState,
  PaymentMethod,
  PrepStatus,
  Role,
  WorkOrder,
} from "./types";
import { availableQty, pad } from "./utils";

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "SET_DEPOT"; depotId: string }
  | { type: "SWITCH_ROLE_USER"; userId: string }
  | { type: "CREATE_PLAN"; productId: string; date: string; qty: number }
  | { type: "START_OF"; ofId: string }
  | { type: "SAVE_TRACKING"; ofId: string; qtyReal: number; waterVolumeM3?: number }
  | { type: "ADD_LOSS"; ofId: string; causeId: string; qty: number }
  | { type: "VALIDATE_MATERIAL_REQUEST"; id: string }
  | { type: "END_PRODUCTION"; ofId: string }
  | { type: "QUALITY_CLOSE"; ofId: string }
  | { type: "QUALITY_BLOCK"; ofId: string; notes: string }
  | { type: "CREATE_ORDER"; customerId: string; lines: { productId: string; qty: number }[] }
  | { type: "PAY_INVOICE"; invoiceId: string; method: PaymentMethod; success: boolean; reason?: string }
  | { type: "PREPARE_ORDER"; orderId: string; status: PrepStatus }
  | { type: "VALIDATE_BL"; orderId: string }
  | { type: "DELIVER"; orderId: string }
  | { type: "VALIDATE_DA"; id: string }
  | { type: "COUNT_INVENTORY"; id: string; counts: Record<string, number> }
  | { type: "VALIDATE_INVENTORY"; id: string }
  | { type: "VALIDATE_DRAFT"; id: string }
  | { type: "EXPORT_SAGE" }
  | { type: "CLOSE_CASH"; counted: number }
  | { type: "DECIDE_CLAIM"; id: string; status: "acceptee" | "rejetee" | "quarantaine" };

const STORAGE_KEY = "evam-maquette-state";

function loadState(): AppState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    return { ...seedState(), ...JSON.parse(raw) } as AppState;
  } catch {
    return seedState();
  }
}

function persist(state: AppState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function audit(state: AppState, action: string): AppState {
  const user = state.users.find((u) => u.id === state.currentUserId);
  return {
    ...state,
    audit: [
      {
        id: `au-${Date.now()}`,
        at: new Date().toISOString(),
        user: user?.name ?? "Système",
        action,
      },
      ...state.audit,
    ],
  };
}

function productStock(state: AppState, productId: string) {
  return state.stock.filter((s) => s.articleId === productId && s.articleType === "produit" && s.depotId === "dep-pf");
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "LOGIN":
      return persistReturn({ ...state, currentUserId: action.userId });
    case "LOGOUT":
      return persistReturn({ ...state, currentUserId: null });
    case "SET_DEPOT":
      return persistReturn({ ...state, depotId: action.depotId });
    case "SWITCH_ROLE_USER":
      return persistReturn({ ...state, currentUserId: action.userId });

    case "CREATE_PLAN": {
      const n = state.settings.counters.of + 1;
      const ofId = `${state.settings.ofPrefix}${pad(n)}`;
      const planId = `pl-${Date.now()}`;
      const next: AppState = {
        ...state,
        settings: { ...state.settings, counters: { ...state.settings.counters, of: n } },
        plans: [
          { id: planId, productId: action.productId, date: action.date, qty: action.qty, ofId },
          ...state.plans,
        ],
        ofList: [
          {
            id: ofId,
            planId,
            productId: action.productId,
            qtyPlanned: action.qty,
            qtyReal: 0,
            status: "planifie",
            createdAt: new Date().toISOString(),
          },
          ...state.ofList,
        ],
      };
      const sheet = state.sheets.find((s) => s.productId === action.productId && s.status === "active");
      if (sheet) {
        next.materialRequests = [
          {
            id: `dm-${Date.now()}`,
            ofId,
            status: "demandee",
            lines: [...sheet.composition, ...sheet.packaging].map((l) => ({
              materialId: l.materialId,
              qty: l.qty * action.qty,
            })),
          },
          ...next.materialRequests,
        ];
      }
      return persistReturn(audit(next, `Plan de production créé → ${ofId} généré automatiquement`));
    }

    case "START_OF":
      return persistReturn(
        audit(
          {
            ...state,
            ofList: state.ofList.map((o) => (o.id === action.ofId ? { ...o, status: "en_production" } : o)),
          },
          `OF ${action.ofId} passé en production`,
        ),
      );

    case "SAVE_TRACKING":
      return persistReturn({
        ...state,
        ofList: state.ofList.map((o) =>
          o.id === action.ofId
            ? { ...o, qtyReal: action.qtyReal, waterVolumeM3: action.waterVolumeM3 ?? o.waterVolumeM3 }
            : o,
        ),
      });

    case "ADD_LOSS":
      return persistReturn({
        ...state,
        losses: [
          { id: `loss-${Date.now()}`, ofId: action.ofId, causeId: action.causeId, qty: action.qty },
          ...state.losses,
        ],
      });

    case "VALIDATE_MATERIAL_REQUEST": {
      const req = state.materialRequests.find((r) => r.id === action.id);
      if (!req) return state;
      const stock = state.stock.map((s) => ({ ...s }));
      const movements = [...state.movements];
      req.lines.forEach((line) => {
        const idx = stock.findIndex((s) => s.articleId === line.materialId && s.depotId === "dep-mp");
        if (idx >= 0) {
          stock[idx] = { ...stock[idx], qty: stock[idx].qty - line.qty };
          movements.unshift({
            id: `mv-${Date.now()}-${line.materialId}`,
            type: "sortie",
            articleId: line.materialId,
            articleType: "matiere",
            qty: line.qty,
            depotId: "dep-mp",
            origin: `Demande matières ${req.ofId}`,
            cmup: stock[idx].cmup,
            at: new Date().toISOString(),
          });
        }
      });
      return persistReturn(
        audit(
          {
            ...state,
            stock,
            movements,
            materialRequests: state.materialRequests.map((r) => (r.id === action.id ? { ...r, status: "servie" } : r)),
          },
          `Demande matières ${req.ofId} servie par le magasin`,
        ),
      );
    }

    case "END_PRODUCTION":
      return persistReturn(
        audit(
          {
            ...state,
            ofList: state.ofList.map((o) =>
              o.id === action.ofId
                ? {
                    ...o,
                    status: "fin_production",
                    qualityResult: "en_attente",
                    yieldActual: o.qtyPlanned ? (o.qtyReal / o.qtyPlanned) * 100 : 0,
                  }
                : o,
            ),
          },
          `Fin de production ${action.ofId} — en attente clôture qualité (stock PF non alimenté)`,
        ),
      );

    case "QUALITY_CLOSE": {
      const of = state.ofList.find((o) => o.id === action.ofId);
      if (!of) return state;
      const product = state.products.find((p) => p.id === of.productId);
      const lot = of.lot ?? `L-${(product?.family ?? "PF").toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const qty = of.qtyReal || of.qtyPlanned;
      const cmup = product ? product.priceHt * 0.72 : 0;
      let stock = [...state.stock];
      const existing = stock.find((s) => s.articleId === of.productId && s.lot === lot && s.depotId === "dep-pf");
      if (existing) {
        stock = stock.map((s) => (s.id === existing.id ? { ...s, qty: s.qty + qty, cmup } : s));
      } else {
        stock = [
          {
            id: `st-${Date.now()}`,
            articleId: of.productId,
            articleType: "produit",
            depotId: "dep-pf",
            lot,
            qty,
            reserved: 0,
            cmup,
          },
          ...stock,
        ];
      }
      const nextOf: WorkOrder = {
        ...of,
        status: "cloture",
        lot,
        qualityResult: "conforme",
        cost: qty * cmup,
        yieldActual: of.qtyPlanned ? (qty / of.qtyPlanned) * 100 : of.yieldActual,
      };
      return persistReturn(
        audit(
          {
            ...state,
            stock,
            ofList: state.ofList.map((o) => (o.id === of.id ? nextOf : o)),
            movements: [
              {
                id: `mv-${Date.now()}`,
                type: "entree",
                articleId: of.productId,
                articleType: "produit",
                qty,
                depotId: "dep-pf",
                lot,
                origin: `Clôture qualité ${of.id}`,
                cmup,
                at: new Date().toISOString(),
              },
              ...state.movements,
            ],
          },
          `Clôture qualité ${of.id} — lot ${lot} entré en stock PF disponible`,
        ),
      );
    }

    case "QUALITY_BLOCK": {
      const of = state.ofList.find((o) => o.id === action.ofId);
      if (!of) return state;
      return persistReturn(
        audit(
          {
            ...state,
            ofList: state.ofList.map((o) =>
              o.id === of.id
                ? { ...o, status: "bloque", qualityResult: "non_conforme", qualityNotes: action.notes }
                : o,
            ),
          },
          `Lot ${of.lot ?? of.id} bloqué — non conforme. Aucune entrée stock PF.`,
        ),
      );
    }

    case "CREATE_ORDER": {
      const shortages: string[] = [];
      action.lines.forEach((line) => {
        const avail = productStock(state, line.productId).reduce((a, s) => a + availableQty(s.qty, s.reserved), 0);
        if (avail < line.qty) shortages.push(line.productId);
      });
      if (shortages.length) {
        return persistReturn({
          ...state,
          /* no order created — caller reads lastError via return; we encode via a dummy? */
        });
      }
      const n = state.settings.counters.fa + 1;
      const orderId = `so-${Date.now()}`;
      const number = `CD-2026-${pad(n, 5)}`;
      const invoiceId = `fa-${Date.now()}`;
      const invoiceNumber = `${state.settings.faPrefix}${pad(n)}`;
      const amount = action.lines.reduce((sum, l) => {
        const p = state.products.find((x) => x.id === l.productId);
        return sum + (p?.priceHt ?? 0) * l.qty;
      }, 0);
      let stock = state.stock.map((s) => ({ ...s }));
      action.lines.forEach((line) => {
        let remaining = line.qty;
        stock = stock.map((s) => {
          if (s.articleId !== line.productId || s.articleType !== "produit" || remaining <= 0) return s;
          const avail = availableQty(s.qty, s.reserved);
          const take = Math.min(avail, remaining);
          remaining -= take;
          return { ...s, reserved: s.reserved + take };
        });
      });
      const next: AppState = {
        ...state,
        settings: { ...state.settings, counters: { ...state.settings.counters, fa: n } },
        stock,
        orders: [
          {
            id: orderId,
            number,
            customerId: action.customerId,
            status: "a_payer",
            lines: action.lines.map((l) => ({
              ...l,
              unitPrice: state.products.find((p) => p.id === l.productId)?.priceHt ?? 0,
            })),
            createdAt: new Date().toISOString(),
            invoiceId,
            prepStatus: "a_preparer",
          },
          ...state.orders,
        ],
        invoices: [
          { id: invoiceId, number: invoiceNumber, orderId, amount, status: "a_payer", exported: false },
          ...state.invoices,
        ],
        deliveryNotes: [
          {
            id: `bl-${Date.now()}`,
            number: `${state.settings.blPrefix}${pad(state.settings.counters.bl + 1)}`,
            orderId,
            status: "verrouille",
            signed: false,
          },
          ...state.deliveryNotes,
        ],
        drafts: [
          { id: `br-${Date.now()}`, kind: "vente", ref: invoiceNumber, amount, status: "a_valider", journal: "VT" },
          ...state.drafts,
        ],
      };
      next.settings.counters.bl += 1;
      return persistReturn(audit(next, `Commande ${number} validée — stock réservé, facture ${invoiceNumber} à payer`));
    }

    case "PAY_INVOICE": {
      const invoice = state.invoices.find((i) => i.id === action.invoiceId);
      if (!invoice) return state;
      const order = state.orders.find((o) => o.id === invoice.orderId);
      if (action.success) {
        return persistReturn(
          audit(
            {
              ...state,
              invoices: state.invoices.map((i) => (i.id === invoice.id ? { ...i, status: "payee" } : i)),
              orders: state.orders.map((o) =>
                o.id === invoice.orderId ? { ...o, status: o.prepStatus === "complete" ? "preparee" : "payee", paidAt: new Date().toISOString() } : o,
              ),
              deliveryNotes: state.deliveryNotes.map((b) =>
                b.orderId === invoice.orderId && b.status === "verrouille" ? { ...b, status: "brouillon" } : b,
              ),
              payments: [
                {
                  id: `pay-${Date.now()}`,
                  invoiceId: invoice.id,
                  method: action.method,
                  amount: invoice.amount,
                  success: true,
                  at: new Date().toISOString(),
                },
                ...state.payments,
              ],
              cashSession: { ...state.cashSession, theoretical: state.cashSession.theoretical + (action.method === "especes" ? invoice.amount : 0) },
            },
            `Encaissement ${invoice.number} réussi — livraison déverrouillée`,
          ),
        );
      }
      let stock = state.stock.map((s) => ({ ...s }));
      order?.lines.forEach((line) => {
        let remaining = line.qty;
        stock = stock.map((s) => {
          if (s.articleId !== line.productId || remaining <= 0) return s;
          const take = Math.min(s.reserved, remaining);
          remaining -= take;
          return { ...s, reserved: s.reserved - take };
        });
      });
      return persistReturn(
        audit(
          {
            ...state,
            stock,
            invoices: state.invoices.map((i) =>
              i.id === invoice.id ? { ...i, status: "suspendue", suspendReason: action.reason } : i,
            ),
            orders: state.orders.map((o) =>
              o.id === invoice.orderId ? { ...o, status: "suspendue", suspendReason: action.reason } : o,
            ),
            drafts: state.drafts.map((d) => (d.ref === invoice.number ? { ...d, status: "exclu" } : d)),
            payments: [
              {
                id: `pay-${Date.now()}`,
                invoiceId: invoice.id,
                method: action.method,
                amount: invoice.amount,
                success: false,
                at: new Date().toISOString(),
              },
              ...state.payments,
            ],
          },
          `Facture ${invoice.number} suspendue (${action.reason}). Stock réservé libéré. Non exportable Sage.`,
        ),
      );
    }

    case "PREPARE_ORDER":
      return persistReturn({
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                prepStatus: action.status,
                status: o.status === "payee" && action.status === "complete" ? "preparee" : o.status,
              }
            : o,
        ),
      });

    case "VALIDATE_BL": {
      const order = state.orders.find((o) => o.id === action.orderId);
      const invoice = state.invoices.find((i) => i.id === order?.invoiceId);
      if (!order || invoice?.status !== "payee") return state;
      return persistReturn(
        audit(
          {
            ...state,
            deliveryNotes: state.deliveryNotes.map((b) => (b.orderId === order.id ? { ...b, status: "valide" } : b)),
          },
          `BL validé pour ${order.number}`,
        ),
      );
    }

    case "DELIVER": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      let stock = state.stock.map((s) => ({ ...s }));
      order.lines.forEach((line) => {
        let remaining = line.qty;
        stock = stock.map((s) => {
          if (s.articleId !== line.productId || remaining <= 0) return s;
          const take = Math.min(s.reserved, remaining);
          remaining -= take;
          return { ...s, qty: s.qty - take, reserved: s.reserved - take };
        });
      });
      return persistReturn(
        audit(
          {
            ...state,
            stock,
            orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: "livree" } : o)),
            deliveryNotes: state.deliveryNotes.map((b) =>
              b.orderId === order.id ? { ...b, status: "livre", signed: true, proof: true } : b,
            ),
          },
          `Livraison ${order.number} — signature et preuve enregistrées`,
        ),
      );
    }

    case "VALIDATE_DA":
      return persistReturn({
        ...state,
        purchaseRequests: state.purchaseRequests.map((d) => (d.id === action.id ? { ...d, status: "validee" } : d)),
      });

    case "COUNT_INVENTORY":
      return persistReturn({
        ...state,
        inventories: state.inventories.map((inv) =>
          inv.id === action.id
            ? {
                ...inv,
                status: "compte",
                lines: inv.lines.map((l) => ({ ...l, physical: action.counts[l.articleId] ?? l.theoretical })),
              }
            : inv,
        ),
      });

    case "VALIDATE_INVENTORY": {
      const inv = state.inventories.find((i) => i.id === action.id);
      if (!inv) return state;
      const stock = state.stock.map((s) => ({ ...s }));
      inv.lines.forEach((l) => {
        if (l.physical == null) return;
        const idx = stock.findIndex((s) => s.articleId === l.articleId && s.depotId === inv.depotId);
        if (idx >= 0) stock[idx] = { ...stock[idx], qty: l.physical };
      });
      return persistReturn(
        audit(
          {
            ...state,
            stock,
            inventories: state.inventories.map((i) => (i.id === action.id ? { ...i, status: "valide" } : i)),
          },
          `Inventaire ${inv.id} validé — ajustements stock`,
        ),
      );
    }

    case "VALIDATE_DRAFT":
      return persistReturn({
        ...state,
        drafts: state.drafts.map((d) => (d.id === action.id && d.status !== "exclu" ? { ...d, status: "valide" } : d)),
      });

    case "EXPORT_SAGE":
      return persistReturn(
        audit(
          {
            ...state,
            drafts: state.drafts.map((d) => (d.status === "valide" ? { ...d, status: "exporte" } : d)),
            invoices: state.invoices.map((i) =>
              i.status === "payee" && state.drafts.some((d) => d.ref === i.number && d.status === "valide")
                ? { ...i, exported: true }
                : i,
            ),
          },
          "Export Sage 100 — factures suspendues exclues",
        ),
      );

    case "CLOSE_CASH":
      return persistReturn(
        audit(
          {
            ...state,
            cashSession: {
              open: false,
              theoretical: state.cashSession.theoretical,
              counted: action.counted,
              closedAt: new Date().toISOString(),
            },
          },
          `Clôture caisse — théorique ${state.cashSession.theoretical} / réel ${action.counted}`,
        ),
      );

    case "DECIDE_CLAIM":
      return persistReturn({
        ...state,
        claims: state.claims.map((c) => (c.id === action.id ? { ...c, status: action.status } : c)),
      });

    default:
      return state;
  }
}

function persistReturn(state: AppState) {
  persist(state);
  return state;
}

type Store = {
  state: AppState;
  currentUser: AppState["users"][number] | null;
  role: Role | null;
  dispatch: React.Dispatch<Action>;
  productName: (id: string) => string;
  materialName: (id: string) => string;
  customerName: (id: string) => string;
  availableFor: (productId: string) => number;
  canCreateOrder: (lines: { productId: string; qty: number }[]) => { ok: boolean; missing: { productId: string; need: number; available: number }[] };
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedState);

  useEffect(() => {
    dispatch({ type: "HYDRATE", state: loadState() });
  }, []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const productName = useCallback(
    (id: string) => state.products.find((p) => p.id === id)?.name ?? id,
    [state.products],
  );
  const materialName = useCallback(
    (id: string) => state.materials.find((m) => m.id === id)?.name ?? id,
    [state.materials],
  );
  const customerName = useCallback(
    (id: string) => state.customers.find((c) => c.id === id)?.name ?? id,
    [state.customers],
  );
  const availableFor = useCallback(
    (productId: string) =>
      state.stock
        .filter((s) => s.articleId === productId && s.articleType === "produit")
        .reduce((a, s) => a + availableQty(s.qty, s.reserved), 0),
    [state.stock],
  );
  const canCreateOrder = useCallback(
    (lines: { productId: string; qty: number }[]) => {
      const missing = lines
        .map((l) => {
          const available = availableFor(l.productId);
          return { productId: l.productId, need: l.qty, available };
        })
        .filter((m) => m.need > m.available);
      return { ok: missing.length === 0, missing };
    },
    [availableFor],
  );

  const value = useMemo<Store>(
    () => ({
      state,
      currentUser,
      role: currentUser?.role ?? null,
      dispatch,
      productName,
      materialName,
      customerName,
      availableFor,
      canCreateOrder,
    }),
    [state, currentUser, productName, materialName, customerName, availableFor, canCreateOrder],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
