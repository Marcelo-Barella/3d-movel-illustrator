/**
 * Generic DXF (LWPOLYLINE rectangle) + ISO G-code contour.
 */
import type { CncAdapter, MachinedPart } from "../types.js";
import { partPath, slugify } from "./types.js";

function emitDxf(part: MachinedPart): string {
  const l = part.lengthMm;
  const w = part.widthMm;
  return [
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    "0",
    "LWPOLYLINE",
    "8",
    "0",
    "90",
    "4",
    "70",
    "1",
    "10",
    "0",
    "20",
    "0",
    "10",
    String(l),
    "20",
    "0",
    "10",
    String(l),
    "20",
    String(w),
    "10",
    "0",
    "20",
    String(w),
    "0",
    "ENDSEC",
    "0",
    "EOF",
    "",
  ].join("\n");
}

function emitNc(part: MachinedPart): string {
  const l = part.lengthMm;
  const w = part.widthMm;
  return [
    `(generic contour ${part.partId})`,
    "G21",
    "G90",
    "G0 X0 Y0",
    "G1 Z-1 F300",
    `G1 X${l} Y0 F1000`,
    `G1 X${l} Y${w}`,
    `G1 X0 Y${w}`,
    "G1 X0 Y0",
    "G0 Z5",
    "M30",
    "",
  ].join("\n");
}

export const genericAdapter: CncAdapter = {
  id: "generic",
  label: "Generic DXF + G-code",
  capabilities: new Set(["contour", "drill", "groove"]),
  emit(ir) {
    const files = [];
    for (const part of ir.parts) {
      const base = `${part.partId}_${slugify(part.label)}`;
      files.push({
        relativePath: `generic/${base}.dxf`,
        contents: emitDxf(part),
      });
      files.push({
        relativePath: `generic/${base}.nc`,
        contents: emitNc(part),
      });
    }
    return { files, report: [] };
  },
};
