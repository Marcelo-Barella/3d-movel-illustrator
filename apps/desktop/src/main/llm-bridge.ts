import {
  DEFAULT_SETTINGS,
  anthropicProvider,
  deepseekProvider,
  mockProvider,
  openaiProvider,
  runAgentTurn,
  type AgentMode,
  type ChatMessage,
  type LlmProvider,
  type ToolContext,
} from "@movel/agent";
import type { CatalogPack } from "@movel/catalog";
import type { CommercialState } from "@movel/commercial";
import type { History } from "@movel/scene";
import { getKey } from "./keychain";

function providerById(id: string): LlmProvider {
  switch (id) {
    case "anthropic":
      return anthropicProvider;
    case "deepseek":
      return deepseekProvider;
    case "mock":
      return mockProvider;
    default:
      return openaiProvider;
  }
}

export async function runChat(input: {
  providerId: string;
  model: string;
  mode: AgentMode;
  messages: ChatMessage[];
  history: History;
  pack: CatalogPack;
  commercial: CommercialState;
  confirm: (prompt: string, payload: unknown) => Promise<boolean>;
  maxRounds?: number;
}): Promise<{ messages: ChatMessage[]; diagnostics: unknown[] }> {
  const apiKey =
    input.providerId === "mock"
      ? "mock"
      : ((await getKey(input.providerId)) ?? "");
  const ctx: ToolContext = {
    history: input.history,
    pack: input.pack,
    commercial: input.commercial,
    mode: input.mode,
    settings: DEFAULT_SETTINGS,
    confirm: input.confirm,
  };
  return runAgentTurn({
    provider: providerById(input.providerId),
    apiKey,
    model: input.model,
    mode: input.mode,
    messages: input.messages,
    ctx,
    maxRounds: input.maxRounds ?? 8,
  });
}
