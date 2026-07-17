import { describe, expect, it } from "vitest";
import { createCustomer } from "../src/customers";
import { renderQuotePdf } from "../src/pdf-quote";
import type { Quote } from "../src/types";

describe("pdf", () => {
  it("renders non-empty buffer", async () => {
    const customer = createCustomer({ name: "Acme" });
    const quote: Quote = {
      id: "q1",
      customerId: customer.id,
      status: "draft",
      revision: 0,
      currency: "BRL",
      lines: [
        {
          id: "l1",
          sku: "MOD-BASE-BOX",
          description: "Base",
          qty: 1,
          unitPrice: 100,
          source: "manual",
        },
      ],
    };
    const buf = await renderQuotePdf(quote, customer);
    expect(buf.byteLength).toBeGreaterThan(100);
  });
});
