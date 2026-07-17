import {
  buildQuoteFromScene,
  createOrderHandoff,
  issueRevision,
} from "@movel/commercial";
import { z } from "zod";
import type { ToolSpec } from "../types.js";

const buildQuoteSchema = z.object({
  customerId: z.string(),
  priceTableId: z.string(),
});

export const buildQuoteTool: ToolSpec = {
  name: "build_quote",
  description: "Build a quote from the current scene",
  mode: ["command", "build", "autonomous"],
  inputSchema: buildQuoteSchema,
  async execute(ctx, input) {
    const parsed = buildQuoteSchema.parse(input);
    if (ctx.mode === "ask") {
      return {
        ok: false,
        diagnostics: [
          {
            code: "ASK_READONLY",
            severity: "error",
            message: "build_quote is not available in ask mode",
          },
        ],
      };
    }
    const table = ctx.commercial.priceTables.find(
      (p) => p.id === parsed.priceTableId,
    );
    if (!table) {
      return {
        ok: false,
        diagnostics: [
          {
            code: "PRICE_TABLE_MISSING",
            severity: "error",
            message: "price table not found",
          },
        ],
      };
    }
    const quote = buildQuoteFromScene(
      ctx.history.state,
      ctx.pack,
      table,
      parsed.customerId,
      ctx.currency,
    );
    ctx.commercial.quotes.push(quote);
    ctx.commercial.activeQuoteId = quote.id;
    return { ok: true, data: quote };
  },
};

export const issueQuoteRevisionTool: ToolSpec = {
  name: "issue_quote_revision",
  description: "Issue the active quote revision",
  mode: ["command", "build", "autonomous"],
  inputSchema: z.object({ quoteId: z.string() }),
  async execute(ctx, input) {
    const { quoteId } = z.object({ quoteId: z.string() }).parse(input);
    const idx = ctx.commercial.quotes.findIndex((q) => q.id === quoteId);
    if (idx < 0) {
      return {
        ok: false,
        diagnostics: [
          {
            code: "QUOTE_MISSING",
            severity: "error",
            message: "quote not found",
          },
        ],
      };
    }
    const issued = issueRevision(ctx.commercial.quotes[idx]!);
    if (!issued.ok) return { ok: false, diagnostics: issued.diagnostics };
    ctx.commercial.quotes[idx] = issued.value;
    return { ok: true, data: issued.value };
  },
};

export const exportDocumentsTool: ToolSpec = {
  name: "export_documents",
  description: "Request production documents export",
  mode: ["command", "build", "autonomous"],
  inputSchema: z.object({ outDir: z.string().optional() }),
  async execute(ctx, input) {
    if (ctx.mode === "autonomous") {
      const okConfirm = await ctx.confirm("export documents", input);
      if (!okConfirm) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "AGENT_CONFIRM_DENIED",
              severity: "warning",
              message: "export cancelled",
            },
          ],
        };
      }
    }
    return { ok: true, data: { action: "export_documents", input } };
  },
};

export const exportCncTool: ToolSpec = {
  name: "export_cnc",
  description: "Request CNC adapter export",
  mode: ["command", "build", "autonomous"],
  inputSchema: z.object({
    adapters: z.array(z.enum(["scm", "homag", "biesse", "generic"])).default(["scm"]),
    outDir: z.string().optional(),
  }),
  async execute(ctx, input) {
    if (ctx.mode === "autonomous") {
      const okConfirm = await ctx.confirm("export cnc", input);
      if (!okConfirm) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "AGENT_CONFIRM_DENIED",
              severity: "warning",
              message: "export cancelled",
            },
          ],
        };
      }
    }
    return { ok: true, data: { action: "export_cnc", input } };
  },
};

export const exportOrderHandoffTool: ToolSpec = {
  name: "export_order_handoff",
  description: "Create order handoff from quote",
  mode: ["command", "build", "autonomous"],
  inputSchema: z.object({
    quoteId: z.string(),
    policy: z.enum(["block", "warn"]).default("block"),
  }),
  async execute(ctx, input) {
    const parsed = z
      .object({
        quoteId: z.string(),
        policy: z.enum(["block", "warn"]).default("block"),
      })
      .parse(input);
    if (ctx.mode === "autonomous") {
      const okConfirm = await ctx.confirm("export order handoff", parsed);
      if (!okConfirm) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "AGENT_CONFIRM_DENIED",
              severity: "warning",
              message: "handoff cancelled",
            },
          ],
        };
      }
    }
    const quote = ctx.commercial.quotes.find((q) => q.id === parsed.quoteId);
    if (!quote) {
      return {
        ok: false,
        diagnostics: [
          {
            code: "QUOTE_MISSING",
            severity: "error",
            message: "quote not found",
          },
        ],
      };
    }
    const handoff = createOrderHandoff({
      quote,
      policy: parsed.policy,
    });
    return handoff.ok
      ? { ok: true, data: handoff.value }
      : { ok: false, diagnostics: handoff.diagnostics };
  },
};
