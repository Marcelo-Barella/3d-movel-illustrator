import { describe, expect, it } from "vitest";
import { explodeBom, loadSamplePack, resolveParams } from "../src/index";

describe("sample bom", () => {
  it("explodes base_box hardware", () => {
    const pack = loadSamplePack();
    const mod = pack.modules.find((m) => m.id === "base_box")!;
    const params = resolveParams(mod, {
      widthMm: 600,
      heightMm: 720,
      depthMm: 560,
    });
    const lines = explodeBom(mod, params);
    expect(lines.some((l) => l.qty >= 1)).toBe(true);
  });
});
