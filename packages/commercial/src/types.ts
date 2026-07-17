export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type PriceBinding = {
  sku: string;
  unitPrice: number;
  currency: "BRL" | "USD" | "EUR";
};

export type PriceTable = {
  id: string;
  name: string;
  version: number;
  bindings: PriceBinding[];
};

export type QuoteLine = {
  id: string;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number | null;
  source: "scene" | "manual";
  instanceId?: string;
};

export type Quote = {
  id: string;
  customerId: string;
  status: "draft" | "issued";
  revision: number;
  currency: string;
  lines: QuoteLine[];
  issuedAt?: string;
};

export type HandoffManifest = {
  quoteId: string;
  revision: number;
  customerId: string;
  productionExportDir?: string;
  createdAt: string;
};

export type CommercialState = {
  customers: Customer[];
  priceTables: PriceTable[];
  quotes: Quote[];
  activeQuoteId: string | null;
};

export type HandoffPolicy = "block" | "warn";
