import { beforeEach, describe, expect, it } from "vitest";
import {
  SCAN_CACHE_TTL_MS,
  SCAN_RATE_LIMIT_MAX,
  checkScanRateLimit,
  clearScanApiGuardsForTests,
  getCachedScanResult,
  setCachedScanResult,
} from "@/lib/api/cache";
import { DEMO_SCAN_FIXTURES } from "@/lib/fixtures";

const input = { query: "  GhostCase Power Snap  ", source: "auto" as const };
const normalizedInput = { query: "ghostcase power snap", source: "auto" as const };
const result = DEMO_SCAN_FIXTURES[0].result;

beforeEach(() => {
  clearScanApiGuardsForTests();
});

describe("scan response cache", () => {
  it("stores cloned results by normalized request key", () => {
    setCachedScanResult(input, result, 1000);

    const cached = getCachedScanResult(normalizedInput, 1001);

    expect(cached?.product.name).toBe(result.product.name);
    expect(cached).not.toBe(result);
  });

  it("expires cached results", () => {
    setCachedScanResult(input, result, 1000);

    expect(getCachedScanResult(input, 1000 + SCAN_CACHE_TTL_MS + 1)).toBeUndefined();
  });
});

describe("scan rate limit", () => {
  it("allows the configured number of requests per window", () => {
    for (let i = 0; i < SCAN_RATE_LIMIT_MAX; i++) {
      expect(checkScanRateLimit("127.0.0.1", 1000).allowed).toBe(true);
    }

    const blocked = checkScanRateLimit("127.0.0.1", 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window rolls over", () => {
    for (let i = 0; i < SCAN_RATE_LIMIT_MAX + 1; i++) {
      checkScanRateLimit("127.0.0.1", 1000);
    }

    expect(checkScanRateLimit("127.0.0.1", 1000 + 61_000).allowed).toBe(true);
  });
});
