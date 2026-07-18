import { create } from "zustand";
import type { CatalogPack } from "@movel/catalog";
import type { SceneCommand, SceneState } from "@movel/scene";
import type { CommercialState } from "@movel/commercial";

export type AgentMode = "ask" | "command" | "build" | "autonomous";

type ProjectStore = {
  ready: boolean;
  projectDir: string | null;
  scene: SceneState;
  pack: CatalogPack | null;
  commercial: CommercialState;
  mode: AgentMode;
  providerId: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  confirm: { id: string; prompt: string; payload: unknown } | null;
  chatInFlight: boolean;
  selectedModuleId: string | null;
  setMode: (mode: AgentMode) => void;
  setProvider: (providerId: string, model: string) => void;
  bootstrap: () => Promise<void>;
  pushCommand: (cmd: SceneCommand) => Promise<void>;
  placeSelected: () => Promise<void>;
  sendChat: (text: string) => Promise<void>;
  resolveConfirm: (accepted: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const emptyScene: SceneState = {
  room: { widthMm: 4000, depthMm: 3000, heightMm: 2700 },
  instances: [],
  selection: [],
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ready: false,
  projectDir: null,
  scene: emptyScene,
  pack: null,
  commercial: {
    customers: [],
    priceTables: [],
    quotes: [],
    activeQuoteId: null,
  },
  mode: "command",
  providerId: "mock",
  model: "mock",
  messages: [],
  confirm: null,
  chatInFlight: false,
  selectedModuleId: "base_box",
  setMode: (mode) => set({ mode }),
  setProvider: (providerId, model) => set({ providerId, model }),
  bootstrap: async () => {
    if (!window.movel) {
      set({ ready: true });
      return;
    }
    const data = await window.movel.project.get();
    set({
      ready: true,
      projectDir: data.projectDir,
      scene: data.project.scene,
      pack: data.pack,
      commercial: data.project.commercial,
    });
    window.movel.agent.onConfirmRequest((payload) => {
      set({ confirm: payload });
    });
  },
  refresh: async () => {
    if (!window.movel) return;
    const data = await window.movel.project.get();
    set({
      projectDir: data.projectDir,
      scene: data.project.scene,
      pack: data.pack,
      commercial: data.project.commercial,
    });
  },
  pushCommand: async (cmd) => {
    if (!window.movel) return;
    await window.movel.project.pushCommand(cmd);
    await get().refresh();
  },
  placeSelected: async () => {
    const moduleId = get().selectedModuleId;
    if (!moduleId) return;
    await get().pushCommand({
      type: "place",
      moduleId,
      position: {
        x: get().scene.instances.length * 600,
        y: 0,
        z: 0,
      },
      rotationYDeg: 0,
      paramOverrides: {},
      materialOverrides: {},
    });
  },
  sendChat: async (text) => {
    if (get().chatInFlight) return;
    set({ chatInFlight: true });
    try {
      const state = get();
      const messages = [...state.messages, { role: "user", content: text }];
      set({ messages });
      if (!window.movel) return;
      const result = await window.movel.agent.chat({
        providerId: state.providerId,
        model: state.model,
        mode: state.mode,
        messages,
      });
      const nextMessages = (result.messages as Array<{ role: string; content?: string }>)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""),
        }));
      set({
        messages: nextMessages,
        scene: result.scene ?? state.scene,
        commercial: result.commercial ?? state.commercial,
      });
    } finally {
      set({ chatInFlight: false });
    }
  },
  resolveConfirm: async (accepted) => {
    const id = get().confirm?.id;
    if (!window.movel || !id) return;
    await window.movel.agent.confirm(id, accepted);
    set({ confirm: null });
    await get().refresh();
  },
}));
