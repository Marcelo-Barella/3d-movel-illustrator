import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene, History } from "@movel/scene";
import { runAgentTurn } from "../src/loop";
import { DEFAULT_SETTINGS } from "../src/policies";
import { mockProvider } from "../src/providers/mock";
import type { ToolContext } from "../src/types";

describe("loop mock", () => {
  it("places module via mock provider", async () => {
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
      mode: "command",
      settings: DEFAULT_SETTINGS,
      confirm: async () => true,
    };
    const result = await runAgentTurn({
      provider: mockProvider,
      apiKey: "test",
      model: "mock",
      mode: "command",
      messages: [{ role: "user", content: "place a base box" }],
      ctx,
      maxRounds: 4,
    });
    expect(ctx.history.state.instances).toHaveLength(1);
    expect(result.messages.length).toBeGreaterThan(1);
  });
});
