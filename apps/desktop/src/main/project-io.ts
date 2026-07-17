import { PROJECT_SCHEMA_VERSION, err, ok, type Result } from "@movel/shared";
import type { CommercialState } from "@movel/commercial";
import type { SceneState } from "@movel/scene";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ProjectSettings = {
  defaultCncAdapter: "scm" | "homag" | "biesse" | "generic";
  handoffPolicy: "block" | "warn";
  currency: string;
};

export type ProjectState = {
  schemaVersion: number;
  name: string;
  catalogPackId: string;
  catalogPackPath: string | null;
  scene: SceneState;
  commercial: CommercialState;
  settings: ProjectSettings;
};

export function createEmptyProject(name = "Demo"): ProjectState {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name,
    catalogPackId: "sample",
    catalogPackPath: null,
    scene: {
      room: { widthMm: 4000, depthMm: 3000, heightMm: 2700 },
      instances: [],
      selection: [],
    },
    commercial: {
      customers: [],
      priceTables: [],
      quotes: [],
      activeQuoteId: null,
    },
    settings: {
      defaultCncAdapter: "scm",
      handoffPolicy: "block",
      currency: "BRL",
    },
  };
}

export async function saveProject(
  dir: string,
  state: ProjectState,
): Promise<Result<void>> {
  try {
    await mkdir(dir, { recursive: true });
    await mkdir(join(dir, "assets"), { recursive: true });
    const json = JSON.stringify(state, null, 2);
    if (/apiKey/i.test(json)) {
      return err([
        {
          code: "PROJECT_SECRET_LEAK",
          severity: "error",
          message: "refusing to save project containing apiKey fields",
        },
      ]);
    }
    await writeFile(join(dir, "project.json"), `${json}\n`, "utf8");
    return ok(undefined);
  } catch (e) {
    return err([
      {
        code: "PROJECT_SAVE_FAILED",
        severity: "error",
        message: e instanceof Error ? e.message : String(e),
      },
    ]);
  }
}

export async function loadProject(dir: string): Promise<Result<ProjectState>> {
  try {
    const raw = await readFile(join(dir, "project.json"), "utf8");
    const parsed = JSON.parse(raw) as ProjectState;
    if (parsed.schemaVersion !== PROJECT_SCHEMA_VERSION) {
      return err([
        {
          code: "PROJECT_SCHEMA_MISMATCH",
          severity: "error",
          message: `unsupported schemaVersion ${String(parsed.schemaVersion)}`,
        },
      ]);
    }
    if (!parsed.scene || !parsed.commercial || !parsed.settings) {
      return err([
        {
          code: "PROJECT_CORRUPT",
          severity: "error",
          message: "project.json missing required sections",
        },
      ]);
    }
    if (/apiKey/i.test(raw)) {
      return err([
        {
          code: "PROJECT_SECRET_LEAK",
          severity: "error",
          message: "project contains apiKey fields",
        },
      ]);
    }
    return ok(parsed);
  } catch (e) {
    return err([
      {
        code: "PROJECT_LOAD_FAILED",
        severity: "error",
        message: e instanceof Error ? e.message : String(e),
      },
    ]);
  }
}
