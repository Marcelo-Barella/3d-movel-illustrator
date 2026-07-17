import { useState } from "react";
import { useProjectStore } from "../state/projectStore";

export function CommercialPanel() {
  const commercial = useProjectStore((s) => s.commercial);
  const refresh = useProjectStore((s) => s.refresh);
  const [customerName, setCustomerName] = useState("Customer");
  const [status, setStatus] = useState("");

  return (
    <div className="panel">
      <section>
        <h3>Commercial</h3>
        <div className="row">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <button
            type="button"
            onClick={async () => {
              await window.movel?.commercial.upsertCustomer({
                name: customerName,
              });
              await window.movel?.commercial.upsertPriceTable({
                name: "Default",
                bindings: [
                  { sku: "MOD-BASE-BOX", unitPrice: 450, currency: "BRL" },
                  { sku: "HW-CONFIRMAT", unitPrice: 0.5, currency: "BRL" },
                  { sku: "HW-SHELF-PIN", unitPrice: 0.2, currency: "BRL" },
                ],
              });
              await refresh();
              setStatus("Customer + price table saved");
            }}
          >
            Upsert customer/prices
          </button>
        </div>
        <button
          type="button"
          onClick={async () => {
            const customer = commercial.customers[0];
            const table = commercial.priceTables[0];
            if (!customer || !table || !window.movel) {
              setStatus("Need customer and price table");
              return;
            }
            const built = await window.movel.commercial.buildQuote({
              customerId: customer.id,
              priceTableId: table.id,
            });
            setStatus(JSON.stringify(built));
            await refresh();
          }}
        >
          Build quote from scene
        </button>
        <button
          type="button"
          onClick={async () => {
            const quoteId = useProjectStore.getState().commercial.activeQuoteId;
            if (!quoteId || !window.movel) return;
            const issued = await window.movel.commercial.issueQuote(quoteId);
            setStatus(JSON.stringify(issued));
            await refresh();
          }}
        >
          Issue revision
        </button>
        <button
          type="button"
          onClick={async () => {
            const quoteId = useProjectStore.getState().commercial.activeQuoteId;
            if (!quoteId || !window.movel) return;
            const handoff = await window.movel.commercial.handoff(quoteId);
            setStatus(JSON.stringify(handoff));
          }}
        >
          Order handoff
        </button>
        <p style={{ fontSize: 12 }}>{status}</p>
        <small>
          {commercial.customers.length} customers · {commercial.quotes.length}{" "}
          quotes
        </small>
      </section>
    </div>
  );
}
