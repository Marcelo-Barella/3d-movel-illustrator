import {
  expandPanels,
  explodeBom,
  resolveParams,
  type CatalogPack,
} from "@movel/catalog";
import type { SceneState } from "@movel/scene";
import type { Diagnostic } from "@movel/shared";
import type { MachinedPart, MachiningIR } from "./types.js";

export function buildMachiningIR(
  scene: SceneState,
  pack: CatalogPack,
): MachiningIR {
  const parts: MachinedPart[] = [];
  const hardwareQty = new Map<string, number>();
  const diagnostics: Diagnostic[] = [];

  for (const inst of scene.instances) {
    const mod = pack.modules.find((m) => m.id === inst.moduleId);
    if (!mod) {
      diagnostics.push({
        code: "MODULE_MISSING",
        severity: "error",
        message: `module ${inst.moduleId} not in catalog`,
        path: inst.id,
      });
      continue;
    }
    const params = resolveParams(mod, inst.paramOverrides);
    const panels = expandPanels(mod, params, pack.materials);
    for (const line of explodeBom(mod, params)) {
      hardwareQty.set(
        line.sku,
        (hardwareQty.get(line.sku) ?? 0) + line.qty,
      );
    }

    for (const panel of panels) {
      if (panel.ops.length === 0) {
        diagnostics.push({
          code: "PART_NO_OPS",
          severity: "warning",
          message: `part ${panel.id} has no machining ops`,
          path: `${inst.id}/${panel.id}`,
        });
      }
      if (!panel.materialSku) {
        diagnostics.push({
          code: "PART_NO_MATERIAL",
          severity: "error",
          message: `part ${panel.id} missing material`,
          path: `${inst.id}/${panel.id}`,
        });
      }
      parts.push({
        partId: `${inst.id}_${panel.id}`,
        label: panel.label,
        moduleInstanceId: inst.id,
        materialSku: panel.materialSku,
        thicknessMm: panel.thicknessMm,
        lengthMm: panel.lengthMm,
        widthMm: panel.widthMm,
        grain: panel.grain,
        edgeBands: { L: "", W: "", R: "", B: "" },
        ops: panel.ops,
        quantity: 1,
      });
    }
  }

  const hardware = [...hardwareQty.entries()].map(([sku, qty]) => ({
    sku,
    qty,
  }));

  return { parts, hardware, diagnostics };
}
