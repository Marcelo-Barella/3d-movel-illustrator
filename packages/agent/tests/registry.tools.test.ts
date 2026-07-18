import { describe, expect, it } from "vitest";
import { getToolsForMode } from "../src/registry";
import { deepseekProvider } from "../src/providers/deepseek";

describe("agent registry completeness", () => {
  it("exposes plan tools including customers and nesting export", () => {
    const command = getToolsForMode("command").map((t) => t.name);
    for (const name of [
      "list_customers",
      "upsert_customer",
      "export_nesting",
      "export_documents",
      "export_cnc",
      "export_order_handoff",
      "build_quote",
      "issue_quote_revision",
    ]) {
      expect(command).toContain(name);
    }
    const ask = getToolsForMode("ask").map((t) => t.name);
    expect(ask).toContain("list_customers");
    expect(ask).toContain("list_catalog");
    expect(ask).not.toContain("upsert_customer");
  });

  it("deepseek provider uses deepseek id", () => {
    expect(deepseekProvider.id).toBe("deepseek");
  });
});
