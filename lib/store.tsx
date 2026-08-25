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
import {
  ACTIONS,
  MP_DEPOT,
  PF_DEPOT,
  QUARANTINE_DEPOT,
  adjustLine,
  canAct,
  deny,
  inbound,
  materialAvail,
  ofUnitCost,
  outbound,
  releaseReserved,
  reserveSellable,
  sellableQty,
  transferStock,
  unitPriceForCustomer,
  type ActionName,
} from "./engine";
import { canEditParam as roleCanEditParam } from "./roles";
import { seedState } from "./seed";
import type {
  AppState,
  Customer,
  Material,
  PaymentMethod,
  PrepStatus,
  Product,
  Role,
  Supplier,
  TechnicalSheet,
  WorkOrder,
} from "./types";
import { pad } from "./utils";

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "SET_DEPOT"; depotId: string }
  | { type: "SWITCH_ROLE_USER"; userId: string }
  | { type: "CLEAR_ERROR" }
  | { type: "CREATE_PLAN"; productId: string; date: string; qty: number }
  | { type: "START_OF"; ofId: string }
  | { type: "SAVE_TRACKING"; ofId: string; qtyReal: number; waterVolumeM3?: number; incidents?: string }
  | { type: "ADD_LOSS"; ofId: string; causeId: string; qty: number }
  | { type: "ACK_MATERIAL_REQUEST"; id: string }
  | { type: "SERVE_MATERIAL_REQUEST"; id: string }
  | { type: "VALIDATE_MATERIAL_REQUEST"; id: string }
  | { type: "END_PRODUCTION"; ofId: string }
  | { type: "QUALITY_CLOSE"; ofId: string }
  | { type: "QUALITY_BLOCK"; ofId: string; notes: string }
  | { type: "CREATE_ORDER"; customerId: string; lines: { productId: string; qty: number }[] }
  | { type: "PAY_INVOICE"; invoiceId: string; method: PaymentMethod; success: boolean; reason?: string }
  | { type: "PREPARE_ORDER"; orderId: string; status: PrepStatus }
  | { type: "VALIDATE_BL"; orderId: string }
  | { type: "DELIVER"; orderId: string }
  | { type: "CREATE_DA"; materialId: string; qty: number; reason: string }
  | { type: "SUBMIT_DA"; id: string }
  | { type: "VALIDATE_DA"; id: string }
  | { type: "REFUSE_DA"; id: string }
  | { type: "CREATE_PO"; daId: string; supplierId: string }
  | { type: "CREATE_RECEPTION"; poId: string; received: Record<string, number> }
  | { type: "CONFIRM_RECEPTION"; id: string }
  | { type: "COUNT_INVENTORY"; id: string; counts: Record<string, number> }
  | { type: "VALIDATE_INVENTORY"; id: string }
  | { type: "OPEN_INVENTORY"; depotId: string }
  | { type: "TRANSFER_STOCK"; articleId: string; articleType: "produit" | "matiere"; fromDepotId: string; toDepotId: string; qty: number; lot?: string }
  | { type: "VALIDATE_DRAFT"; id: string }
  | { type: "EXPORT_SAGE" }
  | { type: "CLOSE_CASH"; counted: number }
  | { type: "DECIDE_CLAIM"; id: string; status: "acceptee" | "rejetee" | "quarantaine" }
  | { type: "CREATE_CLAIM"; orderId: string; motifId: string; notes: string; lot?: string }
  | { type: "TOGGLE_USER"; id: string }
  | { type: "CREATE_USER"; name: string; email: string; role: Role }
  | { type: "UPDATE_SETTINGS"; patch: Partial<AppState["settings"]> }
  | { type: "UPDATE_SAGE"; patch: Partial<AppState["sageMapping"]> }
  | { type: "UPSERT_PRODUCT"; product: Product }
  | { type: "UPSERT_MATERIAL"; material: Material }
  | { type: "UPSERT_CUSTOMER"; customer: Customer }
  | { type: "UPSERT_SUPPLIER"; supplier: Supplier }
  | { type: "UPSERT_TARIFF"; tariff: AppState["tariffs"][number] }
  | { type: "SET_THRESHOLD"; articleType: "produit" | "matiere"; id: string; minStock: number }
  | { type: "ADD_LOSS_CAUSE"; label: string }
  | { type: "ADD_SUSPEND_REASON"; label: string }
  | { type: "ADD_CLAIM_REASON"; label: string }
  | { type: "ADD_UNIT"; code: string; label: string }
  | { type: "ADD_DEPOT"; code: string; name: string; kind: AppState["depots"][number]["kind"] }
  | { type: "UPDATE_SHEET"; sheet: TechnicalSheet }
  | { type: "ACTIVATE_SHEET"; id: string }
  | { type: "SET_CUSTOMER_PAYMENTS"; customerId: string; methods: PaymentMethod[] };

const STORAGE_KEY = "evam-maquette-state-v3";

function mergeHydrate(raw: Partial<AppState>): AppState {
  const base = seedState();
  return {
    ...base,
    ...raw,
    settings: {
      ...base.settings,
      ...(raw.settings ?? {}),
      counters: { ...base.settings.counters, ...(raw.settings?.counters ?? {}) },
    },
    tariffs: raw.tariffs?.length ? raw.tariffs : base.tariffs,
    units: raw.units?.length ? raw.units : base.units,
    lastError: raw.lastError ?? null,
  };
}

function loadState(): AppState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    return mergeHydrate(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return seedState();
  }
}

