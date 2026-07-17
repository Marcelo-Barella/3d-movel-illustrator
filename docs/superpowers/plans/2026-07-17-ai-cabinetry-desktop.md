# AI Cabinetry Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Electron desktop app (`3d-movel-illustrator`) that designs generic modular cabinetry via an AI chat sidebar (BYOK: OpenAI, Anthropic, DeepSeek), then produces full commercial quotes and a multi-CNC factory bridge.

**Architecture:** Thin Electron + React shell over TypeScript domain packages (`scene`, `catalog`, `production`, `commercial`, `agent`, `importers`, `shared`) with Zod-validated IRs. AI mutates only through typed tools and a shared undo history. One Machining IR feeds SCM, HOMAG, Biesse, and generic DXF/G-code adapters.

**Tech Stack:** pnpm workspaces, TypeScript 5.x, Electron + electron-vite, React 18, Three.js + @react-three/fiber + @react-three/drei, Zod, Vitest, keytar, openai SDK, @anthropic-ai/sdk, DeepSeek via OpenAI-compatible client, exceljs, pdfkit, Playwright (Electron smoke).

**Spec:** `/opt/cursor/artifacts/2026-07-17-ai-cabinetry-desktop-design.md` (copy into `docs/superpowers/specs/` when permitted).

## Global Constraints

- Local-first single user; no required account or cloud sync.
- Secrets (API keys) only in OS keychain via `keytar`; never in project files.
- AI modes required: Ask, Command, Build, Autonomous — all tool-based.
- Catalog: sample pack + authoring + Promob/other best-effort importers (no guaranteed PMOB binary fidelity).
- Room model: empty scene + typed dimensions only (no floor-plan / `.skp` in v1).
- CNC adapters all ship from the start: `scm` (reference depth), `homag`, `biesse`, `generic`.
- Commercial full path: customers, price tables, quote revisions, order handoff.
- Offline for design/save/export; network only for LLM.
- Commits: only when the user has explicitly granted commit permission (user rule).
- Reply/docs in English; no emojis in product UI chrome unless user later requests.

### Locked engineering decisions (spec Section 12)

| Decision | Choice |
|----------|--------|
| Project format | Folder package `Something.movelproj/` containing `project.json` + optional `assets/` |
| Nesting CSV columns | `PartId,Label,Material,ThicknessMm,LengthMm,WidthMm,Grain,Quantity,EdgeBandL,EdgeBandW,EdgeBandR,EdgeBandB,ModuleInstanceId,MaterialSku` |
| CNC output paths | `{exportRoot}/{adapterId}/{partId}_{slug}.{ext}` |
| PDF | `pdfkit` in main/Node |
| XLSX | `exceljs` |
| Order handoff unpriced lines | **Block** by default (`handoffPolicy: "block"`) |
| Package manager | pnpm workspaces |
| Test runner | Vitest |
| Units | millimeters internally; display mm |

---

## File structure (create)

