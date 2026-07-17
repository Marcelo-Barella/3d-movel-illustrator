import OpenAI from "openai";
import type { LlmProvider, ProviderResponse } from "../types.js";

export function createOpenAIProvider(baseURL?: string, id = "openai"): LlmProvider {
  return {
    id,
    async complete(req): Promise<ProviderResponse> {
      const client = new OpenAI({
        apiKey: req.apiKey,
        baseURL,
      });
      const tools = req.tools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters as Record<string, unknown>,
        },
      }));
      const messages = req.messages.map((m) => {
        if (m.role === "tool") {
          return {
            role: "tool" as const,
            tool_call_id: m.toolCallId,
            content: m.content,
          };
        }
        if (m.role === "assistant" && "toolCalls" in m && m.toolCalls) {
          return {
            role: "assistant" as const,
            content: m.content,
            tool_calls: m.toolCalls.map((c) => ({
              id: c.id,
              type: "function" as const,
              function: {
                name: c.name,
                arguments: JSON.stringify(c.arguments),
              },
            })),
          };
        }
        return {
          role: m.role as "system" | "user" | "assistant",
          content: "content" in m ? (m.content ?? "") : "",
        };
      });
      const completion = await client.chat.completions.create({
        model: req.model,
        messages,
        tools: tools.length ? tools : undefined,
      });
      const choice = completion.choices[0]?.message;
      if (!choice) {
        return { message: { role: "assistant", content: "" } };
      }
      if (choice.tool_calls && choice.tool_calls.length > 0) {
        return {
          message: {
            role: "assistant",
            content: choice.content,
            toolCalls: choice.tool_calls.map((c) => ({
              id: c.id,
              name: c.function.name,
              arguments: JSON.parse(c.function.arguments || "{}") as unknown,
            })),
          },
        };
      }
      return {
        message: { role: "assistant", content: choice.content ?? "" },
      };
    },
  };
}

export const openaiProvider = createOpenAIProvider();
