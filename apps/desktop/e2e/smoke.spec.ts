import { test, expect, _electron as electron } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const skipLaunch =
  process.env.MOVEL_E2E_SKIP === "1" ||
  (process.env.CI === "true" && process.env.MOVEL_E2E_FORCE !== "1");

test.describe("electron smoke", () => {
  test.skip(skipLaunch, "Set MOVEL_E2E_FORCE=1 to run Electron smoke in CI");

  test("launches and exposes movel API", async () => {
    process.env.MOVEL_E2E_SKIP_KEYTAR = "1";
    const app = await electron.launch({
      args: ["."],
      cwd: join(__dirname, ".."),
      env: {
        ...process.env,
        MOVEL_E2E_SKIP_KEYTAR: "1",
      },
    });
    const page = await app.firstWindow();
    await page.waitForTimeout(2000);
    const hasApi = await page.evaluate(
      () => typeof (window as { movel?: unknown }).movel !== "undefined",
    );
    expect(hasApi).toBe(true);
    await app.close();
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
