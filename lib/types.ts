export type Role =
  | "administrateur"
  | "direction"
  | "responsable_production"
  | "agent_production"
  | "controleur_qualite"
  | "magasinier"
  | "responsable_achats"
  | "commercial"
  | "caissier"
  | "preparateur"
  | "logistique"
  | "comptabilite";

export type ProductFamily = "eau" | "jus" | "yaourt";

export type OfStatus =
  | "cree"
  | "planifie"
  | "en_production"
  | "fin_production"
  | "controle_qualite"
  | "cloture"
  | "bloque";

export type OrderStatus =
  | "creee"
  | "stock_verifie"
  | "a_payer"
  | "payee"
  | "suspendue"
  | "preparee"
  | "livree"
  | "exportee"
  | "annulee";

export type PaymentMethod = "especes" | "cb" | "virement";
export type ClientType = "comptant" | "a_terme";
export type PrepStatus = "a_preparer" | "partielle" | "complete";
export type BlStatus = "brouillon" | "verrouille" | "valide" | "livre";
export type DaStatus = "brouillon" | "soumise" | "validee" | "refusee";
export type ReceptionStatus = "en_cours" | "ecart" | "close";
export type ClaimStatus = "ouverte" | "quarantaine" | "acceptee" | "rejetee";
export type BrouillardStatus = "a_valider" | "valide" | "exporte" | "exclu";
export type MovementType = "entree" | "sortie" | "retour" | "transfert" | "ajustement";
export type FtStatus = "brouillon" | "active" | "archivee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  family: ProductFamily;
  unit: string;
  active: boolean;
  technicalSheetId: string;
  saleUnit: string;
  minStock: number;
  priceHt: number;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  kind: "ingredient" | "additif" | "emballage" | "autre";
  unit: string;
  minStock: number;
  cmup: number;
  supplierIds: string[];
}

export interface TechnicalSheet {
  id: string;
  productId: string;
  version: number;
  status: FtStatus;
  yieldExpected: number;
  yieldTolerance: number;
  composition: { materialId: string; qty: number }[];
  packaging: { materialId: string; qty: number }[];
  process: { step: string; durationMin: number; instruction: string }[];
  qualityChecks: { name: string; min?: number; max?: number; unit: string; required: boolean }[];
}

export interface Depot {
  id: string;
  code: string;
  name: string;
  kind: "pf" | "matieres" | "quarantaine" | "retours";
}

export interface StockLine {
  id: string;
  articleId: string;
  articleType: "produit" | "matiere";
  depotId: string;
  lot?: string;
  qty: number;
  reserved: number;
  cmup: number;
}

export interface ProductionPlan {
  id: string;
  productId: string;
  date: string;
  qty: number;
  ofId: string;
}

export interface WorkOrder {
  id: string;
  planId: string;
  productId: string;
  qtyPlanned: number;
  qtyReal: number;
  status: OfStatus;
  lot?: string;
  createdAt: string;
  yieldActual?: number;
  cost?: number;
  qualityResult?: "conforme" | "non_conforme" | "en_attente";
  qualityNotes?: string;
  waterVolumeM3?: number;
}

export interface MaterialRequest {
  id: string;
  ofId: string;
  status: "demandee" | "validee" | "servie";
  lines: { materialId: string; qty: number }[];
}

export interface Loss {
  id: string;
  ofId: string;
  causeId: string;
  qty: number;
  lot?: string;
}

export interface LossCause {
  id: string;
  label: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: ClientType;
  paymentMethods: PaymentMethod[];
  tariffId: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  delayDays: number;
}

export interface OrderLine {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  number: string;
  customerId: string;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
  invoiceId: string;
  suspendReason?: string;
  prepStatus: PrepStatus;
  paidAt?: string;
}

export interface Invoice {
  id: string;
  number: string;
  orderId: string;
  amount: number;
  status: "a_payer" | "payee" | "suspendue";
  suspendReason?: string;
  exported: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  success: boolean;
  at: string;
}

export interface DeliveryNote {
  id: string;
  number: string;
  orderId: string;
  status: BlStatus;
  signed: boolean;
  proof?: boolean;
}

export interface PurchaseRequest {
  id: string;
  number: string;
  status: DaStatus;
  materialId: string;
  qty: number;
  reason: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  daId: string;
  status: "envoyee" | "recue" | "partielle";
  lines: { materialId: string; qty: number }[];
}

export interface Reception {
  id: string;
  number: string;
  poId: string;
  status: ReceptionStatus;
  lines: { materialId: string; ordered: number; received: number }[];
}

export interface InventorySession {
  id: string;
  depotId: string;
  status: "ouvert" | "compte" | "valide";
  date: string;
  lines: { articleId: string; theoretical: number; physical?: number }[];
}

export interface Movement {
  id: string;
  type: MovementType;
  articleId: string;
  articleType: "produit" | "matiere";
  qty: number;
  depotId: string;
  destDepotId?: string;
  lot?: string;
  origin: string;
  cmup: number;
  at: string;
}

export interface Claim {
  id: string;
  number: string;
  orderId: string;
  lot?: string;
  motifId: string;
  status: ClaimStatus;
  notes: string;
}

export interface AccountingDraft {
  id: string;
  kind: "vente" | "achat";
  ref: string;
  amount: number;
  status: BrouillardStatus;
  journal: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  user: string;
  action: string;
}

export interface AppState {
  currentUserId: string | null;
  depotId: string;
  users: User[];
  products: Product[];
  materials: Material[];
  sheets: TechnicalSheet[];
  depots: Depot[];
  stock: StockLine[];
  plans: ProductionPlan[];
  ofList: WorkOrder[];
  materialRequests: MaterialRequest[];
  losses: Loss[];
  lossCauses: LossCause[];
  customers: Customer[];
  suppliers: Supplier[];
  orders: SalesOrder[];
  invoices: Invoice[];
  payments: Payment[];
  deliveryNotes: DeliveryNote[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  receptions: Reception[];
  inventories: InventorySession[];
  movements: Movement[];
  claims: Claim[];
  drafts: AccountingDraft[];
  audit: AuditEvent[];
  cashSession: {
    open: boolean;
    theoretical: number;
    counted?: number;
    closedAt?: string;
  };
  settings: {
    company: string;
    exercice: string;
    ofPrefix: string;
    faPrefix: string;
    blPrefix: string;
    counters: { of: number; fa: number; bl: number; da: number };
  };
  suspendReasons: { id: string; label: string }[];
  claimReasons: { id: string; label: string }[];
  sageMapping: { journalVente: string; journalAchat: string; compteClient: string; compteFournisseur: string };
}
