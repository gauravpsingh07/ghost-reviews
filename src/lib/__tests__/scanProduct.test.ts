import { afterEach, describe, expect, it, vi } from "vitest";

describe("scanProduct", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns matching demo fixtures in hosted demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.resetModules();

    const { scanProduct } = await import("@/lib/scan");
    const result = await scanProduct({ query: "ghostcase power snap" });

    expect(result.product.name).toBe("GhostCase Power Snap");
    expect(result.demoMode).toBe(true);
  });

  it("rejects unmatched hosted-demo queries instead of falling back to unrelated sample data", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.resetModules();

    const { DEMO_ONLY_MESSAGE, scanProduct } = await import("@/lib/scan");

    await expect(scanProduct({ query: "some random blender reviews" })).rejects.toMatchObject({
      name: "ScanError",
      code: "DEMO_ONLY",
      message: DEMO_ONLY_MESSAGE,
    });
  });
});
