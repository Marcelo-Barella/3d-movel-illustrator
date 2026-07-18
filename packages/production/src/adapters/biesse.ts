/**
 * Biesse BPP-like simplified text.
 * PAN= size; BV= drills; BG= grooves.
 */
import type { Diagnostic } from "@movel/shared";
import type { CncAdapter, MachinedPart } from "../types.js";
import { partPath } from "./types.js";

function emitPart(part: MachinedPart, report: Diagnostic[]): string {
  const lines = [
    `PAN=L=${part.lengthMm} W=${part.widthMm} T=${part.thicknessMm}`,
  ];
  for (const op of part.ops) {
    if (op.kind === "contour") {
      lines.push(`BG=CONTORNO L=${part.lengthMm} W=${part.widthMm}`);
    } else if (op.kind === "drill") {
      lines.push(
        `BV=X=${op.xMm} Y=${op.yMm} D=${op.diameterMm} DP=${op.depthMm}`,
      );
    } else if (op.kind === "groove") {
      lines.push(
        `BG=X=${op.xMm} Y=${op.yMm} LEN=${op.lengthMm} W=${op.widthMm} DP=${op.depthMm} AX=${op.axis}`,
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

export const biesseAdapter: CncAdapter = {
  id: "biesse",
  label: "Biesse",
  capabilities: new Set(["contour", "drill", "groove"]),
  emit(ir) {
    const report: Diagnostic[] = [];
    const files = ir.parts.map((part) => ({
      relativePath: partPath("biesse", part.partId, part.label, "bpp"),
      contents: emitPart(part, report),
    }));
    return { files, report };
  },
};
