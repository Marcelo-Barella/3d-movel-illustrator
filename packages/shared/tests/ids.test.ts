import { describe, expect, it } from "vitest";
import { createId } from "../src/ids";

describe("ids", () => {
  it("prefixes uuid", () => {
    const id = createId("inst");
    expect(id.startsWith("inst_")).toBe(true);
    expect(id.length).toBeGreaterThan(10);
  });

  it("creates unique ids", () => {
    expect(createId("a")).not.toBe(createId("a"));
  });
});
