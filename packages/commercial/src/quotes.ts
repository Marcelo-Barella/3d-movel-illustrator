import {
  explodeBom,
  resolveParams,
  type CatalogPack,
} from "@movel/catalog";
import type { SceneState } from "@movel/scene";
import { createId, err, ok, type Result } from "@movel/shared";
import { lookupUnitPrice } from "./price-tables.js";
import type { PriceTable, Quote, QuoteLine } from "./types.js";

export function buildQuoteFromScene(
  scene: SceneState,
  pack: CatalogPack,
  priceTable: PriceTable,
  customerId: string,
  currency = "BRL",
): Quote {
  const lines: QuoteLine[] = [];
  for (const inst of scene.instances) {
    const mod = pack.modules.find((m) => m.id === inst.moduleId);
    if (!mod) continue;
    const params = resolveParams(mod, inst.paramOverrides);
    const sku = mod.priceSku ?? mod.id;
    lines.push({
      id: createId("line"),
      sku,
      description: mod.name,
      qty: 1,
      unitPrice: lookupUnitPrice(priceTable, sku),
      source: "scene",
      instanceId: inst.id,
    });
    for (const bom of explodeBom(mod, params)) {
      lines.push({
        id: createId("line"),
        sku: bom.sku,
        description: bom.description,
        qty: bom.qty,
        unitPrice: lookupUnitPrice(priceTable, bom.sku),
        source: "scene",
        instanceId: inst.id,
      });
    }
  }
  return {
    id: createId("quote"),
    customerId,
    status: "draft",
    revision: 0,
    currency,
    lines,
  };
}

export function issueRevision(quote: Quote): Result<Quote> {
  if (quote.status === "issued") {
    return ok({
      ...quote,
      revision: quote.revision + 1,
      issuedAt: new Date().toISOString(),
      lines: quote.lines.map((l) => ({ ...l })),
    });
  }
  return ok({
    ...quote,
    status: "issued",
    revision: Math.max(1, quote.revision + 1),
    issuedAt: new Date().toISOString(),
    lines: quote.lines.map((l) => ({ ...l })),
  });
}

export function mutateIssuedClone(quote: Quote): Result<Quote> {
  if (quote.status !== "issued") return ok(quote);
  return ok({
    ...quote,
    status: "draft",
    id: createId("quote"),
    revision: 0,
    issuedAt: undefined,
    lines: quote.lines.map((l) => ({ ...l, id: createId("line") })),
  });
}

export function assertMutable(quote: Quote): Result<Quote> {
  if (quote.status === "issued") {
    return err([
      {
        code: "QUOTE_IMMUTABLE",
        severity: "error",
        message: "issued quote is immutable; clone to draft",
      },
    ]);
  }
  return ok(quote);
}
