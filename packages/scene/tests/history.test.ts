import { describe, expect, it } from "vitest";
import { History } from "../src/history";
import { createEmptyScene } from "../src/project-scene";

describe("History", () => {
  it("places and undoes a module", () => {
    const h = new History(
      createEmptyScene({ widthMm: 4000, depthMm: 3000, heightMm: 2700 }),
    );
    const r = h.push({
      type: "place",
      moduleId: "base_cabinet",
      position: { x: 0, y: 0, z: 0 },
      rotationYDeg: 0,
      paramOverrides: {},
      materialOverrides: {},
    });
    expect(r.ok).toBe(true);
    expect(h.state.instances).toHaveLength(1);
    h.undo();
    expect(h.state.instances).toHaveLength(0);
  });

  it("groups multiple places into one undo", () => {
    const h = new History(
      createEmptyScene({ widthMm: 4000, depthMm: 3000, heightMm: 2700 }),
    );
    h.beginGroup();
    h.push({
      type: "place",
      moduleId: "a",
      position: { x: 0, y: 0, z: 0 },
      rotationYDeg: 0,
      paramOverrides: {},
      materialOverrides: {},
    });
    h.push({
      type: "place",
      moduleId: "b",
      position: { x: 1, y: 0, z: 0 },
      rotationYDeg: 0,
      paramOverrides: {},
      materialOverrides: {},
    });
    const ended = h.endGroup();
    expect(ended.ok).toBe(true);
    expect(h.state.instances).toHaveLength(2);
    h.undo();
    expect(h.state.instances).toHaveLength(0);
  });
});
