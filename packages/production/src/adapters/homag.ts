/**
 * HOMAG woodWOP simplified macros.
 * Mapping: W/L/T size; BMX contour; KMT drill; NUT groove. Unsupported ops → CNC_UNSUPPORTED_OP.
 */
import type { Diagnostic } from "@movel/shared";
import type { CncAdapter, MachinedPart } from "../types.js";
import { partPath } from "./types.js";

function emitPart(part: MachinedPart, report: Diagnostic[]): string {
  const lines = [
    `[H`,
    `VERSION="movel-homag-v1"`,
    `W=${part.lengthMm}`,
    `L=${part.widthMm}`,
    `T=${part.thicknessMm}`,
  ];
  for (const op of part.ops) {
    if (op.kind === "contour") {
      lines.push(`BMX=0,0,${part.lengthMm},${part.widthMm}`);
    } else if (op.kind === "drill") {
      lines.push(`KMT=${op.xMm},${op.yMm},${op.diameterMm},${op.depthMm}`);
    } else if (op.kind === "groove") {
      lines.push(
        `NUT=${op.xMm},${op.yMm},${op.lengthMm},${op.widthMm},${op.depthMm},${op.axis}`,
      );
    } else {
      report.push({
        code: "CNC_UNSUPPORTED_OP",
        severity: "error",
        message: `unsupported op on ${part.partId}`,
        path: part.partId,
      });
    }
  }
  return `${lines.join("\n")}\n`;
}

export const homagAdapter: CncAdapter = {
  id: "homag",
  label: "HOMAG woodWOP",
  capabilities: new Set(["contour", "drill", "groove"]),
  emit(ir) {
    const report: Diagnostic[] = [];
    const files = ir.parts.map((part) => ({
      relativePath: partPath("homag", part.partId, part.label, "mpr"),
      contents: emitPart(part, report),
    }));
    return { files, report };
  },
};
