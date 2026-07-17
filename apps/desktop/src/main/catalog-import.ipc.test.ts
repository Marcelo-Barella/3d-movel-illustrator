import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { importCatalogListCsv } from "@movel/importers";

const fixture = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../packages/importers/tests/fixtures/catalog-list.csv",
);

describe("catalog import via IPC path", () => {
  it("imports fixture CSV with machining warnings", () => {
    const text = readFileSync(fixture, "utf8");
    const result = importCatalogListCsv(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.modules.length).toBeGreaterThan(0);
    expect(
      result.diagnostics.some((d) => d.code === "IMPORT_MISSING_MACHINING"),
    ).toBe(true);
  });
});