function persist(state: AppState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistReturn(state: AppState) {
  persist(state);
  return state;
}

function fail(state: AppState, message: string) {
  return persistReturn({ ...state, lastError: message });
}

function audit(state: AppState, action: string): AppState {
  const user = state.users.find((u) => u.id === state.currentUserId);
  return {
    ...state,
    lastError: null,
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

function gated(state: AppState, action: ActionName, run: () => AppState): AppState {
  const err = deny(state, [...ACTIONS[action]]);
  if (err) return fail(state, err);
  return run();
}

function paramGate(state: AppState, href: string, run: () => AppState): AppState {
  const role = state.users.find((u) => u.id === state.currentUserId)?.role ?? null;
  if (!roleCanEditParam(role, href)) return fail(state, "Ce référentiel n'est pas dans votre périmètre.");
  return run();
}

function lotCode(state: AppState, productId: string, existing?: string) {
  if (existing) return existing;
  const product = state.products.find((p) => p.id === productId);
  const fam = (product?.family ?? "pf").toUpperCase().slice(0, 3);
  const d = new Date();
  const jjmm = `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return state.settings.lotFormat.replace("{FAMILLE}", fam).replace("{JJMM}", jjmm);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "LOGIN": {
      const user = state.users.find((u) => u.id === action.userId);
      if (!user?.active) return fail(state, "Compte inactif — connexion refusée.");
      return persistReturn({ ...state, currentUserId: action.userId, lastError: null });
    }
    case "LOGOUT":
      return persistReturn({ ...state, currentUserId: null, lastError: null });
    case "SET_DEPOT":
      return persistReturn({ ...state, depotId: action.depotId });
    case "SWITCH_ROLE_USER": {
      const user = state.users.find((u) => u.id === action.userId);
      if (!user?.active) return fail(state, "Compte inactif.");
      return persistReturn({ ...state, currentUserId: action.userId, lastError: null });
    }
    case "CLEAR_ERROR":
      return persistReturn({ ...state, lastError: null });

    case "CREATE_PLAN":
      return gated(state, "CREATE_PLAN", () => {
        if (!action.qty || action.qty <= 0) return fail(state, "La quantité du plan doit être strictement positive.");
        const product = state.products.find((p) => p.id === action.productId && p.active);
        if (!product) return fail(state, "Produit inactif ou introuvable — un plan ne vise qu'un produit planifiable.");
        const n = state.settings.counters.of + 1;
        const ofId = `${state.settings.ofPrefix}${pad(n)}`;
        const planId = `pl-${Date.now()}`;
        const next: AppState = {
          ...state,
          settings: { ...state.settings, counters: { ...state.settings.counters, of: n } },
          plans: [{ id: planId, productId: action.productId, date: action.date, qty: action.qty, ofId }, ...state.plans],
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
      });

    case "START_OF":
      return gated(state, "START_OF", () => {
        const of = state.ofList.find((o) => o.id === action.ofId);
        if (!of || of.status !== "planifie") return fail(state, "Seul un OF planifié peut passer en production.");
        return persistReturn(
          audit(
            { ...state, ofList: state.ofList.map((o) => (o.id === of.id ? { ...o, status: "en_production" } : o)) },
            `OF ${of.id} passé en production`,
          ),
        );
      });

    case "SAVE_TRACKING":
      return gated(state, "SAVE_TRACKING", () => {
        const of = state.ofList.find((o) => o.id === action.ofId);
        if (!of || of.status !== "en_production") return fail(state, "Le réel ne se saisit que sur un OF en production.");
        return persistReturn({
          ...state,
          lastError: null,
          ofList: state.ofList.map((o) =>
            o.id === of.id
              ? {
                  ...o,
                  qtyReal: action.qtyReal,
                  waterVolumeM3: action.waterVolumeM3 ?? o.waterVolumeM3,
                  incidents: action.incidents ?? o.incidents,
                }
              : o,
          ),
        });
      });

    case "ADD_LOSS":
      return gated(state, "ADD_LOSS", () => {
        const of = state.ofList.find((o) => o.id === action.ofId);
        if (!of || !["en_production", "fin_production"].includes(of.status)) {
          return fail(state, "Les pertes se saisissent sur un OF en cours ou en fin de production.");
        }
        if (!state.lossCauses.some((c) => c.id === action.causeId)) return fail(state, "Cause de perte hors liste paramétrée.");
        return persistReturn(
          audit(
            {
              ...state,
              losses: [{ id: `loss-${Date.now()}`, ofId: of.id, causeId: action.causeId, qty: action.qty, lot: of.lot }, ...state.losses],
            },
            `Perte ${action.qty} saisie sur ${of.id}`,
          ),
        );
      });

    case "ACK_MATERIAL_REQUEST":
      return gated(state, "ACK_MATERIAL_REQUEST", () => {
        const req = state.materialRequests.find((r) => r.id === action.id);
        if (!req || req.status !== "demandee") return fail(state, "Cette demande n'est plus à valider.");
        return persistReturn(
          audit(
            {
              ...state,
              materialRequests: state.materialRequests.map((r) => (r.id === req.id ? { ...r, status: "validee" } : r)),
            },
            `Demande matières ${req.ofId} validée magasin — en attente de sortie`,
          ),
        );
      });

    case "VALIDATE_MATERIAL_REQUEST":
    case "SERVE_MATERIAL_REQUEST":
      return gated(state, "SERVE_MATERIAL_REQUEST", () => {
        const req = state.materialRequests.find((r) => r.id === action.id);
        if (!req) return fail(state, "Demande introuvable.");
        if (req.status === "servie") return fail(state, "Cette demande a déjà été servie.");
        if (req.status === "demandee") return fail(state, "Validez d'abord la demande magasin avant la sortie.");
        for (const line of req.lines) {
          const avail = materialAvail(state, line.materialId);
          if (avail < line.qty) {
            return fail(state, `Stock matières insuffisant pour servir ${req.ofId} (besoin ${line.qty}, dispo ${avail}).`);
          }
        }
        let stock = state.stock.map((s) => ({ ...s }));
        let movements = [...state.movements];
        for (const line of req.lines) {
          const out = outbound(stock, movements, {
            articleId: line.materialId,
            articleType: "matiere",
            depotId: MP_DEPOT,
            qty: line.qty,
            origin: `Demande matières ${req.ofId}`,
          });
          if (!out.ok) return fail(state, `Sortie impossible — stock insuffisant (dispo ${out.available}).`);
          stock = out.stock;
          movements = out.movements;
        }
        return persistReturn(
          audit(
            {
              ...state,
              stock,
              movements,
              materialRequests: state.materialRequests.map((r) => (r.id === req.id ? { ...r, status: "servie" } : r)),
            },
            `Demande matières ${req.ofId} servie — sortie magasin`,
          ),
        );
      });

    case "END_PRODUCTION":
      return gated(state, "END_PRODUCTION", () => {
        const of = state.ofList.find((o) => o.id === action.ofId);
        if (!of || of.status !== "en_production") return fail(state, "La fin de production ne s'applique qu'à un OF en production.");
        if (!of.qtyReal) return fail(state, "Saisissez le réel atelier avant de valider la fin de production.");
        return persistReturn(
          audit(
            {
              ...state,
              ofList: state.ofList.map((o) =>
                o.id === of.id
                  ? {
                      ...o,
                      status: "fin_production",
                      qualityResult: "en_attente",
                      yieldActual: of.qtyPlanned ? (of.qtyReal / of.qtyPlanned) * 100 : 0,
                    }
                  : o,
              ),
            },
            `Fin de production ${of.id} — en attente clôture qualité (stock PF non alimenté)`,
          ),
        );
      });

    case "QUALITY_CLOSE":
      return gated(state, "QUALITY_CLOSE", () => {
        const of = state.ofList.find((o) => o.id === action.ofId);
        if (!of || !["fin_production", "controle_qualite"].includes(of.status)) {
          return fail(state, "La clôture qualité suit obligatoirement la fin de production.");
        }
        const qty = of.qtyReal || of.qtyPlanned;
        const unitCost = ofUnitCost(state, of.productId);
        const lot = lotCode(state, of.productId, of.lot);
        const entered = inbound(state.stock, state.movements, state.materials, {
          articleId: of.productId,
          articleType: "produit",
          depotId: PF_DEPOT,
          qty,
          unitCost,
          lot,
          origin: `Clôture qualité ${of.id}`,
        });
        const nextOf: WorkOrder = {
          ...of,
          status: "cloture",
          lot,
          qualityResult: "conforme",
          cost: qty * unitCost,
          yieldActual: of.qtyPlanned ? (qty / of.qtyPlanned) * 100 : of.yieldActual,
        };
        return persistReturn(
          audit(
            {
              ...state,
              stock: entered.stock,
              movements: entered.movements,
              materials: entered.materials,
              ofList: state.ofList.map((o) => (o.id === of.id ? nextOf : o)),
            },
            `Clôture qualité ${of.id} — lot ${lot} entré en stock PF (CMUP ${unitCost.toFixed(2)})`,
          ),
        );
      });

    case "QUALITY_BLOCK":
      return gated(state, "QUALITY_BLOCK", () => {
        const of = state.ofList.find((o) => o.id === action.ofId);
        if (!of || !["fin_production", "controle_qualite"].includes(of.status)) {
          return fail(state, "Le blocage qualité suit la fin de production.");
        }
        const qty = of.qtyReal || of.qtyPlanned;
        const unitCost = ofUnitCost(state, of.productId);
        const lot = lotCode(state, of.productId, of.lot);
        const entered = inbound(state.stock, state.movements, state.materials, {
          articleId: of.productId,
          articleType: "produit",
          depotId: QUARANTINE_DEPOT,
          qty,
          unitCost,
          lot,
          origin: `Blocage qualité ${of.id}`,
        });
        return persistReturn(
          audit(
            {
              ...state,
              stock: entered.stock,
              movements: entered.movements,
              ofList: state.ofList.map((o) =>
                o.id === of.id
                  ? { ...o, status: "bloque", lot, qualityResult: "non_conforme", qualityNotes: action.notes }
                  : o,
              ),
            },
            `Lot ${lot} bloqué — entrée quarantaine, aucune entrée stock PF`,
          ),
        );
      });

    case "CREATE_ORDER":
      return gated(state, "CREATE_ORDER", () => {
        const customer = state.customers.find((c) => c.id === action.customerId);
        if (!customer) return fail(state, "Client introuvable.");
        for (const line of action.lines) {
          const avail = sellableQty(state, line.productId);
          if (avail < line.qty) {
            return fail(
              state,
              `StockGuard : disponible insuffisant (demandé ${line.qty}, vendable ${avail}). Aucune commande créée.`,
            );
          }
        }
        const n = state.settings.counters.fa + 1;
        const orderId = `so-${Date.now()}`;
        const number = `CD-${state.settings.exercice}-${pad(n, 5)}`;
        const invoiceId = `fa-${Date.now()}`;
        const invoiceNumber = `${state.settings.faPrefix}${pad(n)}`;
        const priced = action.lines.map((l) => ({
          ...l,
          unitPrice: unitPriceForCustomer(state, customer.id, l.productId),
        }));
        const amount = priced.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
        let stock = state.stock.map((s) => ({ ...s }));
        for (const line of priced) {
          const reserved = reserveSellable(stock, line.productId, line.qty);
          if (!reserved.ok) return fail(state, "Stock vendable insuffisant au moment de la réservation.");
          stock = reserved.stock;
        }
        const blN = state.settings.counters.bl + 1;
        const next: AppState = {
          ...state,
          settings: { ...state.settings, counters: { ...state.settings.counters, fa: n, bl: blN } },
          stock,
          orders: [
            {
              id: orderId,
              number,
              customerId: customer.id,
              status: "a_payer",
              lines: priced,
              createdAt: new Date().toISOString(),
              invoiceId,
              prepStatus: "a_preparer",
            },
            ...state.orders,
          ],
          invoices: [{ id: invoiceId, number: invoiceNumber, orderId, amount, status: "a_payer", exported: false }, ...state.invoices],
          deliveryNotes: [
            {
              id: `bl-${Date.now()}`,
              number: `${state.settings.blPrefix}${pad(blN)}`,
              orderId,
              status: "verrouille",
              signed: false,
            },
            ...state.deliveryNotes,
          ],
          drafts: [
            { id: `br-${Date.now()}`, kind: "vente", ref: invoiceNumber, amount, status: "a_valider", journal: state.sageMapping.journalVente },
            ...state.drafts,
          ],
        };
        return persistReturn(audit(next, `Commande ${number} validée — stock PF réservé, facture ${invoiceNumber} à payer`));
      });

    case "PAY_INVOICE":
      return gated(state, "PAY_INVOICE", () => {
        const invoice = state.invoices.find((i) => i.id === action.invoiceId);
        if (!invoice || invoice.status !== "a_payer") return fail(state, "Cette facture n'est plus à encaisser.");
        const order = state.orders.find((o) => o.id === invoice.orderId);
        const customer = state.customers.find((c) => c.id === order?.customerId);
        if (customer && !customer.paymentMethods.includes(action.method)) {
          return fail(state, "Moyen d'encaissement non autorisé pour ce type de client.");
        }
        if (action.success) {
          return persistReturn(
            audit(
              {
                ...state,
                invoices: state.invoices.map((i) => (i.id === invoice.id ? { ...i, status: "payee" } : i)),
                orders: state.orders.map((o) =>
                  o.id === invoice.orderId
                    ? { ...o, status: o.prepStatus === "complete" ? "preparee" : "payee", paidAt: new Date().toISOString() }
                    : o,
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
                cashSession: {
                  ...state.cashSession,
                  theoretical: state.cashSession.theoretical + (action.method === "especes" ? invoice.amount : 0),
                },
              },
              `Encaissement ${invoice.number} réussi — livraison déverrouillée`,
            ),
          );
        }
        if (!action.reason) return fail(state, "Un motif de suspension est obligatoire.");
        let stock = state.stock.map((s) => ({ ...s }));
        order?.lines.forEach((line) => {
          stock = releaseReserved(stock, line.productId, line.qty);
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
                o.id === invoice.orderId ? { ...o, status: "annulee", suspendReason: action.reason } : o,
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
            `Échec paiement ${invoice.number} — commande annulée, facture suspendue (${action.reason}), stock libéré, hors Sage`,
          ),
        );
      });

    case "PREPARE_ORDER":
      return gated(state, "PREPARE_ORDER", () => {
        const order = state.orders.find((o) => o.id === action.orderId);
        if (!order || order.status === "annulee") return fail(state, "Impossible de préparer une commande annulée.");
        if (!["a_payer", "payee", "preparee"].includes(order.status) && order.status !== "creee") {
          if (order.status === "livree") return fail(state, "Commande déjà livrée.");
        }
        return persistReturn(
          audit(
            {
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
            },
            `Préparation ${order.number} : ${action.status}`,
          ),
        );
      });

    case "VALIDATE_BL":
      return gated(state, "VALIDATE_BL", () => {
        const order = state.orders.find((o) => o.id === action.orderId);
        const invoice = state.invoices.find((i) => i.id === order?.invoiceId);
        if (!order) return fail(state, "Commande introuvable.");
        if (invoice?.status !== "payee") return fail(state, "PaymentGuard : le BL reste verrouillé tant que la facture n'est pas payée.");
        return persistReturn(
          audit(
            {
              ...state,
              deliveryNotes: state.deliveryNotes.map((b) => (b.orderId === order.id ? { ...b, status: "valide" } : b)),
            },
            `BL validé pour ${order.number}`,
          ),
        );
      });

    case "DELIVER":
      return gated(state, "DELIVER", () => {
        const order = state.orders.find((o) => o.id === action.orderId);
        const invoice = state.invoices.find((i) => i.id === order?.invoiceId);
        const bl = state.deliveryNotes.find((b) => b.orderId === action.orderId);
        if (!order) return fail(state, "Commande introuvable.");
        if (invoice?.status !== "payee") return fail(state, "Livraison interdite : facture non payée.");
        if (bl && bl.status !== "valide" && bl.status !== "brouillon") {
          return fail(state, "Validez le BL avant de livrer.");
        }
        let stock = state.stock.map((s) => ({ ...s }));
        let movements = [...state.movements];
        for (const line of order.lines) {
          const out = outbound(stock, movements, {
            articleId: line.productId,
            articleType: "produit",
            depotId: PF_DEPOT,
            qty: line.qty,
            origin: `Livraison ${order.number}`,
            consumeReserved: true,
          });
          if (!out.ok) return fail(state, "Stock réservé insuffisant pour solder la livraison.");
          stock = out.stock;
          movements = out.movements;
        }
        return persistReturn(
          audit(
            {
              ...state,
              stock,
              movements,
              orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: "livree" } : o)),
              deliveryNotes: state.deliveryNotes.map((b) =>
                b.orderId === order.id ? { ...b, status: "livre", signed: true, proof: true } : b,
              ),
            },
            `Livraison ${order.number} — signature et preuve. Stock réservé consommé.`,
          ),
        );
      });

    case "CREATE_DA":
      return gated(state, "CREATE_DA", () => {
        const n = state.settings.counters.da + 1;
        const da = {
          id: `da-${Date.now()}`,
          number: `${state.settings.daPrefix}${pad(n)}`,
          status: "soumise" as const,
          materialId: action.materialId,
          qty: action.qty,
          reason: action.reason,
        };
        return persistReturn(
          audit(
            {
              ...state,
              settings: { ...state.settings, counters: { ...state.settings.counters, da: n } },
              purchaseRequests: [da, ...state.purchaseRequests],
            },
            `DA ${da.number} créée et soumise`,
          ),
        );
      });

    case "SUBMIT_DA":
      return gated(state, "SUBMIT_DA", () => {
        const da = state.purchaseRequests.find((d) => d.id === action.id);
        if (!da || da.status !== "brouillon") return fail(state, "Seule une DA brouillon peut être soumise.");
        return persistReturn({
          ...state,
          lastError: null,
          purchaseRequests: state.purchaseRequests.map((d) => (d.id === da.id ? { ...d, status: "soumise" } : d)),
        });
      });

    case "VALIDATE_DA":
      return gated(state, "VALIDATE_DA", () => {
        const da = state.purchaseRequests.find((d) => d.id === action.id);
        if (!da || da.status !== "soumise") return fail(state, "Cette DA n'est pas en attente de validation.");
        return persistReturn(
          audit(
            {
              ...state,
              purchaseRequests: state.purchaseRequests.map((d) => (d.id === da.id ? { ...d, status: "validee" } : d)),
            },
            `DA ${da.number} validée — prête à devenir commande fournisseur`,
          ),
        );
      });

    case "REFUSE_DA":
      return gated(state, "REFUSE_DA", () => {
        const da = state.purchaseRequests.find((d) => d.id === action.id);
        if (!da || da.status !== "soumise") return fail(state, "Cette DA ne peut plus être refusée.");
        return persistReturn(
          audit(
            {
              ...state,
              purchaseRequests: state.purchaseRequests.map((d) => (d.id === da.id ? { ...d, status: "refusee" } : d)),
            },
            `DA ${da.number} refusée`,
          ),
        );
      });

    case "CREATE_PO":
      return gated(state, "CREATE_PO", () => {
        const da = state.purchaseRequests.find((d) => d.id === action.daId);
        if (!da || da.status !== "validee") return fail(state, "Une commande fournisseur naît uniquement d'une DA validée.");
        if (state.purchaseOrders.some((p) => p.daId === da.id)) return fail(state, "Cette DA a déjà une commande fournisseur.");
        const mat = state.materials.find((m) => m.id === da.materialId);
        const n = state.settings.counters.cf + 1;
        const amount = da.qty * (mat?.cmup ?? 0);
        const po = {
          id: `cf-${Date.now()}`,
          number: `${state.settings.cfPrefix}${pad(n)}`,
          supplierId: action.supplierId,
          daId: da.id,
          status: "envoyee" as const,
          lines: [{ materialId: da.materialId, qty: da.qty, unitPrice: mat?.cmup ?? 0 }],
          amount,
          invoiceNumber: `FA-ACH-${state.settings.exercice}-${pad(n)}`,
        };
        return persistReturn(
          audit(
            {
              ...state,
              settings: { ...state.settings, counters: { ...state.settings.counters, cf: n } },
              purchaseOrders: [po, ...state.purchaseOrders],
            },
            `Commande fournisseur ${po.number} émise depuis ${da.number}`,
          ),
        );
      });

    case "CREATE_RECEPTION":
      return gated(state, "CREATE_RECEPTION", () => {
        const po = state.purchaseOrders.find((p) => p.id === action.poId);
        if (!po) return fail(state, "Commande fournisseur introuvable.");
        const lines = po.lines.map((l) => ({
          materialId: l.materialId,
          ordered: l.qty,
          received: action.received[l.materialId] ?? 0,
        }));
        const hasGap = lines.some((l) => l.received !== l.ordered);
        const n = state.settings.counters.rc + 1;
        const rec = {
          id: `rc-${Date.now()}`,
          number: `RC-${state.settings.exercice}-${pad(n)}`,
          poId: po.id,
          status: (hasGap ? "ecart" : "en_cours") as AppState["receptions"][number]["status"],
          lines,
          stockEntered: false,
        };
        return persistReturn(
          audit(
            {
              ...state,
              settings: { ...state.settings, counters: { ...state.settings.counters, rc: n } },
              receptions: [rec, ...state.receptions],
            },
            `Réception ${rec.number} créée${hasGap ? " avec écart" : ""} — stock non encore alimenté`,
          ),
        );
      });

    case "CONFIRM_RECEPTION":
      return gated(state, "CONFIRM_RECEPTION", () => {
        const rec = state.receptions.find((r) => r.id === action.id);
        if (!rec) return fail(state, "Réception introuvable.");
        if (rec.stockEntered) return fail(state, "Cette réception a déjà alimenté le stock matières.");
        const po = state.purchaseOrders.find((p) => p.id === rec.poId);
        let stock = state.stock.map((s) => ({ ...s }));
        let movements = [...state.movements];
        let materials = state.materials.map((m) => ({ ...m }));
        let amount = 0;
        for (const line of rec.lines) {
          if (line.received <= 0) continue;
          const poLine = po?.lines.find((l) => l.materialId === line.materialId);
          const unitCost = poLine?.unitPrice ?? materials.find((m) => m.id === line.materialId)?.cmup ?? 0;
          amount += line.received * unitCost;
          const entered = inbound(stock, movements, materials, {
            articleId: line.materialId,
            articleType: "matiere",
            depotId: MP_DEPOT,
            qty: line.received,
            unitCost,
            origin: `Réception ${rec.number}`,
          });
          stock = entered.stock;
          movements = entered.movements;
          materials = entered.materials;
        }
        const fullyReceived = rec.lines.every((l) => l.received >= l.ordered);
        const next: AppState = {
          ...state,
          stock,
          movements,
          materials,
          receptions: state.receptions.map((r) =>
            r.id === rec.id ? { ...r, status: "close", stockEntered: true } : r,
          ),
          purchaseOrders: state.purchaseOrders.map((p) =>
            p.id === rec.poId ? { ...p, status: fullyReceived ? "recue" : "partielle" } : p,
          ),
          drafts: [
            {
              id: `br-ach-${Date.now()}`,
              kind: "achat",
              ref: po?.invoiceNumber ?? rec.number,
              amount,
              status: "a_valider",
              journal: state.sageMapping.journalAchat,
            },
            ...state.drafts,
          ],
        };
        return persistReturn(audit(next, `Réception ${rec.number} entrée en stock matières (qté reçue). Brouillard achat généré.`));
      });

    case "COUNT_INVENTORY":
      return gated(state, "COUNT_INVENTORY", () => {
        const inv = state.inventories.find((i) => i.id === action.id);
        if (!inv || inv.status !== "ouvert") return fail(state, "Comptage déjà clôturé.");
        return persistReturn({
          ...state,
          lastError: null,
          inventories: state.inventories.map((i) =>
            i.id === inv.id
              ? {
                  ...i,
                  status: "compte",
                  lines: i.lines.map((l) => ({ ...l, physical: action.counts[l.articleId] ?? l.theoretical })),
                }
              : i,
          ),
        });
      });

    case "VALIDATE_INVENTORY":
      return gated(state, "VALIDATE_INVENTORY", () => {
        const inv = state.inventories.find((i) => i.id === action.id);
        if (!inv || inv.status !== "compte") return fail(state, "Validez un inventaire déjà compté.");
        let stock = state.stock.map((s) => ({ ...s }));
        let movements = [...state.movements];
        inv.lines.forEach((l) => {
          if (l.physical == null) return;
          const adj = adjustLine(stock, movements, {
            articleId: l.articleId,
            depotId: inv.depotId,
            physical: l.physical,
            origin: `Inventaire ${inv.id}`,
          });
          stock = adj.stock;
          movements = adj.movements;
        });
        return persistReturn(
          audit(
            {
              ...state,
              stock,
              movements,
              inventories: state.inventories.map((i) => (i.id === inv.id ? { ...i, status: "valide" } : i)),
            },
            `Inventaire ${inv.id} validé — écritures d'ajustement`,
          ),
        );
      });

    case "OPEN_INVENTORY":
      return gated(state, "OPEN_INVENTORY", () => {
        const lines = state.stock
          .filter((s) => s.depotId === action.depotId)
          .reduce<{ articleId: string; theoretical: number }[]>((acc, s) => {
            const existing = acc.find((l) => l.articleId === s.articleId);
            if (existing) existing.theoretical += s.qty;
            else acc.push({ articleId: s.articleId, theoretical: s.qty });
            return acc;
          }, []);
        const inv = {
          id: `inv-${Date.now()}`,
          depotId: action.depotId,
          status: "ouvert" as const,
          date: new Date().toISOString().slice(0, 10),
          lines,
        };
        return persistReturn(audit({ ...state, inventories: [inv, ...state.inventories] }, `Session d'inventaire ${inv.id} ouverte`));
      });

    case "TRANSFER_STOCK":
      return gated(state, "TRANSFER_STOCK", () => {
        if (action.fromDepotId === action.toDepotId) return fail(state, "Un transfert change de dépôt.");
        const result = transferStock(state.stock, state.movements, state.materials, {
          articleId: action.articleId,
          articleType: action.articleType,
          fromDepotId: action.fromDepotId,
          toDepotId: action.toDepotId,
          qty: action.qty,
          origin: "Transfert magasin",
          lot: action.lot,
        });
        if (!result.ok) return fail(state, result.message);
        return persistReturn(
          audit(
            { ...state, stock: result.stock, movements: result.movements, materials: result.materials },
            `Transfert ${action.qty} ${action.articleId} ${action.fromDepotId} → ${action.toDepotId}`,
          ),
        );
      });

    case "VALIDATE_DRAFT":
      return gated(state, "VALIDATE_DRAFT", () => {
        const d = state.drafts.find((x) => x.id === action.id);
        if (!d || d.status === "exclu") return fail(state, "Un brouillard exclu (facture suspendue) ne se valide jamais.");
        if (d.status !== "a_valider") return fail(state, "Ce brouillard n'est pas à valider.");
        return persistReturn(
          audit(
            { ...state, drafts: state.drafts.map((x) => (x.id === d.id ? { ...x, status: "valide" } : x)) },
            `Brouillard ${d.ref} validé comptabilité`,
          ),
        );
      });

    case "EXPORT_SAGE":
      return gated(state, "EXPORT_SAGE", () => {
        const toExport = state.drafts.filter((d) => d.status === "valide");
        if (!toExport.length) return fail(state, "Aucun brouillard validé à exporter.");
        return persistReturn(
          audit(
            {
              ...state,
              drafts: state.drafts.map((d) => (d.status === "valide" ? { ...d, status: "exporte" } : d)),
              invoices: state.invoices.map((i) =>
                i.status === "payee" && toExport.some((d) => d.ref === i.number) ? { ...i, exported: true } : i,
              ),
              orders: state.orders.map((o) => {
                const inv = state.invoices.find((i) => i.id === o.invoiceId);
                return inv && toExport.some((d) => d.ref === inv.number) && o.status === "livree" ? { ...o, status: "exportee" } : o;
              }),
            },
            "Export Sage 100 — pièces validées uniquement, factures suspendues exclues",
          ),
        );
      });

    case "CLOSE_CASH":
      return gated(state, "CLOSE_CASH", () => {
        if (!state.cashSession.open) return fail(state, "Caisse déjà clôturée.");
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
      });

    case "CREATE_CLAIM":
      return gated(state, "CREATE_CLAIM", () => {
        const order = state.orders.find((o) => o.id === action.orderId);
        if (!order) return fail(state, "Commande introuvable.");
        const n = state.settings.counters.re + 1;
        const claim = {
          id: `re-${Date.now()}`,
          number: `RE-${state.settings.exercice}-${pad(n)}`,
          orderId: order.id,
          lot: action.lot,
          motifId: action.motifId,
          status: "ouverte" as const,
          notes: action.notes,
        };
        return persistReturn(
          audit(
            {
              ...state,
              settings: { ...state.settings, counters: { ...state.settings.counters, re: n } },
              claims: [claim, ...state.claims],
            },
            `Réclamation ${claim.number} ouverte`,
          ),
        );
      });

    case "DECIDE_CLAIM":
      return gated(state, "DECIDE_CLAIM", () => {
        const claim = state.claims.find((c) => c.id === action.id);
        if (!claim || claim.status !== "ouverte") return fail(state, "Cette réclamation est déjà tranchée.");
        let stock = state.stock;
        let movements = state.movements;
        let materials = state.materials;
        if (action.status === "quarantaine" && claim.lot) {
          const src = state.stock.find((s) => s.lot === claim.lot && s.depotId === PF_DEPOT);
          if (src && availableQtySafe(src.qty, src.reserved) > 0) {
            const moved = transferStock(stock, movements, materials, {
              articleId: src.articleId,
              articleType: src.articleType,
              fromDepotId: PF_DEPOT,
              toDepotId: QUARANTINE_DEPOT,
              qty: availableQtySafe(src.qty, src.reserved),
              origin: `Réclamation ${claim.number} — quarantaine`,
              lot: claim.lot,
            });
            if (moved.ok) {
              stock = moved.stock;
              movements = moved.movements;
              materials = moved.materials;
            }
          }
        }
        return persistReturn(
          audit(
            {
              ...state,
              stock,
              movements,
              materials,
              claims: state.claims.map((c) => (c.id === claim.id ? { ...c, status: action.status } : c)),
            },
            `Réclamation ${claim.number} : ${action.status}`,
          ),
        );
      });

    case "TOGGLE_USER":
      return gated(state, "ADMIN_USERS", () => {
        if (action.id === state.currentUserId) return fail(state, "Vous ne pouvez pas désactiver le compte en session.");
        return persistReturn(
          audit(
            {
              ...state,
              users: state.users.map((u) => (u.id === action.id ? { ...u, active: !u.active } : u)),
            },
            "Activation / désactivation utilisateur",
          ),
        );
      });

    case "CREATE_USER":
      return gated(state, "ADMIN_USERS", () => {
        if (state.users.some((u) => u.email === action.email)) return fail(state, "E-mail déjà attribué.");
        const user = {
          id: `u-${Date.now()}`,
          name: action.name,
          email: action.email,
          role: action.role,
          active: true,
        };
        return persistReturn(audit({ ...state, users: [...state.users, user] }, `Utilisateur ${user.name} créé`));
      });

    case "UPDATE_SETTINGS":
      return gated(state, "UPDATE_SETTINGS", () =>
        persistReturn(audit({ ...state, settings: { ...state.settings, ...action.patch } }, "Paramètres généraux mis à jour")),
      );

    case "UPDATE_SAGE":
      return paramGate(state, "/parametrage/sage", () =>
        persistReturn(audit({ ...state, sageMapping: { ...state.sageMapping, ...action.patch } }, "Mapping Sage 100 mis à jour")),
      );

    case "UPSERT_PRODUCT":
      return paramGate(state, "/parametrage/produits", () => {
        const exists = state.products.some((p) => p.id === action.product.id);
        const products = exists
          ? state.products.map((p) => (p.id === action.product.id ? action.product : p))
          : [action.product, ...state.products];
        return persistReturn(audit({ ...state, products }, exists ? `Produit ${action.product.code} mis à jour` : `Produit ${action.product.code} créé`));
      });

    case "UPSERT_MATERIAL":
      return paramGate(state, "/parametrage/matieres", () => {
        const exists = state.materials.some((m) => m.id === action.material.id);
        const materials = exists
          ? state.materials.map((m) => (m.id === action.material.id ? { ...action.material, cmup: m.cmup } : m))
          : [{ ...action.material }];
        return persistReturn(audit({ ...state, materials: exists ? materials : [action.material, ...state.materials] }, `Matière ${action.material.code} enregistrée`));
      });

    case "UPSERT_CUSTOMER":
      return paramGate(state, "/parametrage/clients", () => {
        const exists = state.customers.some((c) => c.id === action.customer.id);
        const customers = exists
          ? state.customers.map((c) => (c.id === action.customer.id ? action.customer : c))
          : [action.customer, ...state.customers];
        return persistReturn(audit({ ...state, customers }, `Client ${action.customer.code} enregistré`));
      });

    case "UPSERT_SUPPLIER":
      return paramGate(state, "/parametrage/fournisseurs", () => {
        const exists = state.suppliers.some((s) => s.id === action.supplier.id);
        const suppliers = exists
          ? state.suppliers.map((s) => (s.id === action.supplier.id ? action.supplier : s))
          : [action.supplier, ...state.suppliers];
        return persistReturn(audit({ ...state, suppliers }, `Fournisseur ${action.supplier.code} enregistré`));
      });

    case "UPSERT_TARIFF":
      return paramGate(state, "/parametrage/tarifs", () => {
        const exists = state.tariffs.some((t) => t.id === action.tariff.id);
        const tariffs = exists
          ? state.tariffs.map((t) => (t.id === action.tariff.id ? action.tariff : t))
          : [...state.tariffs, action.tariff];
        return persistReturn(audit({ ...state, tariffs }, `Grille tarifaire ${action.tariff.name} enregistrée`));
      });

    case "SET_THRESHOLD":
      return paramGate(state, "/parametrage/seuils", () => {
        const role = state.users.find((u) => u.id === state.currentUserId)?.role;
        if (role === "responsable_production" && action.articleType !== "produit") {
          return fail(state, "Le responsable production ne paramètre que les seuils produits finis.");
        }
        if (role === "responsable_achats" && action.articleType !== "matiere") {
          return fail(state, "Les achats ne paramètrent que les seuils matières.");
        }
        if (action.articleType === "produit") {
          return persistReturn({
            ...state,
            lastError: null,
            products: state.products.map((p) => (p.id === action.id ? { ...p, minStock: action.minStock } : p)),
          });
        }
        return persistReturn({
          ...state,
          lastError: null,
          materials: state.materials.map((m) => (m.id === action.id ? { ...m, minStock: action.minStock } : m)),
        });
      });

    case "ADD_LOSS_CAUSE":
      return paramGate(state, "/parametrage/causes-pertes", () =>
        persistReturn({
          ...state,
          lastError: null,
          lossCauses: [...state.lossCauses, { id: `c-${Date.now()}`, label: action.label }],
        }),
      );

    case "ADD_SUSPEND_REASON":
      return paramGate(state, "/parametrage/motifs-suspension", () =>
        persistReturn({
          ...state,
          lastError: null,
          suspendReasons: [...state.suspendReasons, { id: `sr-${Date.now()}`, label: action.label }],
        }),
      );

    case "ADD_CLAIM_REASON":
      return paramGate(state, "/parametrage/motifs-reclamation", () =>
        persistReturn({
          ...state,
          lastError: null,
          claimReasons: [...state.claimReasons, { id: `mot-${Date.now()}`, label: action.label }],
        }),
      );

    case "ADD_UNIT":
      return paramGate(state, "/parametrage/unites", () =>
        persistReturn({
          ...state,
          lastError: null,
          units: [...state.units, { id: `u-${Date.now()}`, code: action.code, label: action.label }],
        }),
      );

    case "ADD_DEPOT":
      return paramGate(state, "/parametrage/depots", () =>
        persistReturn(
          audit(
            {
              ...state,
              depots: [...state.depots, { id: `dep-${Date.now()}`, code: action.code, name: action.name, kind: action.kind }],
            },
            `Dépôt ${action.code} créé`,
          ),
        ),
      );

    case "UPDATE_SHEET":
      return paramGate(state, "/parametrage/fiches-techniques", () =>
        persistReturn({
          ...state,
          lastError: null,
          sheets: state.sheets.map((s) => (s.id === action.sheet.id ? action.sheet : s)),
        }),
      );

    case "ACTIVATE_SHEET":
      return paramGate(state, "/parametrage/fiches-techniques", () => {
        const sheet = state.sheets.find((s) => s.id === action.id);
        if (!sheet) return fail(state, "Fiche technique introuvable.");
        return persistReturn(
          audit(
            {
              ...state,
              sheets: state.sheets.map((s) =>
                s.productId !== sheet.productId
                  ? s
                  : s.id === sheet.id
                    ? { ...s, status: "active" }
                    : s.status === "active"
                      ? { ...s, status: "archivee" }
                      : s,
              ),
            },
            `FT ${sheet.id} activée — les autres versions du produit sont archivées`,
          ),
        );
      });

    case "SET_CUSTOMER_PAYMENTS":
      return paramGate(state, "/parametrage/encaissement", () =>
        persistReturn({
          ...state,
          lastError: null,
          customers: state.customers.map((c) => (c.id === action.customerId ? { ...c, paymentMethods: action.methods } : c)),
        }),
      );

    default:
      return state;
  }
}

