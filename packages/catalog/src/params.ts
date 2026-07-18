import type { ModuleTemplate } from "./types.js";

export function resolveParams(
  module: ModuleTemplate,
  overrides: Record<string, number | string | boolean>,
): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {};
  for (const p of module.params) {
    out[p.key] = p.default;
  }
  for (const [k, v] of Object.entries(overrides)) {
    out[k] = v;
  }
  return out;
}

export function numericParams(
  params: Record<string, number | string | boolean>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "boolean") out[k] = v ? 1 : 0;
  }
  return out;
}
