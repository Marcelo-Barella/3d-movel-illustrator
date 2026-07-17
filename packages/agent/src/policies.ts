import type { AgentMode, AgentSettings, ToolSpec } from "./types.js";

export const DEFAULT_SETTINGS: AgentSettings = {
  maxSteps: 24,
  autonomousAutoApplySmallPlans: false,
};

export function shouldAutoConfirm(
  mode: AgentMode,
  tool: ToolSpec,
  settings: AgentSettings,
  payload: unknown,
): boolean {
  if (mode !== "autonomous") return false;
  if (tool.name.startsWith("export_")) return false;
  if (tool.name === "remove_instance") return false;
  if (tool.name === "apply_layout") {
    const plan = (payload as { plan?: { placements?: unknown[] } })?.plan;
    const count = plan?.placements?.length ?? 0;
    if (count > 5 && !settings.autonomousAutoApplySmallPlans) return false;
    return true;
  }
  return true;
}
