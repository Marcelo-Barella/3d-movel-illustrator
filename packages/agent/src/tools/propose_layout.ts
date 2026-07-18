import { createId } from "@movel/shared";
import { z } from "zod";
import type { LayoutPlan, ToolSpec } from "../types.js";

const proposeSchema = z.object({
  brief: z.string(),
  wall: z.enum(["back", "left", "right", "front"]).default("back"),
  moduleId: z.string().default("base_box"),
  count: z.number().int().positive().max(20).default(3),
});

function placementForWall(
  wall: z.infer<typeof proposeSchema>["wall"],
  index: number,
  room: { widthMm: number; depthMm: number },
): LayoutPlan["placements"][number] {
  const spacing = 600;
  switch (wall) {
    case "front":
      return {
        position: { x: index * spacing, y: 0, z: room.depthMm },
        rotationYDeg: 180,
      };
    case "left":
      return {
        position: { x: 0, y: 0, z: index * spacing },
        rotationYDeg: 90,
      };
    case "right":
      return {
        position: { x: room.widthMm, y: 0, z: index * spacing },
        rotationYDeg: -90,
      };
    default:
      return {
        position: { x: index * spacing, y: 0, z: 0 },
        rotationYDeg: 0,
      };
  }
}

export const proposeLayoutTool: ToolSpec = {
  name: "propose_layout",
  description: "Propose a layout plan along a wall",
  mode: ["build", "autonomous"],
  inputSchema: proposeSchema,
  async execute(ctx, input) {
    const parsed = proposeSchema.parse(input);
    const room = ctx.history.state.room;
    const placements: LayoutPlan["placements"] = [];
    for (let i = 0; i < parsed.count; i += 1) {
      const { position, rotationYDeg } = placementForWall(parsed.wall, i, room);
      placements.push({
        moduleId: parsed.moduleId,
        position,
        rotationYDeg,
        paramOverrides: {},
        materialOverrides: {},
      });
    }
    const plan: LayoutPlan = {
      planId: createId("plan"),
      placements,
    };
    return { ok: true, data: plan };
  },
};

const applySchema = z.object({
  planId: z.string(),
  plan: z.object({
    planId: z.string().optional(),
    placements: z.array(
      z.object({
        moduleId: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number(),
        }),
        rotationYDeg: z.number().default(0),
        paramOverrides: z
          .record(z.union([z.number(), z.string(), z.boolean()]))
          .default({}),
        materialOverrides: z.record(z.string()).default({}),
      }),
    ),
  }),
});

export const applyLayoutTool: ToolSpec = {
  name: "apply_layout",
  description: "Apply a layout plan transactionally",
  mode: ["build", "autonomous"],
  inputSchema: applySchema,
  async execute(ctx, input) {
    const parsed = applySchema.parse(input);
    const count = parsed.plan.placements.length;
    const needsConfirm =
      ctx.mode === "build" ||
      (ctx.mode === "autonomous" &&
        count > 5 &&
        !ctx.settings.autonomousAutoApplySmallPlans);
    if (needsConfirm) {
      const okConfirm = await ctx.confirm("apply layout", parsed);
      if (!okConfirm) {
        return {
          ok: false,
          diagnostics: [
            {
              code: "AGENT_CONFIRM_DENIED",
              severity: "warning",
              message: "apply_layout cancelled",
            },
          ],
        };
      }
    }
    ctx.history.beginGroup();
    for (const p of parsed.plan.placements) {
      const r = ctx.history.push({
        type: "place",
        moduleId: p.moduleId,
        position: p.position,
        rotationYDeg: p.rotationYDeg,
        paramOverrides: p.paramOverrides,
        materialOverrides: p.materialOverrides,
      });
      if (!r.ok) {
        ctx.history.cancelGroup();
        return { ok: false, diagnostics: r.diagnostics };
      }
    }
    const ended = ctx.history.endGroup();
    return ended.ok
      ? { ok: true, data: { placed: count } }
      : { ok: false, diagnostics: ended.diagnostics };
  },
};
