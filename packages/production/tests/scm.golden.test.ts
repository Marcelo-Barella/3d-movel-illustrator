import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSamplePack, resolveParams } from "@movel/catalog";
import { createEmptyScene } from "@movel/scene";
import { buildMachiningIR } from "../src/build-machining-ir";
import { getAdapter } from "../src/adapters/registry";

const here = dirname(fileURLToPath(import.meta.url));

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n");
}

describe("scm golden", () => {
  it("matches simple-box left side xilog", () => {
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
      paramOverrides: { widthMm: 600, heightMm: 720, depthMm: 560, shelfCount: 1 },
      materialOverrides: {},
    });
    const ir = buildMachiningIR(scene, pack);
    const result = getAdapter("scm").emit(ir);
    const left = result.files.find((f) =>
      f.relativePath.includes("inst_golden_left"),
    );
    expect(left).toBeTruthy();
    const expected = normalize(
      readFileSync(
        join(here, "goldens/scm/simple-box/inst_golden_left_left_side.xilog.txt"),
        "utf8",
      ),
    );
    expect(normalize(String(left!.contents))).toBe(expected);
  });
});
