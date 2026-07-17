# AI Cabinetry Desktop (3d-movel-illustrator) — Design Spec

**Date:** 2026-07-17  
**Status:** Draft for user review (brainstorming complete; implementation plan next)  
**Working title:** 3d-movel-illustrator  
**Related goal:** Promob Studio–class cabinetry workflow with an AI chat sidebar as the primary command surface

---

## 1. Problem and goal

Furniture manufacturers and designers need a desktop system that covers design, commercial quoting, and factory handoff. Promob Studio already owns much of that market. This product deliberately does **not** clone Promob’s dense UI. It delivers an **AI-first thin client**: a 3D viewport plus chat sidebar that drives a structured modular cabinetry engine through to **production-grade** software quality and **manufacturing-ready** outputs.

### Success criteria (v1)

1. Local-first Electron app; single user; projects as files on disk; no required account.
2. AI chat (BYOK: OpenAI, Anthropic, DeepSeek) supports Q&A, simple commands, guided builds, and autonomous from-scratch builds — all via typed tools.
3. Generic modular cabinetry (parametric boxes, shelves, doors, drawers, fillers) — not kitchen/closet-specific builders yet.
4. Empty scene + typed room dimensions (simple room box). No floor-plan or SketchUp import in v1.
5. Catalog: bundled sample pack + in-app authoring + importers (Promob/other best-effort).
6. Full commercial: customers, price tables, quote revisions, order handoff bundle.
7. Full factory bridge: BOM/docs + nesting CSV + CNC adapters for SCM (Maestro/Xilog), HOMAG (woodWOP), Biesse, and generic DXF + ISO G-code — **all selectable from day one**; SCM is the reference (deepest tests/fixtures).
8. Offline for design/save/quote-file generation/export; network required only for LLM chat.

### Explicitly out of v1

- Cloud accounts, multi-user org sync, SaaS backend.
- Floor-plan / `.skp` architectural import.
- Kitchen/closet-specific wizard builders (beyond generic modules).
- VR / 360 / Real-Scene-style AI rendering.
- Guaranteed lossless reverse-engineering of proprietary Promob PMOB binaries.
- Live paid LLM calls as CI merge gates.

---

## 2. Users and primary UX

**Primary user:** a single designer/estimator/production prep person at a furniture shop, working on one machine.

**Primary chrome:**

- Center: 3D viewport (orbit/pan/zoom, select, basic manipulators).
- Right: AI chat sidebar (mode switch: Ask / Command / Build / Autonomous).
- Collapsible secondary panels: catalog browser, properties, commercial, export.

AI is the preferred power path; mouse/UI remains available and shares the same undoable command layer.

---

## 3. Architecture (Approach 2)

Thin Electron shell over **modular domain packages** and **shared intermediate representations (IRs)**. UI never owns business truth; Three.js meshes are derived views.

### Process split

| Process | Responsibility |
|---------|----------------|
| Renderer | React UI, Three.js viewport, chat presentation |
| Main / Node | Project I/O, keychain, LLM HTTP, export writers, heavy jobs |

### Packages

```text
apps/desktop/           Electron + React shell
packages/scene/         Scene IR, room box, placement, history
packages/catalog/       Catalog IR, sample pack, authoring APIs
packages/production/    Machining IR, docs, nesting CSV, CNC adapters
packages/commercial/    Customers, price tables, quotes, order handoff
packages/agent/         Providers, tool registry, agent loop, policies
packages/importers/     External → Catalog IR (+ validation reports)
packages/shared/        IDs, units, Result/Diagnostic, schema versions
```

### Non-negotiable rules

1. UI is thin; chat + canvas first.
2. AI mutates only through schema-validated tools → transactional IR commands.
3. One Machining IR feeds all CNC adapters.
4. Local-first; secrets never stored in project files.
5. Diagnostics are structured and shared by UI, chat, and export reports.

---

## 4. Intermediate representations

### 4.1 Scene IR

- Room: width, depth, height (typed); floor + four walls; no openings in v1.
- Instances: catalog module id, transform, parameter overrides, material overrides, stable instance id.
- Selection set for UI/agent context.
- History: shared command stack for human and AI edits.

### 4.2 Catalog IR

- Module templates: parameters, defaults, BOM recipe, machining recipe hooks, commercial SKU hooks.
- Materials: thickness, grain, edge-band rules, cost hooks.
- Hardware entries referenced by BOM recipes.
- Packs on disk; project references active pack + optional per-project overrides.

### 4.3 Machining IR

- Parts (panels) with material, grain, edge bands, dimensions.
- Operations: contour, drill, groove/dado (extensible enum), in part-local coordinates.
- Nesting CSV schema (stable columns) for external optimizers.
- Adapter interface: `emit(machiningIR, options) → { files, report }`.
- Adapters shipping in v1: `scm`, `homag`, `biesse`, `generic`.

### 4.4 Commercial IR

- Customers (local records).
- Price tables (versioned bindings from SKU/formula → unit price).
- Quotes: line items (from scene explode + manual), revisions (issued revisions immutable).
- Order handoff: frozen quote revision + manifest of production export paths in a local folder bundle.

---

## 5. Agent and tools

### Providers

- OpenAI, Anthropic, DeepSeek via BYOK.
- Keys in OS keychain / encrypted app settings; selectable default model per provider.

### Modes

