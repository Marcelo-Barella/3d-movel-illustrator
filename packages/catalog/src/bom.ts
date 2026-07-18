import { evalFormula } from "./formula.js";
import { numericParams } from "./params.js";
import type { BomLine, ModuleTemplate } from "./types.js";

export function explodeBom(
  module: ModuleTemplate,
  params: Record<string, number | string | boolean>,
): BomLine[] {
  const nums = numericParams(params);
  const lines: BomLine[] = [];
  for (const recipe of module.bom) {
    const qty = evalFormula(recipe.qtyFormula, nums);
    if (!qty.ok) continue;
    lines.push({
      sku: recipe.sku,
      description: recipe.description,
      qty: qty.value,
    });
  }
  return lines;
}
