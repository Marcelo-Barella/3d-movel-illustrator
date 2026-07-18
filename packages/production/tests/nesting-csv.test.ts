import { describe, expect, it } from "vitest";
import { toNestingCsv } from "../src/nesting-csv";
import { listAdapters } from "../src/adapters/registry";

describe("nesting csv", () => {
  it("uses frozen header", () => {
    const csv = toNestingCsv({ parts: [], hardware: [], diagnostics: [] });
    expect(csv.split("\n")[0]).toBe(
      "PartId,Label,Material,ThicknessMm,LengthMm,WidthMm,Grain,Quantity,EdgeBandL,EdgeBandW,EdgeBandR,EdgeBandB,ModuleInstanceId,MaterialSku",
    );
  });
});

describe("adapters", () => {
  it("registers all four", () => {
    expect(listAdapters().map((a) => a.id).sort()).toEqual([
      "biesse",
      "generic",
      "homag",
      "scm",
    ]);
  });
});
