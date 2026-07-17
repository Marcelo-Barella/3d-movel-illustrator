import type { Room, SceneState } from "./types.js";

export function createEmptyScene(room: Room): SceneState {
  return {
    room: { ...room },
    instances: [],
    selection: [],
  };
}
