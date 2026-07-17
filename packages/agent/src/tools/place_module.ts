import { z } from "zod";
import type { ToolSpec } from "../types.js";

const vec3 = z.object({ x: z.number(), y: z.number(), z: z.number() });

const placeSchema = z.object({
  moduleId: z.string(),
  position: vec3,
  rotationYDeg: z.number().default(0),
  paramOverrides: z
    .record(z.union([z.number(), z.string(), z.boolean()]))
    .default({}),
  materialOverrides: z.record(z.string()).default({}),
});

export const placeModuleTool: ToolSpec = {
  name: "place_module",
  description: "Place a catalog module into the scene",
  mode: ["command", "build", "autonomous"],
  inputSchema: placeSchema,
  async execute(ctx, input) {
    const parsed = placeSchema.parse(input);
    if (!ctx.pack.modules.some((m) => m.id === parsed.moduleId)) {
      return {
        ok: false,
        diagnostics: [
          {
            code: "MODULE_MISSING",
            severity: "error",
            message: `unknown module ${parsed.moduleId}`,
          },
        ],
      };
    }
    const r = ctx.history.push({
      type: "place",
      moduleId: parsed.moduleId,
      position: parsed.position,
      rotationYDeg: parsed.rotationYDeg,
      paramOverrides: parsed.paramOverrides,
      materialOverrides: parsed.materialOverrides,
    });
    return r.ok
      ? { ok: true, data: r.value.instances.at(-1) }
      : { ok: false, diagnostics: r.diagnostics };
  },
};

const moveSchema = z.object({
  id: z.string(),
  position: vec3,
  rotationYDeg: z.number().optional(),
});

export const moveInstanceTool: ToolSpec = {
  name: "move_instance",
  description: "Move a module instance",
  mode: ["command", "build", "autonomous"],
  inputSchema: moveSchema,
  async execute(ctx, input) {
    const parsed = moveSchema.parse(input);
    const r = ctx.history.push({ type: "move", ...parsed });
    return r.ok
      ? { ok: true, data: true }
      : { ok: false, diagnostics: r.diagnostics };
  },
};

const paramsSchema = z.object({
  id: z.string(),
  paramOverrides: z.record(z.union([z.number(), z.string(), z.boolean()])),
});

export const setParamsTool: ToolSpec = {
  name: "set_params",
  description: "Set parameter overrides on an instance",
  mode: ["command", "build", "autonomous"],
  inputSchema: paramsSchema,
  async execute(ctx, input) {
    const parsed = paramsSchema.parse(input);
    const r = ctx.history.push({ type: "set_params", ...parsed });
    return r.ok ? { ok: true } : { ok: false, diagnostics: r.diagnostics };
  },
};

const materialSchema = z.object({
  id: z.string(),
  materialOverrides: z.record(z.string()),
});

export const setMaterialTool: ToolSpec = {
  name: "set_material",
  description: "Set material overrides on an instance",
  mode: ["command", "build", "autonomous"],
  inputSchema: materialSchema,
  async execute(ctx, input) {
    const parsed = materialSchema.parse(input);
    const r = ctx.history.push({ type: "set_materials", ...parsed });
    return r.ok ? { ok: true } : { ok: false, diagnostics: r.diagnostics };
  },
};

const removeSchema = z.object({ ids: z.array(z.string()).min(1) });

export const removeInstanceTool: ToolSpec = {
  name: "remove_instance",
  description: "Remove one or more instances",
  mode: ["command", "build", "autonomous"],
  inputSchema: removeSchema,
  async execute(ctx, input) {
    const parsed = removeSchema.parse(input);
    if (ctx.mode === "autonomous") {
      const okConfirm = await ctx.confirm("remove instances", parsed);
      if (!okConfirm) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "AGENT_CONFIRM_DENIED",
              severity: "warning",
              message: "remove cancelled",
            },
          ],
        };
      }
    }
    const r = ctx.history.push({ type: "remove", ids: parsed.ids });
    return r.ok ? { ok: true } : { ok: false, diagnostics: r.diagnostics };
  },
};
