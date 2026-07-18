import type { CatalogPack } from "@movel/catalog";
import type { Diagnostic, Result } from "@movel/shared";

export type ImportResult = Result<CatalogPack> & {
  diagnostics?: Diagnostic[];
};
