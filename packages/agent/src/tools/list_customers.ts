import { createCustomer, upsertCustomer } from "@movel/commercial";
import { z } from "zod";
import type { ToolSpec } from "../types.js";

const empty = z.object({});

export const listCustomersTool: ToolSpec = {
  name: "list_customers",
  description: "List local customers",
  mode: ["ask", "command", "build", "autonomous"],
  readonly: true,
  inputSchema: empty,
  async execute(ctx) {
    return { ok: true, data: ctx.commercial.customers };
  },
};

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const upsertCustomerTool: ToolSpec = {
  name: "upsert_customer",
  description: "Create or update a customer",
  mode: ["command", "build", "autonomous"],
  inputSchema: upsertSchema,
  async execute(ctx, input) {
    const parsed = upsertSchema.parse(input);
    const customer = createCustomer(parsed);
    ctx.commercial.customers = upsertCustomer(
      ctx.commercial.customers,
      customer,
    );
    return { ok: true, data: customer };
  },
};
