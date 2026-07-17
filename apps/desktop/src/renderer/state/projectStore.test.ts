import { describe, expect, it } from "vitest";
import { useProjectStore } from "./projectStore";

describe("projectStore", () => {
  it("tracks instance count after local scene replace", () => {
    useProjectStore.setState({
      scene: {
        room: { widthMm: 4000, depthMm: 3000, heightMm: 2700 },
        instances: [
          {
            id: "inst_1",
            moduleId: "base_box",
            position: { x: 0, y: 0, z: 0 },
            rotationYDeg: 0,
            paramOverrides: {},
            materialOverrides: {},
          },
        ],
        selection: [],
      },
    });
    expect(useProjectStore.getState().scene.instances).toHaveLength(1);
  });
});
