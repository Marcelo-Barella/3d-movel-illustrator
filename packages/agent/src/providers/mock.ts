import type { LlmProvider, ProviderRequest, ProviderResponse } from "../types.js";

export const mockProvider: LlmProvider = {
  id: "mock",
  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const alreadyPlaced = req.messages.some(
      (m) => m.role === "tool" && m.name === "place_module",
    );
    if (alreadyPlaced) {
      return {
        message: {
          role: "assistant",
          content: "Placed module.",
        },
      };
    }
    return {
      message: {
        role: "assistant",
        content: null,
        toolCalls: [
          {
            id: "call_1",
            name: "place_module",
            arguments: {
              moduleId: "base_box",
              position: { x: 0, y: 0, z: 0 },
              rotationYDeg: 0,
              paramOverrides: {},
              materialOverrides: {},
            },
          },
        ],
      },
    };
  },
};
