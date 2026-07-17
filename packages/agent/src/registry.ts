import { buildQuoteTool, exportCncTool, exportDocumentsTool, exportOrderHandoffTool, issueQuoteRevisionTool } from "./tools/build_quote.js";
import { listCatalogTool, searchCatalogTool } from "./tools/list_catalog.js";
import {
  moveInstanceTool,
  placeModuleTool,
  removeInstanceTool,
  setMaterialTool,
  setParamsTool,
} from "./tools/place_module.js";
import { applyLayoutTool, proposeLayoutTool } from "./tools/propose_layout.js";
import { setRoomDimensionsTool } from "./tools/set_room_dimensions.js";
import type { AgentMode, ToolSpec } from "./types.js";

const ALL_TOOLS: ToolSpec[] = [
  setRoomDimensionsTool,
  listCatalogTool,
  searchCatalogTool,
  placeModuleTool,
  moveInstanceTool,
  setParamsTool,
  setMaterialTool,
  removeInstanceTool,
  proposeLayoutTool,
  applyLayoutTool,
  buildQuoteTool,
  issueQuoteRevisionTool,
  exportDocumentsTool,
  exportCncTool,
  exportOrderHandoffTool,
];

export function getToolsForMode(mode: AgentMode): ToolSpec[] {
  const byMode = ALL_TOOLS.filter((t) => t.mode.includes(mode));
  if (mode === "ask") {
    return byMode.filter((t) => t.readonly === true);
  }
  return byMode;
}

export function getTool(name: string): ToolSpec | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}

export { ALL_TOOLS };
