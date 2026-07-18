import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { err, ok, type Result } from "@movel/shared";
import { validateModule } from "./schema.js";
import type {
  BomLineRecipe,
  CatalogPack,
  ModuleTemplate,
  PanelRecipe,
} from "./types.js";

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

export function setPanelRecipe(
  module: ModuleTemplate,
  panel: PanelRecipe,
): Result<ModuleTemplate> {
  if (!panel.id) {
    return err([
      {
        code: "PANEL_ID_REQUIRED",
        severity: "error",
        message: "panel id required",
      },
    ]);
  }
  const panels = module.panels.filter((p) => p.id !== panel.id);
  panels.push(panel);
  return ok({ ...module, panels });
}

export function setBomRecipe(
  module: ModuleTemplate,
  bom: BomLineRecipe[],
): Result<ModuleTemplate> {
  if (!Array.isArray(bom)) {
    return err([
      {
        code: "BOM_INVALID",
        severity: "error",
        message: "bom must be an array",
      },
    ]);
  }
  return ok({ ...module, bom: [...bom] });
}

export async function savePackToDir(
  pack: CatalogPack,
  dir: string,
): Promise<Result<void>> {
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "catalog.json"), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
    return ok(undefined);
  } catch (e) {
    return err([
      {
        code: "PACK_SAVE_FAILED",
        severity: "error",
        message: e instanceof Error ? e.message : String(e),
      },
    ]);
  }
}

export async function loadPackFromDir(
  dir: string,
): Promise<Result<CatalogPack>> {
  try {
    const raw = await readFile(join(dir, "catalog.json"), "utf8");
    const pack = JSON.parse(raw) as CatalogPack;
    if (!pack.id || !Array.isArray(pack.modules)) {
      return err([
        {
          code: "PACK_INVALID",
          severity: "error",
          message: "catalog.json missing id/modules",
        },
      ]);
    }
    return ok(pack);
  } catch (e) {
    return err([
      {
        code: "PACK_LOAD_FAILED",
        severity: "error",
        message: e instanceof Error ? e.message : String(e),
      },
    ]);
  }
}
