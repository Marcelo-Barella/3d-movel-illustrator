import { contextBridge, ipcRenderer } from "electron";

const api = {
  project: {
    get: () => ipcRenderer.invoke("project:get"),
    new: (name?: string) => ipcRenderer.invoke("project:new", name),
    save: (dir?: string) => ipcRenderer.invoke("project:save", dir),
    load: (dir: string) => ipcRenderer.invoke("project:load", dir),
    pushCommand: (cmd: unknown) =>
      ipcRenderer.invoke("project:pushCommand", cmd),
    undo: () => ipcRenderer.invoke("project:undo"),
    redo: () => ipcRenderer.invoke("project:redo"),
  },
  keys: {
    set: (providerId: string, key: string) =>
      ipcRenderer.invoke("keys:set", providerId, key),
    has: (providerId: string) => ipcRenderer.invoke("keys:has", providerId),
  },
  agent: {
    chat: (payload: unknown) => ipcRenderer.invoke("agent:chat", payload),
    confirm: (accepted: boolean) =>
      ipcRenderer.invoke("agent:confirm", accepted),
    onConfirmRequest: (
      cb: (payload: { prompt: string; payload: unknown }) => void,
    ) => {
      const listener = (
        _e: Electron.IpcRendererEvent,
        data: { prompt: string; payload: unknown },
      ) => cb(data);
      ipcRenderer.on("agent:confirm-request", listener);
      return () => ipcRenderer.removeListener("agent:confirm-request", listener);
    },
  },
  export: {
    production: (payload: unknown) =>
      ipcRenderer.invoke("export:production", payload),
  },
  commercial: {
    upsertCustomer: (c: unknown) =>
      ipcRenderer.invoke("commercial:upsertCustomer", c),
    upsertPriceTable: (t: unknown) =>
      ipcRenderer.invoke("commercial:upsertPriceTable", t),
    buildQuote: (payload: unknown) =>
      ipcRenderer.invoke("commercial:buildQuote", payload),
    issueQuote: (quoteId: string) =>
      ipcRenderer.invoke("commercial:issueQuote", quoteId),
    handoff: (quoteId: string) =>
      ipcRenderer.invoke("commercial:handoff", quoteId),
  },
  catalog: {
    importCsv: (text: string) => ipcRenderer.invoke("catalog:importCsv", text),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
  },
};

contextBridge.exposeInMainWorld("movel", api);

export type MovelApi = typeof api;
