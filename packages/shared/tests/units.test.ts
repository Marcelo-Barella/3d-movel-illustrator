import { describe, expect, it } from "vitest";
import { assertPositiveMm } from "../src/units";

describe("units", () => {
  it("accepts positive mm", () => {
    expect(assertPositiveMm(12.5)).toBe(12.5);
  });

  it("rejects non-positive", () => {
    expect(() => assertPositiveMm(0)).toThrow();
    expect(() => assertPositiveMm(-1)).toThrow();
  });
});
