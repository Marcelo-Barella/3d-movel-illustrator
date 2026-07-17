import { z } from "zod";
import type { ToolSpec } from "../types.js";

const empty = z.object({});
const searchSchema = z.object({ query: z.string() });

export const listCatalogTool: ToolSpec = {
  name: "list_catalog",
  description: "List catalog modules",
  mode: ["ask", "command", "build", "autonomous"],
  readonly: true,
  inputSchema: empty,
  async execute(ctx) {
    return {
      ok: true,
      data: ctx.pack.modules.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
      })),
    };
  },
};

export const searchCatalogTool: ToolSpec = {
  name: "search_catalog",
  description: "Search catalog modules by query",
  mode: ["ask", "command", "build", "autonomous"],
  readonly: true,
  inputSchema: searchSchema,
  async execute(ctx, input) {
    const { query } = searchSchema.parse(input);
    const q = query.toLowerCase();
    return {
      ok: true,
      data: ctx.pack.modules.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      ),
    };
  },
};
