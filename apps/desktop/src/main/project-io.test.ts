import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createEmptyProject,
  loadProject,
  saveProject,
} from "../main/project-io";

describe("project-io", () => {
  it("round-trips without apiKey fields", async () => {
    const dir = await mkdtemp(join(tmpdir(), "movelproj-"));
    const projectDir = join(dir, "Demo.movelproj");
    try {
      const state = createEmptyProject("Demo");
      const saved = await saveProject(projectDir, state);
      expect(saved.ok).toBe(true);
      const raw = await readFile(join(projectDir, "project.json"), "utf8");
      expect(raw.toLowerCase()).not.toContain("apikey");
      const loaded = await loadProject(projectDir);
      expect(loaded.ok).toBe(true);
      if (loaded.ok) {
        expect(loaded.value.name).toBe("Demo");
        expect(loaded.value.settings.handoffPolicy).toBe("block");
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
