import type { MachiningIR } from "./types.js";

export const NESTING_CSV_HEADER =
  "PartId,Label,Material,ThicknessMm,LengthMm,WidthMm,Grain,Quantity,EdgeBandL,EdgeBandW,EdgeBandR,EdgeBandB,ModuleInstanceId,MaterialSku";

export function toNestingCsv(ir: MachiningIR): string {
  const lines = [NESTING_CSV_HEADER];
  for (const p of ir.parts) {
    lines.push(
      [
        p.partId,
        p.label,
        p.materialSku,
        p.thicknessMm,
        p.lengthMm,
        p.widthMm,
        p.grain,
        p.quantity,
        p.edgeBands.L,
        p.edgeBands.W,
        p.edgeBands.R,
        p.edgeBands.B,
        p.moduleInstanceId,
        p.materialSku,
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
