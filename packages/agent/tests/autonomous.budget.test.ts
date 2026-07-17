import { describe, expect, it } from "vitest";
import { loadSamplePack } from "@movel/catalog";
import { createEmptyScene, History } from "@movel/scene";
import { runAgentTurn } from "../src/loop";
import type { LlmProvider, ToolContext } from "../src/types";

const busyProvider: LlmProvider = {
  id: "busy",
  async complete() {
    return {
      message: {
        role: "assistant",
        content: null,
        toolCalls: [
          {
            id: "c1",
            name: "list_catalog",
            arguments: {},
          },
        ],
      },
    };
  },
};

describe("autonomous budget", () => {
  it("emits AGENT_STEP_BUDGET", async () => {
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
      mode: "autonomous",
      settings: { maxSteps: 2, autonomousAutoApplySmallPlans: false },
      confirm: async () => true,
    };
    const result = await runAgentTurn({
      provider: busyProvider,
      apiKey: "x",
      model: "x",
      mode: "autonomous",
      messages: [{ role: "user", content: "keep going" }],
      ctx,
      maxRounds: 10,
    });
    expect(
      result.diagnostics.some((d) => d.code === "AGENT_STEP_BUDGET"),
    ).toBe(true);
  });
});
