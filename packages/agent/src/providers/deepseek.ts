import { createOpenAIProvider } from "./openai.js";

export const deepseekProvider = createOpenAIProvider(
  "https://api.deepseek.com",
  "deepseek",
);