```text
/
  package.json                          # workspace scripts
  pnpm-workspace.yaml
  tsconfig.base.json
  vitest.workspace.ts
  README.md
  docs/superpowers/specs/2026-07-17-ai-cabinetry-desktop-design.md
  docs/superpowers/plans/2026-07-17-ai-cabinetry-desktop.md
  apps/desktop/
    package.json
    electron.vite.config.ts
    src/main/index.ts                   # window, IPC, exports, LLM bridge
    src/main/project-io.ts
    src/main/keychain.ts
    src/main/export-service.ts
    src/main/llm-bridge.ts
    src/preload/index.ts
    src/renderer/main.tsx
    src/renderer/App.tsx
    src/renderer/layout/AppShell.tsx
    src/renderer/viewport/Viewport.tsx
    src/renderer/chat/ChatSidebar.tsx
    src/renderer/panels/{Catalog,Properties,Commercial,Export,Settings}Panel.tsx
    src/renderer/state/projectStore.ts
    e2e/smoke.spec.ts
  packages/shared/
    package.json
    src/index.ts
    src/result.ts
    src/ids.ts
    src/units.ts
    src/diagnostics.ts
    src/schema-version.ts
    tests/*.test.ts
  packages/scene/
    package.json
    src/index.ts
    src/types.ts
    src/room.ts
    src/commands.ts
    src/history.ts
    src/project-scene.ts
    tests/*.test.ts
  packages/catalog/
    package.json
    src/index.ts
    src/types.ts
    src/schema.ts
    src/bom.ts
    src/machining-recipe.ts
    src/authoring.ts
    src/load-pack.ts
    sample-pack/catalog.json
    tests/*.test.ts
  packages/production/
    package.json
    src/index.ts
    src/types.ts
    src/build-machining-ir.ts
    src/documents.ts
    src/nesting-csv.ts
    src/adapters/types.ts
    src/adapters/scm.ts
    src/adapters/homag.ts
    src/adapters/biesse.ts
    src/adapters/generic.ts
    src/adapters/registry.ts
    tests/*.test.ts
    tests/goldens/**
  packages/commercial/
    package.json
    src/index.ts
    src/types.ts
    src/customers.ts
    src/price-tables.ts
    src/quotes.ts
    src/handoff.ts
    src/pdf-quote.ts
    tests/*.test.ts
  packages/agent/
    package.json
    src/index.ts
    src/types.ts
    src/tools/*.ts
    src/registry.ts
    src/loop.ts
    src/policies.ts
    src/providers/{openai,anthropic,deepseek,mock}.ts
    tests/*.test.ts
  packages/importers/
    package.json
    src/index.ts
    src/types.ts
    src/csv-list.ts
    src/erp-xml.ts
    src/promob-best-effort.ts
    tests/fixtures/**
    tests/*.test.ts
```

---

### Task 1: Monorepo scaffold + shared Result/Diagnostic

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.workspace.ts`, `README.md`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/{index,result,ids,units,diagnostics,schema-version}.ts`
- Test: `packages/shared/tests/result.test.ts`, `packages/shared/tests/ids.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `ok<T>(value: T): Ok<T>`
  - `err(diagnostics: Diagnostic[]): Err`
  - `type Diagnostic = { code: string; severity: "info"|"warning"|"error"; message: string; path?: string }`
  - `createId(prefix: string): string`
  - `PROJECT_SCHEMA_VERSION = 1`
  - `MM` unit helpers: `assertPositiveMm(n: number): number`

- [ ] **Step 1: Write the failing test**

```ts
// packages/shared/tests/result.test.ts
import { describe, expect, it } from "vitest";
import { ok, err, isOk } from "../src/result";

