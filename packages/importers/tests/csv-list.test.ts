import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { importCatalogListCsv } from "../src/csv-list";

const here = dirname(fileURLToPath(import.meta.url));

describe("csv list import", () => {
  it("imports modules with machining warnings", () => {
    const text = readFileSync(join(here, "fixtures/catalog-list.csv"), "utf8");
    const r = importCatalogListCsv(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.modules.length).toBeGreaterThan(0);
    expect(
      r.diagnostics.some((d) => d.code === "IMPORT_MISSING_MACHINING"),
    ).toBe(true);
  });
});
