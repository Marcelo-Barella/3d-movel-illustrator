import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, ProviderResponse } from "../types.js";

export const anthropicProvider: LlmProvider = {
  id: "anthropic",
  async complete(req): Promise<ProviderResponse> {
    const client = new Anthropic({ apiKey: req.apiKey });
    const tools = req.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: {
        type: "object" as const,
        ...(t.parameters as object),
      },
    }));
    const system = req.messages
      .filter((m) => m.role === "system")
      .map((m) => ("content" in m ? m.content : ""))
      .join("\n");
    type AnthropicMessage = {
      role: "user" | "assistant";
      content:
        | string
        | Array<
            | { type: "tool_result"; tool_use_id: string; content: string }
            | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
          >;
    };
    const messages: AnthropicMessage[] = [];
    for (const m of req.messages.filter((msg) => msg.role !== "system")) {
      if (m.role === "tool") {
        const block = {
          type: "tool_result" as const,
          tool_use_id: m.toolCallId,
          content: m.content,
        };
        const last = messages[messages.length - 1];
        if (
          last?.role === "user" &&
          Array.isArray(last.content) &&
          last.content[0]?.type === "tool_result"
        ) {
          last.content.push(block);
        } else {
          messages.push({ role: "user", content: [block] });
        }
        continue;
      }
      if (m.role === "assistant" && "toolCalls" in m && m.toolCalls) {
        messages.push({
          role: "assistant",
          content: m.toolCalls.map((c) => ({
            type: "tool_use" as const,
            id: c.id,
            name: c.name,
            input: c.arguments as Record<string, unknown>,
          })),
        });
        continue;
      }
      messages.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: "content" in m ? (m.content ?? "") : "",
      });
    }

    const response = await client.messages.create({
      model: req.model,
      max_tokens: 2048,
      system: system || undefined,
      messages,
      tools: tools.length ? tools : undefined,
    });

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    if (toolUses.length > 0) {
      return {
        message: {
          role: "assistant",
          content: null,
          toolCalls: toolUses.map((b) => ({
            id: b.id,
            name: b.name,
            arguments: b.input,
          })),
        },
      };
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return { message: { role: "assistant", content: text } };
  },
};
