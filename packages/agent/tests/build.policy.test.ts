import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene, History } from "@movel/scene";
import { applyLayoutTool } from "../src/tools/propose_layout";
import { DEFAULT_SETTINGS } from "../src/policies";
import type { ToolContext } from "../src/types";

describe("build policy", () => {
  it("requires confirm for apply_layout in build mode", async () => {
    let asked = false;
    const ctx: ToolContext = {
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
      currency: "BRL",
      mode: "build",
      settings: DEFAULT_SETTINGS,
      confirm: async () => {
        asked = true;
        return false;
      },
    };
    const r = await applyLayoutTool.execute(ctx, {
      planId: "p1",
      plan: {
        placements: [
          {
            moduleId: "base_box",
            position: { x: 0, y: 0, z: 0 },
          },
        ],
      },
    });
    expect(asked).toBe(true);
    expect(r.ok).toBe(false);
    expect(ctx.history.state.instances).toHaveLength(0);
  });
});
