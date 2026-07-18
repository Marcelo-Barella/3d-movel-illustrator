import { describe, expect, it } from "vitest";
import { importPromobBestEffort } from "../src/promob-best-effort";

describe("promob best effort", () => {
  it("returns IMPORT_PMOB_UNSUPPORTED without throwing", () => {
    const r = importPromobBestEffort(Buffer.from([0, 1, 2, 3]), "pmob");
    expect(r.ok).toBe(false);
    expect(
      r.diagnostics.some((d) => d.code === "IMPORT_PMOB_UNSUPPORTED"),
    ).toBe(true);
  });
});
