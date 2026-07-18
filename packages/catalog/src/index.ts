export type {
  ParamDef,
  BomLineRecipe,
  MachiningOpRecipe,
  PanelRecipe,
  ModuleTemplate,
  Material,
  Hardware,
  CatalogPack,
  BomLine,
  MachiningOp,
  PanelPart,
} from "./types.js";
export { evalFormula } from "./formula.js";
export { validateModule } from "./schema.js";
export { resolveParams, numericParams } from "./params.js";
export { explodeBom } from "./bom.js";
export { expandPanels } from "./machining-recipe.js";
export {
  upsertModule,
  createModuleDraft,
  setPanelRecipe,
  setBomRecipe,
  savePackToDir,
  loadPackFromDir,
} from "./authoring.js";
export { loadSamplePack } from "./load-pack.js";
