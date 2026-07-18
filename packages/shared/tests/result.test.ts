import { describe, expect, it } from "vitest";
import { ok, err, isOk } from "../src/result";

describe("result", () => {
  it("wraps ok values", () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toBe(42);
  });

  it("wraps diagnostics on err", () => {
    const r = err([{ code: "X", severity: "error", message: "nope" }]);
    expect(isOk(r)).toBe(false);
  });
});