| Mode | Behavior |
|------|----------|
| Ask | Read-only tools; explain selection, BOM, prices, export readiness |
| Command | Single-shot mutating tools |
| Build | Multi-step plan with preview/diff and confirm checkpoints |
| Autonomous | Longer runs with step budget; still confirm exports and destructive clears |

### Example tools

`set_room_dimensions`, `list_catalog`, `search_catalog`, `place_module`, `move_instance`, `set_params`, `set_material`, `remove_instance`, `propose_layout`, `apply_layout`, `list_customers`, `upsert_customer`, `build_quote`, `issue_quote_revision`, `export_documents`, `export_nesting`, `export_cnc`, `export_order_handoff`.

### Guardrails

- Zod (or equivalent) schemas on all tool args.
- Allowlisted tools only (no arbitrary shell).
- Max tool rounds / Autonomous step budget in settings.
- Redacted chat/logs (no API keys).

---

## 6. Data flows

### Design

User/LLM → validated tool → domain command → history → IR update → viewport/inspectors re-render.

### Build from scratch

Brief in chat → propose layout plan → confirm (Build) or policy continue (Autonomous) → transactional apply → optional refine commands.

### Commercial

Scene → BOM explode + price table → quote → PDF/XLSX → order handoff folder.

### Production

Scene + machining recipes → Machining IR → documents + nesting CSV + one or many CNC adapters → timestamped export folder + generation report.

### Import

External source → mapper → Catalog IR pack + validation report (unmapped fields, missing machining/prices flagged).

### Persistence

Project file/folder on disk holds Scene IR, commercial state, catalog override refs, schema version. Chat transcripts optional under user data (redacted). Dirty-buffer debounce + crash recovery journal in main process.

---

## 7. Error handling

- Domain `Result` + `Diagnostic[]` with stable codes and severities.
- Import: never crash app; always report.
- CNC: per-part/per-op success/skip/fail in report; no silent drops.
- Missing machining blocks CNC for that part; docs may still generate.
- Missing prices: draft quotes allowed; order handoff blocked or warn-acknowledge (setting).
- Corrupt project: refuse open; no silent half-load.
- LLM errors typed (auth, rate limit, network); design remains usable offline.

---

## 8. Promob / external catalog import (honest constraints)

- Promob **PMOB** is a proprietary Catalog geometry format; v1 does **not** promise full binary fidelity.
- Supported import avenues (priority order):
  1. Native sample pack / authoring (guaranteed path).
  2. Tabular exports (Catalog list CSV, ERP/base-item style CSV/XML) mapped into Catalog IR.
  3. Other open geometry/side-car formats if available.
  4. Best-effort Promob-related files with explicit validation gaps.
- Modules imported without machining recipes cannot CNC-export until authored; without price bindings they remain unpriced on quotes until mapped.

---

## 9. Testing strategy

- Unit tests on all domain packages without Electron/Three.js.
- Golden fixtures: fixed project → BOM/cut list/nesting snapshots; SCM deep goldens; other adapters at least one golden or normalized AST each.
- Agent tests with mocked providers; optional nightly live BYOK smoke (not merge-gated).
- Desktop smoke E2E: new/save/open, mocked chat place, export folder, keys absent from project file.
- Acceptance = v1 success criteria in Section 1.

---

## 10. Technology preferences (guidance for implementation plan)

Not rigidly locked, but preferred defaults unless the implementation plan finds blockers:

- **Electron** + **React** + **TypeScript** monorepo (pnpm or npm workspaces).
- **Three.js** (or React Three Fiber) for viewport.
- **Zod** for IR/tool schemas; schema version field on project files.
- Main-process LLM SDK calls; renderer via IPC.
- PDF generation via a maintained Node library; XLSX via a spreadsheet library.
- Unit test runner: Vitest (or Jest); E2E: Playwright against Electron if practical, else Spectron-class alternative — decide in implementation plan.

---

## 11. Delivery stance within v1

v1 is one product release with a large surface. Implementation must still be **modular and milestone-ordered**, but **skeletons of all CNC adapters and all AI modes ship** — not “SCM only then maybe others.” Depth order for hardening:

1. Sample catalog + Scene + undo + viewport + Ask/Command tools  
2. Machining IR + documents + nesting + SCM adapter goldens  
3. HOMAG / Biesse / generic adapters to contract completeness  
4. Build + Autonomous agent policies  
5. Commercial full path  
6. Catalog authoring + importers  

(Exact task breakdown belongs in the implementation plan after this spec is approved.)

---

## 12. Open decisions deferred to implementation plan

- Exact project file format (single JSON vs SQLite package folder).
- Exact nesting CSV column schema (document and freeze in `packages/production`).
- Per-adapter file naming conventions matching shop practice.
- PDF layout templates for quotes and cut lists.
- Whether order handoff “block vs warn” default is block.

These are not TBDs for product intent; they are engineering choices that must be fixed in the plan without changing this spec’s scope.

---

## 13. Spec self-review notes (2026-07-17)

- Placeholders: none material; deferred items listed only as implementation choices in Section 12.
- Consistency: AI-first thin client aligns with full commercial/factory via IR/tools, not via Promob UI clone.
- Scope: large but bounded by out-of-v1 list; Promob PMOB honesty clause prevents false promises.
- Ambiguity: “all CNC from start” clarified as all adapters shipping with capability reports; SCM deepest.
