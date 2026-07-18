import { z } from "zod";
import type { ToolSpec } from "../types.js";

const schema = z.object({
  outDir: z.string().optional(),
});

export const exportNestingTool: ToolSpec = {
  name: "export_nesting",
  description: "Request nesting CSV export",
  mode: ["command", "build", "autonomous"],
  inputSchema: schema,
  async execute(ctx, input) {
    const parsed = schema.parse(input);
    if (ctx.mode === "autonomous") {
      const okConfirm = await ctx.confirm("export nesting", parsed);
      if (!okConfirm) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "AGENT_CONFIRM_DENIED",
              severity: "warning",
              message: "export nesting cancelled",
            },
          ],
        };
      }
    }
    return { ok: true, data: { action: "export_nesting", input: parsed } };
  },
};
