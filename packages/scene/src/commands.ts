import { assertPositiveMm, createId, err, ok, type Result } from "@movel/shared";
import type { ModuleInstance, Room, SceneState, Vec3 } from "./types.js";

export type SceneCommand =
  | { type: "set_room"; room: Room }
  | {
      type: "place";
      moduleId: string;
      position: Vec3;
      rotationYDeg: number;
      paramOverrides: Record<string, number | string | boolean>;
      materialOverrides: Record<string, string>;
      id?: string;
    }
  | { type: "move"; id: string; position: Vec3; rotationYDeg?: number }
  | {
      type: "set_params";
      id: string;
      paramOverrides: Record<string, number | string | boolean>;
    }
  | {
      type: "set_materials";
      id: string;
      materialOverrides: Record<string, string>;
    }
  | { type: "remove"; ids: string[] }
  | { type: "set_selection"; selection: string[] };

function cloneState(state: SceneState): SceneState {
  return {
    room: { ...state.room },
    instances: state.instances.map((inst) => ({
      ...inst,
      position: { ...inst.position },
      paramOverrides: { ...inst.paramOverrides },
      materialOverrides: { ...inst.materialOverrides },
    })),
    selection: [...state.selection],
  };
}

function validateRoom(room: Room): Result<Room> {
  try {
    assertPositiveMm(room.widthMm);
    assertPositiveMm(room.depthMm);
    assertPositiveMm(room.heightMm);
    return ok(room);
  } catch (e) {
    return err([
      {
        code: "ROOM_DIMENSION_INVALID",
        severity: "error",
        message: e instanceof Error ? e.message : "invalid room dimensions",
        path: "room",
      },
    ]);
  }
}

export function applyCommand(
  state: SceneState,
  cmd: SceneCommand,
): Result<SceneState> {
  const next = cloneState(state);

  switch (cmd.type) {
    case "set_room": {
      const checked = validateRoom(cmd.room);
      if (!checked.ok) return checked;
      next.room = { ...cmd.room };
      return ok(next);
    }
    case "place": {
      const instance: ModuleInstance = {
        id: cmd.id ?? createId("inst"),
        moduleId: cmd.moduleId,
        position: { ...cmd.position },
        rotationYDeg: cmd.rotationYDeg,
        paramOverrides: { ...cmd.paramOverrides },
        materialOverrides: { ...cmd.materialOverrides },
      };
      next.instances.push(instance);
      return ok(next);
    }
    case "move": {
      const inst = next.instances.find((i) => i.id === cmd.id);
      if (!inst) {
        return err([
          {
            code: "INSTANCE_NOT_FOUND",
            severity: "error",
            message: `instance ${cmd.id} not found`,
            path: cmd.id,
          },
        ]);
      }
      inst.position = { ...cmd.position };
      if (cmd.rotationYDeg !== undefined) inst.rotationYDeg = cmd.rotationYDeg;
      return ok(next);
    }
    case "set_params": {
      const inst = next.instances.find((i) => i.id === cmd.id);
      if (!inst) {
        return err([
          {
            code: "INSTANCE_NOT_FOUND",
            severity: "error",
            message: `instance ${cmd.id} not found`,
            path: cmd.id,
          },
        ]);
      }
      inst.paramOverrides = { ...inst.paramOverrides, ...cmd.paramOverrides };
      return ok(next);
    }
    case "set_materials": {
      const inst = next.instances.find((i) => i.id === cmd.id);
      if (!inst) {
        return err([
          {
            code: "INSTANCE_NOT_FOUND",
            severity: "error",
            message: `instance ${cmd.id} not found`,
            path: cmd.id,
          },
        ]);
      }
      inst.materialOverrides = {
        ...inst.materialOverrides,
        ...cmd.materialOverrides,
      };
      return ok(next);
    }
    case "remove": {
      const removeSet = new Set(cmd.ids);
      next.instances = next.instances.filter((i) => !removeSet.has(i.id));
      next.selection = next.selection.filter((id) => !removeSet.has(id));
      return ok(next);
    }
    case "set_selection": {
      next.selection = [...cmd.selection];
      return ok(next);
    }
    default: {
      const _exhaustive: never = cmd;
      return err([
        {
          code: "UNKNOWN_COMMAND",
          severity: "error",
          message: `unknown command ${JSON.stringify(_exhaustive)}`,
        },
      ]);
    }
  }
}
