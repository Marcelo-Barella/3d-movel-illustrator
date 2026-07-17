import { err, ok, type Result } from "@movel/shared";
import { applyCommand, type SceneCommand } from "./commands.js";
import { createEmptyScene } from "./project-scene.js";
import type { SceneState } from "./types.js";

type HistoryEntry = {
  commands: SceneCommand[];
};

export class History {
  private base: SceneState;
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private openGroup: SceneCommand[] | null = null;
  private cached: SceneState;

  constructor(initial: SceneState) {
    this.base = structuredClone(initial);
    this.cached = structuredClone(initial);
  }

  get state(): SceneState {
    return this.cached;
  }

  beginGroup(): void {
    if (this.openGroup) {
      throw new Error("history group already open");
    }
    this.openGroup = [];
  }

  endGroup(): Result<SceneState> {
    if (!this.openGroup) {
      return err([
        {
          code: "HISTORY_NO_GROUP",
          severity: "error",
          message: "no open history group",
        },
      ]);
    }
    const commands = this.openGroup;
    this.openGroup = null;
    if (commands.length === 0) return ok(this.cached);
    this.past.push({ commands });
    this.future = [];
    return ok(this.cached);
  }

  push(cmd: SceneCommand): Result<SceneState> {
    if (this.openGroup) {
      const applied = applyCommand(this.cached, cmd);
      if (!applied.ok) return applied;
      this.openGroup.push(cmd);
      this.cached = applied.value;
      return ok(this.cached);
    }
    return this.commitEntry({ commands: [cmd] });
  }

  undo(): SceneState {
    const entry = this.past.pop();
    if (!entry) return this.cached;
    this.future.push(entry);
    this.cached = this.replay();
    return this.cached;
  }

  redo(): Result<SceneState> {
    const entry = this.future.pop();
    if (!entry) {
      return err([
        {
          code: "HISTORY_NOTHING_TO_REDO",
          severity: "info",
          message: "nothing to redo",
        },
      ]);
    }
    this.past.push(entry);
    this.cached = this.replay();
    return ok(this.cached);
  }

  replaceBase(state: SceneState): void {
    this.base = structuredClone(state);
    this.past = [];
    this.future = [];
    this.openGroup = null;
    this.cached = structuredClone(state);
  }

  private commitEntry(entry: HistoryEntry): Result<SceneState> {
    let state = this.cached;
    for (const cmd of entry.commands) {
      const applied = applyCommand(state, cmd);
      if (!applied.ok) return applied;
      state = applied.value;
    }
    this.past.push(entry);
    this.future = [];
    this.cached = state;
    return ok(this.cached);
  }

  private replay(): SceneState {
    let state = structuredClone(this.base);
    for (const entry of this.past) {
      for (const cmd of entry.commands) {
        const applied = applyCommand(state, cmd);
        if (!applied.ok) {
          throw new Error(`replay failed: ${applied.diagnostics[0]?.message}`);
        }
        state = applied.value;
      }
    }
    return state;
  }
}

export { createEmptyScene };
