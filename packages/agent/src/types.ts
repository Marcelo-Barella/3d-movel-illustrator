import type { CatalogPack } from "@movel/catalog";
import type { CommercialState } from "@movel/commercial";
import type { History } from "@movel/scene";
import type { Diagnostic } from "@movel/shared";
import type { ZodType } from "zod";

export type AgentMode = "ask" | "command" | "build" | "autonomous";

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  diagnostics?: Diagnostic[];
};

export type AgentSettings = {
  maxSteps: number;
  autonomousAutoApplySmallPlans: boolean;
};

export type ToolContext = {
  history: History;
  pack: CatalogPack;
  commercial: CommercialState;
  currency: string;
  mode: AgentMode;
  settings: AgentSettings;
  confirm: (prompt: string, payload: unknown) => Promise<boolean>;
};

export type ToolSpec = {
  name: string;
  description: string;
  mode: AgentMode[];
  inputSchema: ZodType;
  readonly?: boolean;
  execute: (ctx: ToolContext, input: unknown) => Promise<ToolResult>;
};

export type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "tool";
      toolCallId: string;
      name: string;
      content: string;
    }
  | {
      role: "assistant";
      content: string | null;
      toolCalls: Array<{
        id: string;
        name: string;
        arguments: unknown;
      }>;
    };

export type ProviderRequest = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  tools: Array<{ name: string; description: string; parameters: unknown }>;
};

export type ProviderResponse = {
  message: ChatMessage;
};

export type LlmProvider = {
  id: string;
  complete: (req: ProviderRequest) => Promise<ProviderResponse>;
};

export type LayoutPlan = {
  planId: string;
  placements: Array<{
    moduleId: string;
    position: { x: number; y: number; z: number };
    rotationYDeg: number;
    paramOverrides: Record<string, number | string | boolean>;
    materialOverrides: Record<string, string>;
  }>;
};
