import { describe, expect, it } from "vitest";
import { expandPanels, loadSamplePack, resolveParams } from "../src/index";

describe("sample pack", () => {
  it("loads seven modules", () => {
    const pack = loadSamplePack();
    expect(pack.modules.map((m) => m.id).sort()).toEqual(
      [
        "base_box",
        "door_panel",
        "drawer_box",
        "filler",
        "shelf_unit",
        "tall_box",
        "wall_box",
      ].sort(),
    );
  });

  it("expands base_box panels", () => {
    const pack = loadSamplePack();
    const mod = pack.modules.find((m) => m.id === "base_box")!;
    const params = resolveParams(mod, {});
    const panels = expandPanels(mod, params, pack.materials);
    expect(panels.length).toBeGreaterThanOrEqual(1);
    expect(panels[0]!.lengthMm).toBeGreaterThan(0);
  });
});
