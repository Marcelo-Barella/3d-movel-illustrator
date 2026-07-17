import { err, ok, type Result } from "@movel/shared";
import { validateModule } from "./schema.js";
import type { CatalogPack, ModuleTemplate } from "./types.js";

export function upsertModule(
  pack: CatalogPack,
  module: ModuleTemplate,
): Result<CatalogPack> {
  const diagnostics = validateModule(module).filter(
    (d) => d.severity === "error",
  );
  if (diagnostics.length > 0) return err(diagnostics);
  const modules = pack.modules.filter((m) => m.id !== module.id);
  modules.push(module);
  return ok({ ...pack, modules });
}

export function createModuleDraft(
  partial: Partial<ModuleTemplate> & Pick<ModuleTemplate, "id" | "name">,
): ModuleTemplate {
  return {
    id: partial.id,
    name: partial.name,
    category: partial.category ?? "custom",
    params: partial.params ?? [],
    defaultMaterials: partial.defaultMaterials ?? {},
    bom: partial.bom ?? [],
    panels: partial.panels ?? [],
    priceSku: partial.priceSku,
  };
}
