import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = readFileSync(
  join(root, "packages/production/src/adapters/registry.ts"),
  "utf8",
);
for (const id of ["scm", "homag", "biesse", "generic"]) {
  if (!registry.includes(`${id}Adapter`)) {
    console.error(`acceptance-check: missing adapter ${id}`);
    process.exit(1);
  }
}

const test = spawnSync("pnpm", ["exec", "vitest", "run"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (test.status !== 0) process.exit(test.status ?? 1);
console.log("acceptance-check: ok");