function availableQtySafe(qty: number, reserved: number) {
  return Math.max(0, qty - reserved);
}

type Store = {
  state: AppState;
  currentUser: AppState["users"][number] | null;
  role: Role | null;
  dispatch: React.Dispatch<Action>;
  can: (action: ActionName) => boolean;
  canEditParam: (href: string) => boolean;
  productName: (id: string) => string;
  materialName: (id: string) => string;
  customerName: (id: string) => string;
  availableFor: (productId: string) => number;
  canCreateOrder: (lines: { productId: string; qty: number }[]) => {
    ok: boolean;
    missing: { productId: string; need: number; available: number }[];
  };
  unitPrice: (customerId: string, productId: string) => number;
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
  const availableFor = useCallback((productId: string) => sellableQty(state, productId), [state]);
  const canCreateOrder = useCallback(
    (lines: { productId: string; qty: number }[]) => {
      const missing = lines
        .map((l) => ({ productId: l.productId, need: l.qty, available: availableFor(l.productId) }))
        .filter((m) => m.need > m.available);
      return { ok: missing.length === 0, missing };
    },
    [availableFor],
  );
  const unitPrice = useCallback(
    (customerId: string, productId: string) => unitPriceForCustomer(state, customerId, productId),
    [state],
  );

  const value = useMemo<Store>(
    () => ({
      state,
      currentUser,
      role: currentUser?.role ?? null,
      dispatch,
      can: (action) => canAct(currentUser?.role ?? null, action),
      canEditParam: (href) => roleCanEditParam(currentUser?.role ?? null, href),
      productName,
      materialName,
      customerName,
      availableFor,
      canCreateOrder,
      unitPrice,
    }),
    [state, currentUser, productName, materialName, customerName, availableFor, canCreateOrder, unitPrice],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

