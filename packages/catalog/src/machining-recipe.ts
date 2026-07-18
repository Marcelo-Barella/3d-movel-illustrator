import { evalFormula } from "./formula.js";
import { numericParams } from "./params.js";
import type {
  CatalogPack,
  MachiningOp,
  ModuleTemplate,
  PanelPart,
} from "./types.js";

export function expandPanels(
  module: ModuleTemplate,
  params: Record<string, number | string | boolean>,
  materials: CatalogPack["materials"],
): PanelPart[] {
  const nums = numericParams(params);
  const materialByKey = new Map(materials.map((m) => [m.id, m]));
  const parts: PanelPart[] = [];

  for (const panel of module.panels) {
    const length = evalFormula(panel.lengthFormula, nums);
    const width = evalFormula(panel.widthFormula, nums);
    if (!length.ok || !width.ok) continue;
    const materialId =
      module.defaultMaterials[panel.materialKey] ?? panel.materialKey;
    const material = materialByKey.get(materialId);
    const ops: MachiningOp[] = [];
    for (const op of panel.ops) {
      if (op.kind === "contour") {
        ops.push({ kind: "contour", shape: op.shape });
        continue;
      }
      if (op.kind === "drill") {
        const x = evalFormula(op.xFormula, nums);
        const y = evalFormula(op.yFormula, nums);
        if (!x.ok || !y.ok) continue;
        ops.push({
          kind: "drill",
          xMm: x.value,
          yMm: y.value,
          diameterMm: op.diameterMm,
          depthMm: op.depthMm,
        });
        continue;
      }
      const x = evalFormula(op.xFormula, nums);
      const y = evalFormula(op.yFormula, nums);
      const len = evalFormula(op.lengthFormula, nums);
      if (!x.ok || !y.ok || !len.ok) continue;
      ops.push({
        kind: "groove",
        xMm: x.value,
        yMm: y.value,
        lengthMm: len.value,
        widthMm: op.widthMm,
        depthMm: op.depthMm,
        axis: op.axis,
      });
    }
    parts.push({
      id: panel.id,
      label: panel.label,
      materialKey: panel.materialKey,
      materialSku: material?.sku ?? materialId,
      lengthMm: length.value,
      widthMm: width.value,
      thicknessMm: panel.thicknessMm,
      grain: panel.grain,
      ops,
    });
  }
  return parts;
}