describe("result", () => {
  it("wraps ok values", () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toBe(42);
  });

  it("wraps diagnostics on err", () => {
    const r = err([{ code: "X", severity: "error", message: "nope" }]);
    expect(isOk(r)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/shared/tests/result.test.ts`  
Expected: FAIL (package/files missing)

- [ ] **Step 3: Scaffold workspace + implement shared**

Root `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Root `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

Implement `packages/shared/src/result.ts`, `ids.ts` (`createId` = `${prefix}_${crypto.randomUUID()}`), `diagnostics.ts`, `schema-version.ts` exporting `PROJECT_SCHEMA_VERSION = 1`, `units.ts`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm install && pnpm test --filter @movel/shared`  
Expected: PASS

- [ ] **Step 5: Commit** (only if user granted commit permission)

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.workspace.ts packages/shared README.md
git commit -m "chore: scaffold pnpm workspace and @movel/shared"
```

---

### Task 2: Scene IR — room, instances, history

**Files:**
- Create: `packages/scene/package.json`, `packages/scene/src/{index,types,room,commands,history,project-scene}.ts`
- Test: `packages/scene/tests/history.test.ts`, `packages/scene/tests/room.test.ts`

**Interfaces:**
- Consumes: `@movel/shared` (`ok`, `err`, `createId`, `assertPositiveMm`)
- Produces:
  - `type Vec3 = { x: number; y: number; z: number }`
  - `type Room = { widthMm: number; depthMm: number; heightMm: number }`
  - `type ModuleInstance = { id: string; moduleId: string; position: Vec3; rotationYDeg: number; paramOverrides: Record<string, number|string|boolean>; materialOverrides: Record<string, string> }`
  - `type SceneState = { room: Room; instances: ModuleInstance[]; selection: string[] }`
  - `createEmptyScene(room: Room): SceneState`
  - `type SceneCommand = { type: "set_room" | "place" | "move" | "set_params" | "set_materials" | "remove" | "set_selection"; ... }`
  - `applyCommand(state: SceneState, cmd: SceneCommand): Result<SceneState>`
  - `class History { push(cmd); undo(); redo(); get state(): SceneState }`

- [ ] **Step 1: Write failing tests**

```ts
// packages/scene/tests/history.test.ts
import { describe, expect, it } from "vitest";
import { History } from "../src/history";
import { createEmptyScene } from "../src/project-scene";

describe("History", () => {
  it("places and undoes a module", () => {
    const h = new History(createEmptyScene({ widthMm: 4000, depthMm: 3000, heightMm: 2700 }));
    const r = h.push({
      type: "place",
      moduleId: "base_cabinet",
      position: { x: 0, y: 0, z: 0 },
      rotationYDeg: 0,
      paramOverrides: {},
      materialOverrides: {},
    });
    expect(r.ok).toBe(true);
    expect(h.state.instances).toHaveLength(1);
    h.undo();
    expect(h.state.instances).toHaveLength(0);
  });
});
```

```ts
// packages/scene/tests/room.test.ts
import { describe, expect, it } from "vitest";
import { applyCommand } from "../src/commands";
import { createEmptyScene } from "../src/project-scene";

describe("room", () => {
  it("rejects non-positive dimensions", () => {
    const s = createEmptyScene({ widthMm: 4000, depthMm: 3000, heightMm: 2700 });
    const r = applyCommand(s, { type: "set_room", room: { widthMm: 0, depthMm: 3000, heightMm: 2700 } });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm exec vitest run packages/scene/tests`

- [ ] **Step 3: Implement scene package**

`applyCommand` validates room via `assertPositiveMm`. `place` assigns `createId("inst")`. `History` keeps undo/redo stacks of commands and replays from base snapshot (store base + commands, or store inverse — prefer command log replay from immutable base for simplicity).

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(scene): room, instances, undo history`

---

### Task 3: Catalog IR + sample pack + BOM explode

**Files:**
- Create: `packages/catalog/src/{index,types,schema,bom,machining-recipe,authoring,load-pack}.ts`
- Create: `packages/catalog/sample-pack/catalog.json`
- Test: `packages/catalog/tests/bom.test.ts`, `packages/catalog/tests/sample-pack.test.ts`

**Interfaces:**
- Consumes: `@movel/shared`
- Produces:
  - `type ParamDef = { key: string; label: string; kind: "number"|"enum"|"boolean"; unit?: "mm"; min?: number; max?: number; options?: string[]; default: number|string|boolean }`
  - `type BomLineRecipe = { sku: string; description: string; qtyFormula: string }` // qtyFormula: simple expr over params e.g. `"1"` or `"shelfCount"`
  - `type PanelRecipe = { id: string; label: string; materialKey: string; lengthFormula: string; widthFormula: string; thicknessMm: number; grain: "none"|"length"|"width"; ops: MachiningOpRecipe[] }`
  - `type ModuleTemplate = { id: string; name: string; category: string; params: ParamDef[]; defaultMaterials: Record<string,string>; bom: BomLineRecipe[]; panels: PanelRecipe[]; priceSku?: string }`
  - `type CatalogPack = { id: string; name: string; version: number; materials: Material[]; hardware: Hardware[]; modules: ModuleTemplate[] }`
  - `loadSamplePack(): CatalogPack` — reads bundled `sample-pack/catalog.json`
  - `resolveParams(module, overrides): Record<string, number|string|boolean>`
  - `explodeBom(module, params): BomLine[]`
  - `expandPanels(module, params, materials): PanelPart[]` (geometry numbers evaluated)
  - `validateModule(module): Diagnostic[]`
  - `upsertModule(pack, module): Result<CatalogPack>`

**Sample pack minimum modules:** `base_box`, `wall_box`, `tall_box`, `shelf_unit`, `door_panel`, `drawer_box`, `filler` — each with at least one panel recipe and BOM line.

- [ ] **Step 1: Failing test — BOM explode**

```ts
import { describe, expect, it } from "vitest";
import { loadSamplePack, explodeBom, resolveParams } from "../src/index";

describe("sample bom", () => {
  it("explodes base_box hardware", () => {
    const pack = loadSamplePack();
    const mod = pack.modules.find((m) => m.id === "base_box")!;
    const params = resolveParams(mod, { widthMm: 600, heightMm: 720, depthMm: 560 });
    const lines = explodeBom(mod, params);
    expect(lines.some((l) => l.qty >= 1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement catalog + sample JSON**

Use a tiny safe formula evaluator supporting identifiers and `+ - * / ( )` over numeric params only (no `eval`). Reject unknown identifiers with diagnostic.

- [ ] **Step 4: PASS + Step 5: Commit** (if permitted) — `feat(catalog): IR, sample pack, BOM explode`

---

### Task 4: Production — Machining IR, documents, nesting CSV, adapter registry stubs

**Files:**
- Create: `packages/production/src/{index,types,build-machining-ir,documents,nesting-csv}.ts`
- Create: `packages/production/src/adapters/{types,registry,scm,homag,biesse,generic}.ts`
- Test: `packages/production/tests/nesting-csv.test.ts`, `packages/production/tests/adapters-registry.test.ts`

**Interfaces:**
- Consumes: `@movel/catalog`, `@movel/scene`, `@movel/shared`
- Produces:
  - `type MachiningIR = { parts: MachinedPart[]; diagnostics: Diagnostic[] }`
  - `type MachinedPart = { partId: string; label: string; moduleInstanceId: string; materialSku: string; thicknessMm: number; lengthMm: number; widthMm: number; grain: string; edgeBands: { L:string; W:string; R:string; B:string }; ops: MachiningOp[] }`
  - `type MachiningOp = { kind: "contour"|"drill"|"groove"; ... }`
  - `buildMachiningIR(scene, pack): MachiningIR`
  - `buildDocuments(ir): { bom: DocTable; cutList: DocTable; edgeBand: DocTable; hardware: DocTable }`
  - `toNestingCsv(ir): string` — exact header from Global Constraints
  - `type CncAdapter = { id: "scm"|"homag"|"biesse"|"generic"; label: string; capabilities: Set<string>; emit(ir, opts): { files: Array<{ relativePath: string; contents: string|Buffer }>; report: Diagnostic[] } }`
  - `listAdapters(): CncAdapter[]`
  - `getAdapter(id): CncAdapter`

**Adapter stub behavior (this task):** each `emit` writes at least one placeholder file and reports `CNC_STUB` info; real formats land in Tasks 5–6. Registry must return all four ids.

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from "vitest";
import { toNestingCsv } from "../src/nesting-csv";
import { listAdapters } from "../src/adapters/registry";

describe("nesting csv", () => {
  it("uses frozen header", () => {
    const csv = toNestingCsv({ parts: [], diagnostics: [] });
    expect(csv.split("\n")[0]).toBe(
      "PartId,Label,Material,ThicknessMm,LengthMm,WidthMm,Grain,Quantity,EdgeBandL,EdgeBandW,EdgeBandR,EdgeBandB,ModuleInstanceId,MaterialSku"
    );
  });
});

describe("adapters", () => {
  it("registers all four", () => {
    expect(listAdapters().map((a) => a.id).sort()).toEqual(["biesse", "generic", "homag", "scm"]);
  });
});
```

- [ ] **Step 2–4: Implement + PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(production): machining IR, nesting CSV, adapter stubs`

---

### Task 5: SCM adapter (reference depth) + golden fixture

**Files:**
- Modify: `packages/production/src/adapters/scm.ts`
- Create: `packages/production/tests/goldens/scm/simple-box/` (expected files)
- Test: `packages/production/tests/scm.golden.test.ts`

**Interfaces:**
- Consumes: `MachiningIR`
- Produces: SCM-oriented text package:
  - `scm/manifest.json` — parts list
  - `scm/parts/{partId}.xilog.txt` — normalized operation listing (contour rectangle + drills + grooves) suitable as Maestro/Xilog handoff intermediate (documented format in file header comments)
  - Report errors for parts with zero ops or missing material

**Format (freeze):** each `.xilog.txt` line protocol:

```text
# movel-scm-v1 partId=<id>
SIZE L=<mm> W=<mm> T=<mm>
CONTOUR RECT
DRILL X=<mm> Y=<mm> D=<mm> DEPTH=<mm>
GROOVE X=<mm> Y=<mm> LEN=<mm> WIDTH=<mm> DEPTH=<mm> AXIS=<X|Y>
```

- [ ] **Step 1: Build fixture IR in test from sample `base_box` + place in scene; assert golden string match (normalize newlines)**

- [ ] **Step 2–4: Implement real `scm.emit`; update goldens; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(production): SCM reference CNC adapter + goldens`

---

### Task 6: HOMAG, Biesse, generic adapters (contract completeness)

**Files:**
- Modify: `packages/production/src/adapters/{homag,biesse,generic}.ts`
- Create: goldens under `packages/production/tests/goldens/{homag,biesse,generic}/`
- Test: `packages/production/tests/adapters.contract.test.ts`

**Interfaces / formats:**

| Adapter | Emit |
|---------|------|
| `homag` | `.mpr` text macros: `W=<l> L=<w> T=<t>` + `BMX=`/`KMT=` style simplified contour/drill/groove macros (document mapping in `homag.ts` header). Unsupported op → `CNC_UNSUPPORTED_OP` error in report, skip that op |
| `biesse` | `.bpp`-like text: `PAN=L=... W=...` + `BV=` drills / `BG=` grooves simplified |
| `generic` | `{partId}.dxf` (LWPOLYLINE rectangle) + `{partId}.nc` ISO G-code contour (`G0/G1`) |

- [ ] **Step 1: Contract test — same Machining IR to all adapters; each returns ≥1 file; reports array defined; capability checks for `contour`/`drill`/`groove`**

- [ ] **Step 2–4: Implement emitters + one golden each; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(production): HOMAG, Biesse, generic CNC adapters`

---

### Task 7: Commercial IR — customers, prices, quotes, handoff

**Files:**
- Create: `packages/commercial/src/{index,types,customers,price-tables,quotes,handoff,pdf-quote}.ts`
- Test: `packages/commercial/tests/quotes.test.ts`, `packages/commercial/tests/handoff.test.ts`

**Interfaces:**
- Consumes: catalog BOM explode, scene instances, `@movel/shared`
- Produces:
  - `type Customer = { id: string; name: string; email?: string; phone?: string; notes?: string }`
  - `type PriceTable = { id: string; name: string; version: number; bindings: Array<{ sku: string; unitPrice: number; currency: "BRL"|"USD"|"EUR" }> }`
  - `type Quote = { id: string; customerId: string; status: "draft"|"issued"; revision: number; currency: string; lines: QuoteLine[]; issuedAt?: string }`
  - `type QuoteLine = { id: string; sku: string; description: string; qty: number; unitPrice: number|null; source: "scene"|"manual"; instanceId?: string }`
  - `buildQuoteFromScene(scene, pack, priceTable, customerId): Quote` — null unitPrice when unbound
  - `issueRevision(quote): Result<Quote>` — freezes; bumps revision
  - `createOrderHandoff(input: { quote: Quote; productionExportDir?: string; policy: "block"|"warn" }): Result<HandoffManifest>`
  - Default policy `"block"` if any `unitPrice === null`
  - `renderQuotePdf(quote, customer): Buffer` via pdfkit

- [ ] **Step 1: Failing tests — unpriced line blocks handoff; issued quote immutable (second mutate clones)**

```ts
it("blocks handoff when unpriced", () => {
  const q = { /* draft with null unitPrice line */ };
  const r = createOrderHandoff({ quote: q, policy: "block" });
  expect(r.ok).toBe(false);
  expect(r.diagnostics.some((d) => d.code === "PRICE_BINDING_MISSING")).toBe(true);
});
```

- [ ] **Step 2–4: Implement + PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(commercial): customers, quotes, handoff`

---

### Task 8: Agent — tool registry, providers, Ask/Command loop

**Files:**
- Create: `packages/agent/src/{index,types,registry,loop,policies}.ts`
- Create: `packages/agent/src/providers/{types,openai,anthropic,deepseek,mock}.ts`
- Create: `packages/agent/src/tools/{set_room_dimensions,list_catalog,search_catalog,place_module,move_instance,set_params,set_material,remove_instance,build_quote,export_*}.ts`
- Test: `packages/agent/tests/tools.place.test.ts`, `packages/agent/tests/loop.mock.test.ts`

**Interfaces:**
- Consumes: scene History, catalog, commercial, production
- Produces:
  - `type AgentMode = "ask"|"command"|"build"|"autonomous"`
  - `type ToolContext = { history: History; pack: CatalogPack; commercial: CommercialState; mode: AgentMode; confirm: (prompt: string, payload: unknown) => Promise<boolean> }`
  - `type ToolSpec = { name: string; description: string; mode: AgentMode[]; inputSchema: ZodType; readonly?: boolean; execute(ctx, input): Promise<ToolResult> }`
  - `getToolsForMode(mode): ToolSpec[]` — Ask filters `readonly === true` only
  - `type LlmProvider = { id: string; complete(req: ProviderRequest): Promise<ProviderResponse> }`
  - `runAgentTurn(args: { provider; mode; messages; ctx; maxRounds: number }): Promise<{ messages; diagnostics }>`
  - Providers read API key from argument `apiKey: string` (desktop supplies from keytar)

**Mock provider:** returns scripted tool call `place_module` for tests.

- [ ] **Step 1: Failing test — mock loop places module into History**

- [ ] **Step 2–4: Implement tools + mock + openai/anthropic/deepseek clients (DeepSeek baseURL `https://api.deepseek.com`); PASS unit tests without network**

- [ ] **Step 5: Commit** (if permitted) — `feat(agent): tools, providers, Ask/Command loop`

---

### Task 9: Agent — Build + Autonomous policies

**Files:**
- Create: `packages/agent/src/tools/{propose_layout,apply_layout}.ts`
- Modify: `packages/agent/src/policies.ts`, `loop.ts`
- Test: `packages/agent/tests/build.policy.test.ts`, `packages/agent/tests/autonomous.budget.test.ts`

**Interfaces:**
- Produces:
  - `propose_layout({ brief, wall: "back"|"left"|"right"|"front" }): LayoutPlan` where `LayoutPlan = { placements: Array<Omit<place args>> }`
  - `apply_layout({ planId, plan })` — in Build mode requires `confirm()` true; wraps all places in one History transaction (`history.beginGroup()/endGroup()` — add group support to History if missing)
  - Autonomous: `maxSteps` default 24; auto-confirm non-destructive; always `confirm` for `export_*`, `remove` all, `apply_layout` when plan > 5 modules unless setting `autonomousAutoApplySmallPlans`

- [ ] **Step 1–4: Tests for confirm gate + step budget exceeded diagnostic `AGENT_STEP_BUDGET`; implement; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(agent): Build and Autonomous policies`

---

### Task 10: Importers — CSV list, ERP XML, Promob best-effort

**Files:**
- Create: `packages/importers/src/{index,types,csv-list,erp-xml,promob-best-effort}.ts`
- Create: `packages/importers/tests/fixtures/catalog-list.csv`, `base-items.xml`
- Test: `packages/importers/tests/csv-list.test.ts`, `packages/importers/tests/promob-best-effort.test.ts`

**Interfaces:**
- Produces:
  - `importCatalogListCsv(text): Result<CatalogPack>` — columns: `ID,NAME,CATEGORY,WIDTH,HEIGHT,DEPTH,SKU` minimum; modules get empty panels + warning `IMPORT_MISSING_MACHINING`
  - `importErpBaseItemXml(xml): Result<CatalogPack>` — map ITEM_BASE / DESCRIPTION paths
  - `importPromobBestEffort(filePathOrBuffer, kindHint): Result<CatalogPack>` — if kind is tabular, delegate; if unknown/PMOB binary, return err/diagnostics `IMPORT_PMOB_UNSUPPORTED` with empty pack modules and clear message (never throw)

- [ ] **Step 1–4: Fixtures + tests + implement; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(importers): CSV, ERP XML, Promob best-effort`

---

### Task 11: Catalog authoring API completeness

**Files:**
- Modify: `packages/catalog/src/authoring.ts`
- Test: `packages/catalog/tests/authoring.test.ts`

**Interfaces:**
- `createModuleDraft(partial): ModuleTemplate`
- `setPanelRecipe(module, panel): Result<ModuleTemplate>`
- `setBomRecipe(module, bom): Result<ModuleTemplate>`
- `savePackToDir(pack, dir): Promise<Result<void>>` / `loadPackFromDir(dir): Promise<Result<CatalogPack>>`

- [ ] **Step 1–4: Round-trip pack to temp dir; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(catalog): authoring and pack I/O`

---

### Task 12: Desktop shell — Electron app, project I/O, keychain

**Files:**
- Create: `apps/desktop/**` as in file map (main, preload, renderer skeleton)
- Create: `apps/desktop/src/main/{project-io,keychain,export-service,llm-bridge}.ts`
- Test: `apps/desktop/src/main/project-io.test.ts` (vitest node env)

**Interfaces:**
- Project folder `*.movelproj/project.json`:

```json
{
  "schemaVersion": 1,
  "name": "Demo",
  "catalogPackId": "sample",
  "catalogPackPath": null,
  "scene": { "room": {}, "instances": [], "selection": [] },
  "commercial": { "customers": [], "priceTables": [], "quotes": [], "activeQuoteId": null },
  "settings": { "defaultCncAdapter": "scm", "handoffPolicy": "block", "currency": "BRL" }
}
```

- `saveProject(dir, state)`, `loadProject(dir): Result<ProjectState>` — refuse corrupt/missing schema
- `keychain.setKey(providerId, key)`, `getKey(providerId)` via keytar service `3d-movel-illustrator`
- IPC API surface on `window.movel`: `project.*`, `keys.*`, `agent.chat`, `export.*`, `dialog.*`

- [ ] **Step 1: Failing test — save/load round-trip; loaded JSON has no `apiKey` fields**

- [ ] **Step 2–4: Scaffold electron-vite React app; wire main; PASS node tests; `pnpm --filter @movel/desktop dev` launches window**

- [ ] **Step 5: Commit** (if permitted) — `feat(desktop): Electron shell, project I/O, keychain`

---

### Task 13: Viewport + AppShell + panels (thin UI)

**Files:**
- Create: renderer components listed in file map
- Create: `apps/desktop/src/renderer/state/projectStore.ts` (zustand or React context)

**Interfaces:**
- Viewport derives R3F meshes from `SceneState` + catalog dimensions (box primitives per instance; room as five planes)
- Selection syncs to `History` via `set_selection`
- Properties panel edits params through same `applyCommand` path
- ChatSidebar UI for modes + messages + confirm modal
- SettingsPanel: provider select, model string, API key set (write-only display), step budget

- [ ] **Step 1: Manual smoke checklist as automated RTL where possible — store places instance; Viewport receives instances prop length 1**

- [ ] **Step 2–4: Implement UI; no domain logic in components beyond dispatch**

- [ ] **Step 5: Commit** (if permitted) — `feat(desktop): viewport, chat sidebar, panels`

---

### Task 14: Wire exports + documents PDF/XLSX + multi-adapter export

**Files:**
- Modify: `apps/desktop/src/main/export-service.ts`
- Modify: `packages/production/src/documents.ts` if needed for xlsx/pdf buffers
- Test: `packages/production/tests/documents.export.test.ts`

**Interfaces:**
- `exportProductionBundle({ scene, pack, adapters: CncAdapterId[], outDir }): Result<{ outDir: string; reportPath: string }>`
  - Always writes `documents/` (bom.csv, cutlist.csv, edgeband.csv, hardware.csv, summary.pdf)
  - Always writes `nesting/parts.csv`
  - Writes each adapter subfolder
  - Default `outDir` = `{projectDir}/exports/{timestamp}/`
- Chat tool `export_cnc` / `export_documents` / `export_order_handoff` call this via IPC

- [ ] **Step 1–4: Unit test temp dir contains nesting header + scm folder; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(desktop): production export bundle`

---

### Task 15: Commercial UI + quote PDF + order handoff folder

**Files:**
- Modify: `CommercialPanel.tsx`, main export-service handoff
- Test: `packages/commercial/tests/pdf-quote.test.ts`

**Interfaces:**
- UI: create customer, edit price bindings for sample SKUs, build quote from scene, issue revision, handoff button
- Handoff writes `{project}/handoff/{quoteId}_r{rev}/manifest.json` + copies last export + `quote.pdf`

- [ ] **Step 1–4: pdf buffer non-empty; handoff blocked without prices; PASS**

- [ ] **Step 5: Commit** (if permitted) — `feat(desktop): commercial UI and handoff`

---

### Task 16: Catalog browser, authoring UI, importer UI

**Files:**
- Modify: `CatalogPanel.tsx`
- Create: simple authoring form modal (module params + panel list JSON-assisted form)
- Create: import file picker → IPC → importers → validation report view

- [ ] **Step 1–4: Import fixture CSV via IPC in unit/integration test; pack module count > 0; warnings include IMPORT_MISSING_MACHINING**

- [ ] **Step 5: Commit** (if permitted) — `feat(desktop): catalog authoring and import UI`

---

### Task 17: Electron smoke E2E + acceptance script

**Files:**
- Create: `apps/desktop/e2e/smoke.spec.ts`
- Create: `scripts/acceptance-check.mjs` — runs vitest across packages + asserts adapter ids

**E2E cases (Playwright electron):**
1. Launch → set room dimensions → place `base_box` via UI → save project → reopen
2. Mock agent IPC → place via chat command
3. Export bundle → folder exists; `project.json` has no apiKey
4. Settings set key → keytar mock / skip on CI without keytar by env `MOVEL_E2E_SKIP_KEYTAR=1`

- [ ] **Step 1–4: Implement; document `pnpm test:e2e`; CI runs unit always, e2e when display available**

- [ ] **Step 5: Commit** (if permitted) — `test: electron smoke and acceptance script`

---

### Task 18: Docs copy + README usage

**Files:**
- Create: `docs/superpowers/specs/2026-07-17-ai-cabinetry-desktop-design.md` (from artifact)
- Create: `docs/superpowers/plans/2026-07-17-ai-cabinetry-desktop.md` (this plan)
- Modify: `README.md` — install, `pnpm dev`, BYOK setup, export overview, Promob import limits

- [ ] **Step 1: Copy files; README sections exact**

- [ ] **Step 2: Commit** (if permitted) — `docs: add design spec, plan, README`

---

## Spec coverage checklist (self-review)

| Spec requirement | Task(s) |
|------------------|---------|
| Electron local-first single user | 12 |
| BYOK OpenAI/Anthropic/DeepSeek | 8, 12 |
| Ask/Command/Build/Autonomous | 8, 9 |
| Generic modular cabinetry + sample | 3 |
| Typed room dimensions | 2, 13 |
| Catalog authoring | 11, 16 |
| Promob/other import best-effort | 10, 16 |
| Full commercial | 7, 15 |
| Docs + nesting CSV | 4, 14 |
| SCM/HOMAG/Biesse/generic CNC | 4, 5, 6, 14 |
| AI tools only / undo shared | 2, 8, 13 |
| Offline design/export | 12, 14 |
| Structured diagnostics | 1, 4, 10 |
| Testing strategy | all tasks + 17 |
| Out of v1 exclusions | honored (no skp/VR/cloud auth) |

## Placeholder scan

No TBD steps; formats and policies locked in Global Constraints.

## Type consistency

- `History` / `SceneState` / `ModuleInstance` names stable across Tasks 2, 8, 13
- Adapter ids union `"scm"|"homag"|"biesse"|"generic"` stable across 4–6, 14
- `handoffPolicy: "block"|"warn"` default `"block"` across 7, 12, 15

---

## Execution handoff

Plan complete and saved to `/opt/cursor/artifacts/PLAN.md` (Grind plan file).  
Mirror path for the repo (when you allow writes/commits): `docs/superpowers/plans/2026-07-17-ai-cabinetry-desktop.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

**Also confirm:**

- May I copy the design + plan into `docs/superpowers/` and commit?  
- Which execution option (1 or 2)?  
- Grant permission to start execution (required before any code changes in Grind execution phase)?
