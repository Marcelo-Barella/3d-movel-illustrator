import {
  buildDocuments,
  buildMachiningIR,
  docTableToCsv,
  getAdapter,
  toNestingCsv,
  type CncAdapterId,
} from "@movel/production";
import type { CatalogPack } from "@movel/catalog";
import type { SceneState } from "@movel/scene";
import { err, ok, type Result } from "@movel/shared";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

async function writePdfSummary(
  path: string,
  title: string,
  lines: string[],
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", async () => {
      try {
        await writeFile(path, Buffer.concat(chunks));
        resolve();
      } catch (e) {
        reject(e);
      }
    });
    doc.on("error", reject);
    doc.fontSize(16).text(title);
    doc.moveDown();
    for (const line of lines) doc.fontSize(10).text(line);
    doc.end();
  });
}

async function writeXlsx(
  path: string,
  sheets: Array<{ name: string; headers: string[]; rows: Array<Array<string | number>> }>,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name);
    ws.addRow(sheet.headers);
    for (const row of sheet.rows) ws.addRow(row);
  }
  await wb.xlsx.writeFile(path);
}

export async function exportProductionBundle(input: {
  scene: SceneState;
  pack: CatalogPack;
  adapters: CncAdapterId[];
  outDir: string;
}): Promise<Result<{ outDir: string; reportPath: string }>> {
  try {
    const ir = buildMachiningIR(input.scene, input.pack);
    const docs = buildDocuments(ir);
    const documentsDir = join(input.outDir, "documents");
    const nestingDir = join(input.outDir, "nesting");
    await mkdir(documentsDir, { recursive: true });
    await mkdir(nestingDir, { recursive: true });

    await writeFile(join(documentsDir, "bom.csv"), docTableToCsv(docs.bom));
    await writeFile(
      join(documentsDir, "cutlist.csv"),
      docTableToCsv(docs.cutList),
    );
    await writeFile(
      join(documentsDir, "edgeband.csv"),
      docTableToCsv(docs.edgeBand),
    );
    await writeFile(
      join(documentsDir, "hardware.csv"),
      docTableToCsv(docs.hardware),
    );
    await writePdfSummary(
      join(documentsDir, "summary.pdf"),
      "Production summary",
      [`parts=${ir.parts.length}`, `diagnostics=${ir.diagnostics.length}`],
    );
    await writeXlsx(join(documentsDir, "cutlist.xlsx"), [
      {
        name: "CutList",
        headers: docs.cutList.headers,
        rows: docs.cutList.rows,
      },
    ]);
    await writeFile(join(nestingDir, "parts.csv"), toNestingCsv(ir));

    const reportLines: string[] = [];
    for (const id of input.adapters) {
      const adapter = getAdapter(id);
      const emitted = adapter.emit(ir);
      for (const file of emitted.files) {
        const full = join(input.outDir, file.relativePath);
        await mkdir(join(full, ".."), { recursive: true });
        await writeFile(full, file.contents);
      }
      for (const d of emitted.report) {
        reportLines.push(`${id}:${d.severity}:${d.code}:${d.message}`);
      }
    }
    for (const d of ir.diagnostics) {
      reportLines.push(`ir:${d.severity}:${d.code}:${d.message}`);
    }
    const reportPath = join(input.outDir, "report.txt");
    await writeFile(reportPath, `${reportLines.join("\n")}\n`);
    return ok({ outDir: input.outDir, reportPath });
  } catch (e) {
    return err([
      {
        code: "EXPORT_FAILED",
        severity: "error",
        message: e instanceof Error ? e.message : String(e),
      },
    ]);
  }
}
