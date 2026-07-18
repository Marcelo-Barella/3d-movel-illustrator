import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene } from "@movel/scene";
import { buildMachiningIR } from "../src/build-machining-ir";
import { listAdapters } from "../src/adapters/registry";

describe("adapters contract", () => {
  it("emits files for same IR across all adapters", () => {
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
    expect(ir.parts.length).toBeGreaterThan(0);

    for (const adapter of listAdapters()) {
      expect(adapter.capabilities.has("contour")).toBe(true);
      expect(adapter.capabilities.has("drill")).toBe(true);
      expect(adapter.capabilities.has("groove")).toBe(true);
      const result = adapter.emit(ir);
      expect(result.files.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.report)).toBe(true);
    }
  });
});
