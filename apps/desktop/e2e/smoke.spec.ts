import { test, expect, _electron as electron } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const skipLaunch =
  process.env.MOVEL_E2E_SKIP === "1" ||
  (process.env.CI === "true" && process.env.MOVEL_E2E_FORCE !== "1");

async function launchApp() {
  process.env.MOVEL_E2E_SKIP_KEYTAR = "1";
  const app = await electron.launch({
    args: [".", "--enable-unsafe-swiftshader"],
    cwd: join(__dirname, ".."),
    env: {
      ...process.env,
      MOVEL_E2E_SKIP_KEYTAR: "1",
    },
  });
  const page = await app.firstWindow();
  await page.waitForFunction(() => typeof (window as { movel?: unknown }).movel !== "undefined");
  return { app, page };
}

test.describe("electron smoke", () => {
  test.skip(skipLaunch, "Set MOVEL_E2E_FORCE=1 to run Electron smoke in CI");

  test("launch set room place save reopen", async () => {
    const { app, page } = await launchApp();
    const projectDir = await mkdtemp(join(tmpdir(), "movel-e2e-proj-"));
    try {
      const result = await page.evaluate(async (dir) => {
        const movel = (window as unknown as { movel: typeof window.movel }).movel;
        await movel.project.new("E2E");
        await movel.project.pushCommand({
          type: "set_room",
          room: { widthMm: 3500, depthMm: 2800, heightMm: 2600 },
        });
        await movel.project.pushCommand({
          type: "place",
          moduleId: "base_box",
          position: { x: 0, y: 0, z: 0 },
          rotationYDeg: 0,
          paramOverrides: {},
          materialOverrides: {},
        });
        const saved = await movel.project.save(dir);
        const loaded = await movel.project.load(dir);
        const after = await movel.project.get();
        return {
          savedOk: saved?.ok === true,
          loadedOk: loaded?.ok === true,
          width: after.project.scene.room.widthMm,
          instances: after.project.scene.instances.length,
          moduleId: after.project.scene.instances[0]?.moduleId ?? null,
        };
      }, projectDir);

      expect(result.savedOk).toBe(true);
      expect(result.loadedOk).toBe(true);
      expect(result.width).toBe(3500);
      expect(result.instances).toBe(1);
      expect(result.moduleId).toBe("base_box");

      const raw = await readFile(join(projectDir, "project.json"), "utf8");
      expect(raw.toLowerCase()).not.toContain("apikey");
    } finally {
      await app.close();
      await rm(projectDir, { recursive: true, force: true });
    }
  });

  test("mock agent places via chat", async () => {
    const { app, page } = await launchApp();
    try {
      const result = await page.evaluate(async () => {
        const movel = (window as unknown as { movel: typeof window.movel }).movel;
        await movel.project.new("AgentE2E");
        const chat = await movel.agent.chat({
          providerId: "mock",
          model: "mock",
          mode: "command",
          messages: [{ role: "user", content: "place a base box" }],
        });
        const after = await movel.project.get();
        return {
          instances: after.project.scene.instances.length,
          moduleId: after.project.scene.instances[0]?.moduleId ?? null,
          messageCount: Array.isArray(chat?.messages) ? chat.messages.length : 0,
        };
      });
      expect(result.instances).toBe(1);
      expect(result.moduleId).toBe("base_box");
      expect(result.messageCount).toBeGreaterThan(1);
    } finally {
      await app.close();
    }
  });

  test("export bundle and keytar skip path", async () => {
    const { app, page } = await launchApp();
    try {
      const result = await page.evaluate(async () => {
        const movel = (window as unknown as { movel: typeof window.movel }).movel;
        await movel.project.new("ExportE2E");
        await movel.project.pushCommand({
          type: "place",
          moduleId: "base_box",
          position: { x: 0, y: 0, z: 0 },
          rotationYDeg: 0,
          paramOverrides: {},
          materialOverrides: {},
        });
        await movel.keys.set("mock", "test-key-not-persisted-to-project");
        const has = await movel.keys.has("mock");
        const exported = await movel.export.production({ adapters: ["scm"] });
        const snap = await movel.project.get();
        return {
          hasKey: has?.has === true,
          exportOk: exported?.ok === true,
          outDir: exported?.ok ? exported.value.outDir : null,
          projectJson: JSON.stringify(snap.project),
        };
      });

      expect(result.hasKey).toBe(true);
      expect(result.exportOk).toBe(true);
      expect(result.outDir).toBeTruthy();
      expect(result.projectJson.toLowerCase()).not.toContain("apikey");
      expect(result.projectJson).not.toContain("test-key-not-persisted-to-project");

      await access(join(result.outDir!, "nesting", "parts.csv"));
      await access(join(result.outDir!, "scm", "manifest.json"));
    } finally {
      await app.close();
    }
  });
});

test("project io covered by unit suite", () => {
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "src/main/project-io.test.ts"],
    {
      cwd: join(__dirname, ".."),
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );
  expect(result.status).toBe(0);
  expect(result.stdout + result.stderr).toContain("passed");
});
