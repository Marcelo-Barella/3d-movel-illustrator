import { describe, expect, it } from "vitest";
import { applyCommand } from "../src/commands";
import { createEmptyScene } from "../src/project-scene";

describe("room", () => {
  it("rejects non-positive dimensions", () => {
    const s = createEmptyScene({
      widthMm: 4000,
      depthMm: 3000,
      heightMm: 2700,
    });
    const r = applyCommand(s, {
      type: "set_room",
      room: { widthMm: 0, depthMm: 3000, heightMm: 2700 },
    });
    expect(r.ok).toBe(false);
  });
});
