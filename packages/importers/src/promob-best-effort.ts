import { err } from "@movel/shared";
import { importCatalogListCsv, type CatalogImportResult } from "./csv-list.js";

function looksLikeCsv(text: string): boolean {
  const first = text.trim().split(/\r?\n/)[0] ?? "";
  return /ID/i.test(first) && /NAME/i.test(first);
}

export function importPromobBestEffort(
  filePathOrBuffer: string | Buffer,
  kindHint?: "csv" | "xml" | "pmob" | "unknown",
): CatalogImportResult {
  try {
    const kind = kindHint ?? "unknown";
    if (
      kind === "csv" ||
      (kind === "unknown" &&
        typeof filePathOrBuffer === "string" &&
        looksLikeCsv(filePathOrBuffer))
    ) {
      const text =
        typeof filePathOrBuffer === "string"
          ? filePathOrBuffer
          : filePathOrBuffer.toString("utf8");
      return importCatalogListCsv(text);
    }
    const d = {
      code: "IMPORT_PMOB_UNSUPPORTED",
      severity: "error" as const,
      message:
        "Promob PMOB binary is not supported in v1; use CSV/ERP XML tabular exports",
    };
    return { ...err([d]), diagnostics: [d] };
  } catch (e) {
    const d = {
      code: "IMPORT_THROW",
      severity: "error" as const,
      message: e instanceof Error ? e.message : String(e),
    };
    return { ...err([d]), diagnostics: [d] };
  }
}
