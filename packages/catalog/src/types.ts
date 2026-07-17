export type ParamDef = {
  key: string;
  label: string;
  kind: "number" | "enum" | "boolean";
  unit?: "mm";
  min?: number;
  max?: number;
  options?: string[];
  default: number | string | boolean;
};

export type BomLineRecipe = {
  sku: string;
  description: string;
  qtyFormula: string;
};

export type MachiningOpRecipe =
  | {
      kind: "contour";
      shape: "rect";
    }
  | {
      kind: "drill";
      xFormula: string;
      yFormula: string;
      diameterMm: number;
      depthMm: number;
    }
  | {
      kind: "groove";
      xFormula: string;
      yFormula: string;
      lengthFormula: string;
      widthMm: number;
      depthMm: number;
      axis: "X" | "Y";
    };

export type PanelRecipe = {
  id: string;
  label: string;
  materialKey: string;
  lengthFormula: string;
  widthFormula: string;
  thicknessMm: number;
  grain: "none" | "length" | "width";
  ops: MachiningOpRecipe[];
};

export type ModuleTemplate = {
  id: string;
  name: string;
  category: string;
  params: ParamDef[];
  defaultMaterials: Record<string, string>;
  bom: BomLineRecipe[];
  panels: PanelRecipe[];
  priceSku?: string;
};

export type Material = {
  id: string;
  name: string;
  thicknessMm: number;
  grainDefault: "none" | "length" | "width";
  sku: string;
};

export type Hardware = {
  sku: string;
  name: string;
  unit: string;
};

export type CatalogPack = {
  id: string;
  name: string;
  version: number;
  materials: Material[];
  hardware: Hardware[];
  modules: ModuleTemplate[];
};

export type BomLine = {
  sku: string;
  description: string;
  qty: number;
};

export type MachiningOp =
  | { kind: "contour"; shape: "rect" }
  | {
      kind: "drill";
      xMm: number;
      yMm: number;
      diameterMm: number;
      depthMm: number;
    }
  | {
      kind: "groove";
      xMm: number;
      yMm: number;
      lengthMm: number;
      widthMm: number;
      depthMm: number;
      axis: "X" | "Y";
    };

export type PanelPart = {
  id: string;
  label: string;
  materialKey: string;
  materialSku: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  grain: "none" | "length" | "width";
  ops: MachiningOp[];
};
