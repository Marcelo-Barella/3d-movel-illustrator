import sample from "../sample-pack/catalog.json";
import type { CatalogPack } from "./types.js";

export function loadSamplePack(): CatalogPack {
  return structuredClone(sample as CatalogPack);
}
