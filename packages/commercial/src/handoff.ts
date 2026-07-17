import { err, ok, type Result } from "@movel/shared";
import type { HandoffManifest, HandoffPolicy, Quote } from "./types.js";

export function createOrderHandoff(input: {
  quote: Quote;
  productionExportDir?: string;
  policy: HandoffPolicy;
}): Result<HandoffManifest> {
  const unpriced = input.quote.lines.filter((l) => l.unitPrice === null);
  if (unpriced.length > 0 && input.policy === "block") {
    return err([
      {
        code: "PRICE_BINDING_MISSING",
        severity: "error",
        message: `${unpriced.length} unpriced line(s)`,
      },
    ]);
  }
  const diagnostics =
    unpriced.length > 0 && input.policy === "warn"
      ? [
          {
            code: "PRICE_BINDING_MISSING",
            severity: "warning" as const,
            message: `${unpriced.length} unpriced line(s) allowed by warn policy`,
          },
        ]
      : [];
  void diagnostics;
  return ok({
    quoteId: input.quote.id,
    revision: input.quote.revision,
    customerId: input.quote.customerId,
    productionExportDir: input.productionExportDir,
    createdAt: new Date().toISOString(),
  });
}
