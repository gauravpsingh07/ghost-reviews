import { describe, expect, it } from "vitest";
import {
  DEMO_SCAN_FIXTURES,
  findDemoScanFixture,
  isDemoScanQuery,
  loadDemoScanResult,
} from "@/lib/fixtures";

describe("findDemoScanFixture", () => {
  it("matches fixture keys and aliases case-insensitively", () => {
    expect(findDemoScanFixture("GhostCase Power Snap")?.key).toBe("ghostcase-power-snap");
    expect(findDemoScanFixture("demo clean kettle")?.key).toBe("cozybrew-kettle");
  });

  it("matches fixture URLs", () => {
    expect(findDemoScanFixture("https://www.amazon.com/product-reviews/GLOWFIT")?.key).toBe(
      "glowfit-pulse-band",
    );
  });
});

describe("loadDemoScanResult", () => {
  it("returns a cloned ScanResult for query matches", () => {
    const result = loadDemoScanResult("ghostcase battery case", { forceDemoMode: false });

    expect(result?.product.name).toBe("GhostCase Power Snap");
    expect(result?.demoMode).toBe(true);
    expect(result).not.toBe(DEMO_SCAN_FIXTURES[0].result);
  });

  it("returns no fixture for unknown queries unless demo mode is forced", () => {
    expect(loadDemoScanResult("unknown product", { forceDemoMode: false })).toBeUndefined();
    expect(loadDemoScanResult("unknown product", { forceDemoMode: true })?.product.name).toBe(
      DEMO_SCAN_FIXTURES[0].result.product.name,
    );
  });

  it("can use a named fallback fixture in forced demo mode", () => {
    expect(
      loadDemoScanResult("unknown product", {
        forceDemoMode: true,
        fallbackKey: "cozybrew-kettle",
      })?.product.name,
    ).toBe("CozyBrew Gooseneck Kettle");
  });
});

describe("isDemoScanQuery", () => {
  it("returns true only for fixture-matching queries", () => {
    expect(isDemoScanQuery("glowfit tracker reviews")).toBe(true);
    expect(isDemoScanQuery("something live")).toBe(false);
  });
});
