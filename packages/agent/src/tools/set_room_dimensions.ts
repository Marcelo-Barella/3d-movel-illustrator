import { z } from "zod";
import type { ToolSpec } from "../types.js";

const schema = z.object({
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

export const setRoomDimensionsTool: ToolSpec = {
  name: "set_room_dimensions",
  description: "Set room width/depth/height in mm",
  mode: ["command", "build", "autonomous"],
  inputSchema: schema,
  async execute(ctx, input) {
    const parsed = schema.parse(input);
    const r = ctx.history.push({ type: "set_room", room: parsed });
    return r.ok
      ? { ok: true, data: r.value.room }
      : { ok: false, diagnostics: r.diagnostics };
  },
};
