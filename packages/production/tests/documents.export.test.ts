import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene } from "@movel/scene";
import { buildDocuments, buildMachiningIR, toNestingCsv } from "../src/index";

describe("documents export helpers", () => {
  it("builds cut list and nesting for sample scene", () => {
    const pack = loadSamplePack();
    const scene = createEmptyScene({
      widthMm: 4000,
      depthMm: 3000,
      heightMm: 2700,
    });
    scene.instances.push({
      id: "inst_1",
      moduleId: "base_box",
      position: { x: 0, y: 0, z: 0 },
      rotationYDeg: 0,
      paramOverrides: {},
      materialOverrides: {},
    });
    const ir = buildMachiningIR(scene, pack);
    const docs = buildDocuments(ir);
    expect(docs.cutList.rows.length).toBeGreaterThan(0);
    expect(toNestingCsv(ir).startsWith("PartId,")).toBe(true);
  });
});
