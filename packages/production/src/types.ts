import type { Diagnostic } from "@movel/shared";
import type { MachiningOp } from "@movel/catalog";

export type EdgeBands = {
  L: string;
  W: string;
  R: string;
  B: string;
};

export type MachinedPart = {
  partId: string;
  label: string;
  moduleInstanceId: string;
  materialSku: string;
  thicknessMm: number;
  lengthMm: number;
  widthMm: number;
  grain: string;
  edgeBands: EdgeBands;
  ops: MachiningOp[];
  quantity: number;
};

export type HardwareLine = {
  sku: string;
  qty: number;
};

export type MachiningIR = {
  parts: MachinedPart[];
  hardware: HardwareLine[];
  diagnostics: Diagnostic[];
};

export type DocTable = {
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

export type CncAdapterId = "scm" | "homag" | "biesse" | "generic";

export type CncEmitOptions = {
  exportRoot?: string;
};

export type CncEmitResult = {
  files: Array<{ relativePath: string; contents: string | Buffer }>;
  report: Diagnostic[];
};

export type CncAdapter = {
  id: CncAdapterId;
  label: string;
  capabilities: Set<string>;
  emit: (ir: MachiningIR, opts?: CncEmitOptions) => CncEmitResult;
};
