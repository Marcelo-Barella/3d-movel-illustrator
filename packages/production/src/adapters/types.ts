import type { CncAdapter, CncEmitResult, MachiningIR } from "../types.js";

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "part";
}

export function partPath(
  adapterId: string,
  partId: string,
  label: string,
  ext: string,
): string {
  return `${adapterId}/${partId}_${slugify(label)}.${ext}`;
}

export function stubEmit(
  adapterId: string,
  ir: MachiningIR,
): CncEmitResult {
  return {
    files: [
      {
        relativePath: `${adapterId}/README.stub.txt`,
        contents: `stub for ${adapterId}; parts=${ir.parts.length}`,
      },
    ],
    report: [
      {
        code: "CNC_STUB",
        severity: "info",
        message: `${adapterId} adapter stub emit`,
      },
    ],
  };
}

export type { CncAdapter };
