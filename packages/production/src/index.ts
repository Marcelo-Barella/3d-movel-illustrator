export type {
  EdgeBands,
  MachinedPart,
  MachiningIR,
  DocTable,
  CncAdapterId,
  CncEmitOptions,
  CncEmitResult,
  CncAdapter,
} from "./types.js";
export { buildMachiningIR } from "./build-machining-ir.js";
export { buildDocuments, docTableToCsv } from "./documents.js";
export { toNestingCsv, NESTING_CSV_HEADER } from "./nesting-csv.js";
export { listAdapters, getAdapter } from "./adapters/registry.js";
export { scmAdapter } from "./adapters/scm.js";
export { homagAdapter } from "./adapters/homag.js";
export { biesseAdapter } from "./adapters/biesse.js";
export { genericAdapter } from "./adapters/generic.js";
