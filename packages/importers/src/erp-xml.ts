import { createModuleDraft, type CatalogPack } from "@movel/catalog";
import { err, ok, type Diagnostic } from "@movel/shared";
import type { CatalogImportResult } from "./csv-list.js";

function tagText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim();
}

export function importErpBaseItemXml(xml: string): CatalogImportResult {
  const items = xml.split(/<ITEM_BASE\b/i).slice(1);
  if (items.length === 0) {
    const d = {
      code: "IMPORT_XML_EMPTY",
      severity: "error" as const,
      message: "no ITEM_BASE nodes",
    };
    return { ...err([d]), diagnostics: [d] };
  }
  const diagnostics: Diagnostic[] = [];
  const modules = [];
  for (const chunk of items) {
    const block = `<ITEM_BASE${chunk}`;
    const id = tagText(block, "ID") ?? tagText(block, "CODE") ?? `item_${modules.length}`;
    const name = tagText(block, "DESCRIPTION") ?? tagText(block, "NAME") ?? id;
    const width = Number(tagText(block, "WIDTH") ?? "600");
    const height = Number(tagText(block, "HEIGHT") ?? "720");
    const depth = Number(tagText(block, "DEPTH") ?? "560");
    modules.push(
      createModuleDraft({
        id,
        name,
        category: "erp",
        priceSku: id,
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
    id: "imported_erp_xml",
    name: "Imported ERP Catalog",
    version: 1,
    materials: [],
    hardware: [],
    modules,
  };
  return { ...ok(pack), diagnostics };
}
