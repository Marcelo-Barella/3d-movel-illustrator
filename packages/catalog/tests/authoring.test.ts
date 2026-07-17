import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createModuleDraft,
  loadPackFromDir,
  loadSamplePack,
  savePackToDir,
  setBomRecipe,
  setPanelRecipe,
} from "../src/index";

describe("authoring", () => {
  it("round-trips pack to temp dir", async () => {
    const dir = await mkdtemp(join(tmpdir(), "movel-pack-"));
    try {
      const pack = loadSamplePack();
      const draft = createModuleDraft({ id: "custom_1", name: "Custom" });
      const withPanel = setPanelRecipe(draft, {
        id: "p1",
        label: "Panel",
        materialKey: "carcass",
        lengthFormula: "600",
        widthFormula: "400",
        thicknessMm: 18,
        grain: "none",
        ops: [{ kind: "contour", shape: "rect" }],
      });
      expect(withPanel.ok).toBe(true);
      const withBom = setBomRecipe(withPanel.ok ? withPanel.value : draft, [
        { sku: "HW-X", description: "x", qtyFormula: "1" },
      ]);
      expect(withBom.ok).toBe(true);
      const saved = await savePackToDir(pack, dir);
      expect(saved.ok).toBe(true);
      const loaded = await loadPackFromDir(dir);
      expect(loaded.ok).toBe(true);
      if (loaded.ok) {
        expect(loaded.value.modules.length).toBe(pack.modules.length);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
