import type { Diagnostic } from "@movel/shared";
import type { ModuleTemplate } from "./types.js";

export function validateModule(module: ModuleTemplate): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!module.id) {
    diagnostics.push({
      code: "MODULE_ID_REQUIRED",
      severity: "error",
      message: "module id required",
    });
  }
  if (module.panels.length === 0) {
    diagnostics.push({
      code: "MODULE_NO_PANELS",
      severity: "warning",
      message: `module ${module.id} has no panels`,
      path: module.id,
    });
  }
  for (const p of module.params) {
    if (p.kind === "number" && typeof p.default !== "number") {
      diagnostics.push({
        code: "PARAM_DEFAULT_TYPE",
        severity: "error",
        message: `param ${p.key} default must be number`,
        path: `${module.id}.${p.key}`,
      });
    }
  }
  return diagnostics;
}
