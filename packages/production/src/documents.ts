import type { DocTable, MachiningIR } from "./types.js";

export function buildDocuments(ir: MachiningIR): {
  bom: DocTable;
  cutList: DocTable;
  edgeBand: DocTable;
  hardware: DocTable;
} {
  const cutList: DocTable = {
    name: "cutList",
    headers: [
      "PartId",
      "Label",
      "MaterialSku",
      "LengthMm",
      "WidthMm",
      "ThicknessMm",
      "Qty",
    ],
    rows: ir.parts.map((p) => [
      p.partId,
      p.label,
      p.materialSku,
      p.lengthMm,
      p.widthMm,
      p.thicknessMm,
      p.quantity,
    ]),
  };

  const materialQty = new Map<string, number>();
  for (const p of ir.parts) {
    materialQty.set(
      p.materialSku,
      (materialQty.get(p.materialSku) ?? 0) + p.quantity,
    );
  }
  const bom: DocTable = {
    name: "bom",
    headers: ["Sku", "Qty"],
    rows: [...materialQty.entries()].map(([sku, qty]) => [sku, qty]),
  };

  const edgeBand: DocTable = {
    name: "edgeBand",
    headers: ["PartId", "L", "W", "R", "B"],
    rows: ir.parts.map((p) => [
      p.partId,
      p.edgeBands.L,
      p.edgeBands.W,
      p.edgeBands.R,
      p.edgeBands.B,
    ]),
  };

  const hardware: DocTable = {
    name: "hardware",
    headers: ["Sku", "Qty"],
    rows: [],
  };

  return { bom, cutList, edgeBand, hardware };
}

export function docTableToCsv(table: DocTable): string {
  const lines = [table.headers.join(",")];
  for (const row of table.rows) {
    lines.push(row.map((c) => String(c)).join(","));
  }
  return `${lines.join("\n")}\n`;
}
