import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene } from "@movel/scene";
import { exportProductionBundle } from "../main/export-service";

describe("export bundle", () => {
  it("writes nesting header and scm folder", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "movel-export-"));
    try {
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
      const result = await exportProductionBundle({
        scene,
        pack,
        adapters: ["scm"],
        outDir,
      });
      expect(result.ok).toBe(true);
      const nesting = await readFile(join(outDir, "nesting/parts.csv"), "utf8");
      expect(nesting.split("\n")[0]).toContain("PartId,Label,Material");
      const manifest = await readFile(
        join(outDir, "scm/manifest.json"),
        "utf8",
      );
      expect(manifest).toContain("scm");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
