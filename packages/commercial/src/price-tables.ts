import { createId } from "@movel/shared";
import type { PriceBinding, PriceTable } from "./types.js";

export function createPriceTable(
  input: Omit<PriceTable, "id" | "version"> & {
    id?: string;
    version?: number;
  },
): PriceTable {
  return {
    id: input.id ?? createId("price"),
    name: input.name,
    version: input.version ?? 1,
    bindings: input.bindings,
  };
}

export function lookupUnitPrice(
  table: PriceTable,
  sku: string,
): number | null {
  const binding = table.bindings.find((b: PriceBinding) => b.sku === sku);
  return binding ? binding.unitPrice : null;
}
