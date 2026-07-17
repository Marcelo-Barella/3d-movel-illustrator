import { describe, expect, it } from "vitest";
import { importErpBaseItemXml } from "../src/erp-xml";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

describe("erp xml import", () => {
  it("imports ITEM_BASE nodes", () => {
    const xml = readFileSync(join(here, "fixtures/base-items.xml"), "utf8");
    const r = importErpBaseItemXml(xml);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.modules.length).toBeGreaterThan(0);
    expect(
      r.diagnostics.some((d) => d.code === "IMPORT_MISSING_MACHINING"),
    ).toBe(true);
  });
});
