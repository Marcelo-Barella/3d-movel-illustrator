# 3d-movel-illustrator

Local-first Electron desktop app for AI-assisted modular cabinetry design, commercial quoting, and multi-CNC factory export.

## Install

```bash
pnpm install
```

Requires Node 22+ and pnpm 10+.

## Develop

```bash
pnpm dev
```

Starts the Electron + React shell (`@movel/desktop`).

## BYOK (bring your own key)

In **Settings**, choose provider (`openai`, `anthropic`, `deepseek`) and model, then save an API key.

Keys are stored in the OS keychain via `keytar` (service name `3d-movel-illustrator`). They are never written into `*.movelproj/project.json`.

For CI/smoke without keytar:

```bash
export MOVEL_E2E_SKIP_KEYTAR=1
```

A mock provider is available for offline agent tests (`provider=mock`).

## AI modes

- **Ask** — read-only catalog/scene tools
- **Command** — single mutating tools
- **Build** — layout propose/apply with confirm
- **Autonomous** — multi-step with step budget (default 24); exports and destructive ops still confirm

## Projects

Projects are folders ending in `.movelproj` containing `project.json` (+ optional `assets/`). Schema version is `1`. Units are millimeters.

## Export overview

**Export production bundle** writes under `{project}/exports/{timestamp}/`:

- `documents/` — BOM, cut list, edgeband, hardware CSV, summary PDF, cut list XLSX
- `nesting/parts.csv` — frozen nesting header for external optimizers
- `{scm|homag|biesse|generic}/` — CNC adapter outputs

Adapters shipping in v1:

| Id | Format |
|----|--------|
| `scm` | Maestro/Xilog intermediate (`movel-scm-v1`) |
| `homag` | Simplified `.mpr` macros |
| `biesse` | Simplified `.bpp`-like text |
| `generic` | DXF rectangle + ISO G-code |

## Commercial

Create customers and price bindings, build a quote from the scene, issue a revision, then run order handoff. Default `handoffPolicy` is `block` when any line is unpriced.

Handoff folders: `{project}/handoff/{quoteId}_r{rev}/` with `manifest.json` and `quote.pdf`.

## Catalog import limits

- Sample pack + in-app authoring are the guaranteed paths.
- CSV catalog list and ERP `ITEM_BASE` XML import map into Catalog IR with `IMPORT_MISSING_MACHINING` warnings until recipes are authored.
- Promob **PMOB** binaries are **not** supported in v1 (`IMPORT_PMOB_UNSUPPORTED`). Use tabular exports.

## Tests

```bash
pnpm test
pnpm acceptance
```

Electron smoke (when a display / xvfb is available):

```bash
xvfb-run -a pnpm test:e2e
```

Skip Electron launch in constrained environments with `MOVEL_E2E_SKIP=1` (unit coverage still runs for project I/O).

## Workspace packages

- `@movel/shared` — Result/Diagnostic, ids, units
- `@movel/scene` — room, instances, History
- `@movel/catalog` — parametric modules, sample pack
- `@movel/production` — Machining IR + CNC adapters
- `@movel/commercial` — customers, quotes, PDF
- `@movel/agent` — tools, providers, policies
- `@movel/importers` — CSV / ERP XML / Promob best-effort
- `@movel/desktop` — Electron shell
