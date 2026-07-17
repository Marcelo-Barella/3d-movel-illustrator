import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene, History } from "@movel/scene";
import { placeModuleTool } from "../src/tools/place_module";
import { DEFAULT_SETTINGS } from "../src/policies";
import type { ToolContext } from "../src/types";

function ctx(): ToolContext {
  return {
    history: new History(
      createEmptyScene({ widthMm: 4000, depthMm: 3000, heightMm: 2700 }),
    ),
    pack: loadSamplePack(),
    commercial: {
      customers: [],
      priceTables: [],
      quotes: [],
      activeQuoteId: null,
    },
    mode: "command",
    settings: DEFAULT_SETTINGS,
    confirm: async () => true,
  };
}

describe("place_module tool", () => {
  it("places into history", async () => {
    const c = ctx();
    const r = await placeModuleTool.execute(c, {
      moduleId: "base_box",
      position: { x: 0, y: 0, z: 0 },
    });
    expect(r.ok).toBe(true);
    expect(c.history.state.instances).toHaveLength(1);
  });
});
