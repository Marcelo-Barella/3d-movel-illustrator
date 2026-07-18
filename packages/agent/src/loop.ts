import type { Diagnostic } from "@movel/shared";
import { getToolsForMode } from "./registry.js";
import type {
  ChatMessage,
  LlmProvider,
  ToolContext,
  ToolResult,
} from "./types.js";

function zodToJsonSchemaRough(toolName: string): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: true,
    description: `arguments for ${toolName}`,
  };
}

export async function runAgentTurn(args: {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  mode: ToolContext["mode"];
  messages: ChatMessage[];
  ctx: ToolContext;
  maxRounds: number;
}): Promise<{ messages: ChatMessage[]; diagnostics: Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  const messages = [...args.messages];
  const tools = getToolsForMode(args.mode);
  const toolParams = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchemaRough(t.name),
  }));

  let rounds = 0;
  while (rounds < args.maxRounds) {
    rounds += 1;
    if (args.mode === "autonomous" && rounds > args.ctx.settings.maxSteps) {
      diagnostics.push({
        code: "AGENT_STEP_BUDGET",
        severity: "error",
        message: `exceeded autonomous step budget ${args.ctx.settings.maxSteps}`,
      });
      break;
    }

    const response = await args.provider.complete({
      apiKey: args.apiKey,
      model: args.model,
      messages,
      tools: toolParams,
    });

    messages.push(response.message);

    const toolCalls =
      response.message.role === "assistant" &&
      "toolCalls" in response.message &&
      response.message.toolCalls
        ? response.message.toolCalls
        : [];

    if (toolCalls.length === 0) {
      break;
    }

    for (const call of toolCalls) {
      const tool = tools.find((t) => t.name === call.name);
      let result: ToolResult;
      if (!tool) {
        result = {
          ok: false,
          diagnostics: [
            {
              code: "TOOL_UNKNOWN",
              severity: "error",
              message: `unknown tool ${call.name}`,
            },
          ],
        };
      } else {
        try {
          result = await tool.execute(args.ctx, call.arguments);
        } catch (e) {
          result = {
            ok: false,
            diagnostics: [
              {
                code: "TOOL_THROW",
                severity: "error",
                message: e instanceof Error ? e.message : String(e),
              },
            ],
          };
        }
      }
      if (result.diagnostics) diagnostics.push(...result.diagnostics);
      messages.push({
        role: "tool",
        toolCallId: call.id,
        name: call.name,
        content: JSON.stringify(result),
      });
    }
  }

  return { messages, diagnostics };
}
