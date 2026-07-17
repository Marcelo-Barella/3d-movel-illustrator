import PDFDocument from "pdfkit";
import type { Customer, Quote } from "./types.js";

export async function renderQuotePdf(
  quote: Quote,
  customer: Customer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Quote", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Customer: ${customer.name}`);
    doc.text(`Quote: ${quote.id} r${quote.revision}`);
    doc.text(`Status: ${quote.status}`);
    doc.text(`Currency: ${quote.currency}`);
    doc.moveDown();
    for (const line of quote.lines) {
      const price =
        line.unitPrice === null ? "UNPRICED" : String(line.unitPrice);
      doc.text(
        `${line.sku} | ${line.description} | qty ${line.qty} | ${price}`,
      );
    }
    doc.end();
  });
}
