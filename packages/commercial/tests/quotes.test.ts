import { describe, expect, it } from "vitest";
import { createOrderHandoff } from "../src/handoff";
import { issueRevision, mutateIssuedClone } from "../src/quotes";
import type { Quote } from "../src/types";

describe("handoff", () => {
  it("blocks handoff when unpriced", () => {
    const q: Quote = {
      id: "q1",
      customerId: "c1",
      status: "draft",
      revision: 0,
      currency: "BRL",
      lines: [
        {
          id: "l1",
          sku: "X",
          description: "x",
          qty: 1,
          unitPrice: null,
          source: "manual",
        },
      ],
    };
    const r = createOrderHandoff({ quote: q, policy: "block" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.diagnostics.some((d) => d.code === "PRICE_BINDING_MISSING")).toBe(
        true,
      );
    }
  });
});

describe("quotes", () => {
  it("issues revision and clones for mutation", () => {
    const q: Quote = {
      id: "q1",
      customerId: "c1",
      status: "draft",
      revision: 0,
      currency: "BRL",
      lines: [
        {
          id: "l1",
          sku: "X",
          description: "x",
          qty: 1,
          unitPrice: 10,
          source: "manual",
        },
      ],
    };
    const issued = issueRevision(q);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(issued.value.status).toBe("issued");
    const clone = mutateIssuedClone(issued.value);
    expect(clone.ok).toBe(true);
    if (!clone.ok) return;
    expect(clone.value.status).toBe("draft");
    expect(clone.value.id).not.toBe(issued.value.id);
  });
});
