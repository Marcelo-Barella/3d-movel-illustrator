import { createModuleDraft, type CatalogPack } from "@movel/catalog";
import { err, ok, type Diagnostic, type Result } from "@movel/shared";

export type CatalogImportResult = Result<CatalogPack> & {
  diagnostics: Diagnostic[];
};

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.length > 0)
    .map((line) => line.split(",").map((c) => c.trim()));
}

export function importCatalogListCsv(text: string): CatalogImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return {
      ...err([
        {
          code: "IMPORT_CSV_EMPTY",
          severity: "error",
          message: "csv has no data rows",
        },
      ]),
      diagnostics: [
        {
          code: "IMPORT_CSV_EMPTY",
          severity: "error",
          message: "csv has no data rows",
        },
      ],
    };
  }
  const header = rows[0]!.map((h) => h.toUpperCase());
  const required = ["ID", "NAME", "CATEGORY", "WIDTH", "HEIGHT", "DEPTH", "SKU"];
  for (const col of required) {
    if (!header.includes(col)) {
      const d = {
        code: "IMPORT_CSV_HEADER",
        severity: "error" as const,
        message: `missing column ${col}`,
      };
      return { ...err([d]), diagnostics: [d] };
    }
  }
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const diagnostics: Diagnostic[] = [];
  const modules = [];
  for (const row of rows.slice(1)) {
    const id = row[idx.ID!] ?? "";
    const name = row[idx.NAME!] ?? id;
    const category = row[idx.CATEGORY!] ?? "imported";
    const width = Number(row[idx.WIDTH!]);
    const height = Number(row[idx.HEIGHT!]);
    const depth = Number(row[idx.DEPTH!]);
    const sku = row[idx.SKU!] ?? id;
    modules.push(
      createModuleDraft({
        id,
        name,
        category,
        priceSku: sku,
        params: [
          {
            key: "widthMm",
            label: "Width",
            kind: "number",
            unit: "mm",
            default: width,
          },
          {
            key: "heightMm",
            label: "Height",
            kind: "number",
            unit: "mm",
            default: height,
          },
          {
            key: "depthMm",
            label: "Depth",
            kind: "number",
            unit: "mm",
            default: depth,
          },
        ],
        panels: [],
        bom: [],
      }),
    );
    diagnostics.push({
      code: "IMPORT_MISSING_MACHINING",
      severity: "warning",
      message: `module ${id} imported without machining recipes`,
      path: id,
    });
  }
  const pack: CatalogPack = {
    id: "imported_csv",
    name: "Imported CSV Catalog",
    version: 1,
    materials: [],
    hardware: [],
    modules,
  };
  return { ...ok(pack), diagnostics };
}
