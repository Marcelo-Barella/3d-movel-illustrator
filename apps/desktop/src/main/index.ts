import { loadSamplePack } from "@movel/catalog";
import {
  createCustomer,
  createOrderHandoff,
  createPriceTable,
  buildQuoteFromScene,
  issueRevision,
  renderQuotePdf,
} from "@movel/commercial";
import { importCatalogListCsv } from "@movel/importers";
import { History } from "@movel/scene";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { mkdir, writeFile, cp } from "node:fs/promises";
import { join } from "node:path";
import { exportProductionBundle } from "./export-service";
import { getKey, setKey } from "./keychain";
import { runChat } from "./llm-bridge";
import {
  createEmptyProject,
  loadProject,
  saveProject,
  type ProjectState,
} from "./project-io";

let mainWindow: BrowserWindow | null = null;
let projectDir: string | null = null;
let project: ProjectState = createEmptyProject();
let history = new History(project.scene);
let pack = loadSamplePack();
let pendingConfirm:
  | { resolve: (v: boolean) => void; prompt: string; payload: unknown }
  | null = null;

function syncProjectFromHistory(): void {
  project = { ...project, scene: history.state };
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("project:get", () => {
  syncProjectFromHistory();
  return { project, projectDir, pack };
});

ipcMain.handle("project:new", async (_e, name?: string) => {
  project = createEmptyProject(name ?? "Demo");
  history = new History(project.scene);
  pack = loadSamplePack();
  projectDir = null;
  return { project, pack };
});

ipcMain.handle("project:save", async (_e, dir?: string) => {
  syncProjectFromHistory();
  const target = dir ?? projectDir;
  if (!target) {
    return { ok: false, diagnostics: [{ code: "NO_DIR", message: "no project dir" }] };
  }
  const result = await saveProject(target, project);
  if (result.ok) projectDir = target;
  return result;
});

ipcMain.handle("project:load", async (_e, dir: string) => {
  const result = await loadProject(dir);
  if (!result.ok) return result;
  project = result.value;
  history = new History(project.scene);
  pack = loadSamplePack();
  projectDir = dir;
  return { ok: true, value: { project, pack } };
});

ipcMain.handle("project:pushCommand", (_e, cmd) => {
  const r = history.push(cmd);
  syncProjectFromHistory();
  return r;
});

ipcMain.handle("project:undo", () => {
  history.undo();
  syncProjectFromHistory();
  return project.scene;
});

ipcMain.handle("project:redo", () => {
  const r = history.redo();
  syncProjectFromHistory();
  return r;
});

ipcMain.handle("keys:set", async (_e, providerId: string, key: string) => {
  await setKey(providerId, key);
  return { ok: true };
});

ipcMain.handle("keys:has", async (_e, providerId: string) => {
  const key = await getKey(providerId);
  return { has: Boolean(key) };
});

ipcMain.handle(
  "agent:chat",
  async (
    _e,
    payload: {
      providerId: string;
      model: string;
      mode: "ask" | "command" | "build" | "autonomous";
      messages: unknown[];
    },
  ) => {
    const result = await runChat({
      providerId: payload.providerId,
      model: payload.model,
      mode: payload.mode,
      messages: payload.messages as never,
      history,
      pack,
      commercial: project.commercial,
      confirm: (prompt, data) =>
        new Promise((resolve) => {
          pendingConfirm = { resolve, prompt, payload: data };
          mainWindow?.webContents.send("agent:confirm-request", {
            prompt,
            payload: data,
          });
        }),
    });
    syncProjectFromHistory();
    return { ...result, scene: history.state, commercial: project.commercial };
  },
);

ipcMain.handle("agent:confirm", (_e, accepted: boolean) => {
  pendingConfirm?.resolve(accepted);
  pendingConfirm = null;
  return { ok: true };
});

ipcMain.handle(
  "export:production",
  async (
    _e,
    payload: { adapters?: Array<"scm" | "homag" | "biesse" | "generic"> },
  ) => {
    syncProjectFromHistory();
    const base =
      projectDir ?? join(app.getPath("temp"), "movel-export-project");
    await mkdir(base, { recursive: true });
    const outDir = join(base, "exports", String(Date.now()));
    return exportProductionBundle({
      scene: history.state,
      pack,
      adapters: payload.adapters ?? [project.settings.defaultCncAdapter],
      outDir,
    });
  },
);

ipcMain.handle("commercial:upsertCustomer", (_e, customer) => {
  const c = createCustomer(customer);
  project.commercial.customers = [
    ...project.commercial.customers.filter((x) => x.id !== c.id),
    c,
  ];
  return c;
});

ipcMain.handle("commercial:upsertPriceTable", (_e, table) => {
  const t = createPriceTable(table);
  project.commercial.priceTables = [
    ...project.commercial.priceTables.filter((x) => x.id !== t.id),
    t,
  ];
  return t;
});

ipcMain.handle(
  "commercial:buildQuote",
  (_e, payload: { customerId: string; priceTableId: string }) => {
    const table = project.commercial.priceTables.find(
      (p) => p.id === payload.priceTableId,
    );
    if (!table) return { ok: false };
    syncProjectFromHistory();
    const quote = buildQuoteFromScene(
      history.state,
      pack,
      table,
      payload.customerId,
      project.settings.currency,
    );
    project.commercial.quotes.push(quote);
    project.commercial.activeQuoteId = quote.id;
    return { ok: true, value: quote };
  },
);

ipcMain.handle("commercial:issueQuote", (_e, quoteId: string) => {
  const idx = project.commercial.quotes.findIndex((q) => q.id === quoteId);
  if (idx < 0) return { ok: false };
  const issued = issueRevision(project.commercial.quotes[idx]!);
  if (issued.ok) project.commercial.quotes[idx] = issued.value;
  return issued;
});

ipcMain.handle("commercial:handoff", async (_e, quoteId: string) => {
  const quote = project.commercial.quotes.find((q) => q.id === quoteId);
  if (!quote) return { ok: false };
  const handoff = createOrderHandoff({
    quote,
    policy: project.settings.handoffPolicy,
  });
  if (!handoff.ok) return handoff;
  const base = projectDir ?? join(app.getPath("temp"), "movel-handoff");
  const dir = join(
    base,
    "handoff",
    `${quote.id}_r${quote.revision}`,
  );
  await mkdir(dir, { recursive: true });
  const customer =
    project.commercial.customers.find((c) => c.id === quote.customerId) ??
    createCustomer({ name: "Unknown" });
  const pdf = await renderQuotePdf(quote, customer);
  await writeFile(join(dir, "quote.pdf"), pdf);
  await writeFile(
    join(dir, "manifest.json"),
    `${JSON.stringify(handoff.value, null, 2)}\n`,
  );
  return { ok: true, value: { dir, manifest: handoff.value } };
});

ipcMain.handle("catalog:importCsv", async (_e, text: string) => {
  const result = importCatalogListCsv(text);
  if (result.ok) pack = result.value;
  return result;
});

ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : result.filePaths[0] ?? null;
});

ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile"],
  });
  return result.canceled ? null : result.filePaths[0] ?? null;
});

void cp;
