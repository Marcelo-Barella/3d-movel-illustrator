import type { CncAdapter, MachiningIR } from "../types.js";
import { partPath } from "./types.js";

function emitPart(part: MachiningIR["parts"][number]): string {
  const lines = [
    `# movel-scm-v1 partId=${part.partId}`,
    `SIZE L=${part.lengthMm} W=${part.widthMm} T=${part.thicknessMm}`,
  ];
  for (const op of part.ops) {
    if (op.kind === "contour") {
      lines.push("CONTOUR RECT");
    } else if (op.kind === "drill") {
      lines.push(
        `DRILL X=${op.xMm} Y=${op.yMm} D=${op.diameterMm} DEPTH=${op.depthMm}`,
      );
    } else if (op.kind === "groove") {
      lines.push(
        `GROOVE X=${op.xMm} Y=${op.yMm} LEN=${op.lengthMm} WIDTH=${op.widthMm} DEPTH=${op.depthMm} AXIS=${op.axis}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

export const scmAdapter: CncAdapter = {
  id: "scm",
  label: "SCM Maestro/Xilog",
  capabilities: new Set(["contour", "drill", "groove"]),
  emit(ir) {
    const report = [];
    const files = [];
    const manifestParts = [];
    for (const part of ir.parts) {
      if (!part.materialSku) {
        report.push({
          code: "PART_NO_MATERIAL",
          severity: "error" as const,
          message: `missing material for ${part.partId}`,
          path: part.partId,
        });
        continue;
      }
      if (part.ops.length === 0) {
        report.push({
          code: "PART_NO_OPS",
          severity: "error" as const,
          message: `zero ops for ${part.partId}`,
          path: part.partId,
        });
        continue;
      }
      const relativePath = partPath("scm", part.partId, part.label, "xilog.txt").replace(
        /^scm\//,
        "scm/parts/",
      );
      files.push({ relativePath, contents: emitPart(part) });
      manifestParts.push({
        partId: part.partId,
        file: relativePath,
        materialSku: part.materialSku,
      });
    }
    files.unshift({
      relativePath: "scm/manifest.json",
      contents: `${JSON.stringify({ adapter: "scm", parts: manifestParts }, null, 2)}\n`,
    });
    return { files, report };
  },
};
