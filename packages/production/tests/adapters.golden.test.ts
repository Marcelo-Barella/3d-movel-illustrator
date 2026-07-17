import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene } from "@movel/scene";
import { buildMachiningIR } from "../src/build-machining-ir";
import { getAdapter } from "../src/adapters/registry";

const here = dirname(fileURLToPath(import.meta.url));

function fixtureIr() {
  const pack = loadSamplePack();
  const scene = createEmptyScene({
    widthMm: 4000,
    depthMm: 3000,
    heightMm: 2700,
  });
  scene.instances.push({
    id: "inst_golden",
    moduleId: "base_box",
    position: { x: 0, y: 0, z: 0 },
    rotationYDeg: 0,
    paramOverrides: {
      widthMm: 600,
      heightMm: 720,
      depthMm: 560,
      shelfCount: 1,
    },
    materialOverrides: {},
  });
  return buildMachiningIR(scene, pack);
}

describe("adapter goldens", () => {
  it("homag left panel", () => {
    const ir = fixtureIr();
    const left = ir.parts.find((p) => p.partId.endsWith("_left"))!;
    const result = getAdapter("homag").emit({ parts: [left], diagnostics: [] });
    const file = result.files[0]!;
    const expected = readFileSync(
      join(here, "goldens/homag/left.mpr"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(String(file.contents).replace(/\r\n/g, "\n")).toBe(expected);
  });

  it("biesse left panel", () => {
    const ir = fixtureIr();
    const left = ir.parts.find((p) => p.partId.endsWith("_left"))!;
    const result = getAdapter("biesse").emit({ parts: [left], diagnostics: [] });
    const expected = readFileSync(
      join(here, "goldens/biesse/left.bpp"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(String(result.files[0]!.contents).replace(/\r\n/g, "\n")).toBe(
      expected,
    );
  });

  it("generic dxf exists", () => {
    const ir = fixtureIr();
    const left = ir.parts.find((p) => p.partId.endsWith("_left"))!;
    const result = getAdapter("generic").emit({
      parts: [left],
      diagnostics: [],
    });
    const dxf = result.files.find((f) => f.relativePath.endsWith(".dxf"))!;
    const expected = readFileSync(
      join(here, "goldens/generic/left.dxf"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(String(dxf.contents).replace(/\r\n/g, "\n")).toBe(expected);
  });
});
