import type { CncAdapter, CncAdapterId } from "../types.js";
import { biesseAdapter } from "./biesse.js";
import { genericAdapter } from "./generic.js";
import { homagAdapter } from "./homag.js";
import { scmAdapter } from "./scm.js";

const adapters: CncAdapter[] = [
  scmAdapter,
  homagAdapter,
  biesseAdapter,
  genericAdapter,
];

export function listAdapters(): CncAdapter[] {
  return [...adapters];
}

export function getAdapter(id: CncAdapterId): CncAdapter {
  const found = adapters.find((a) => a.id === id);
  if (!found) {
    throw new Error(`unknown adapter ${id}`);
  }
  return found;
}
