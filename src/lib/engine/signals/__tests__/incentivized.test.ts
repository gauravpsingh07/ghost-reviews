import { describe, it, expect } from "vitest";
import { incentivized } from "@/lib/engine/signals/incentivized";
import type { Review } from "@/types";

const base = { rating: 5, date: new Date().toISOString(), source: "amazon" as const };

describe("incentivized", () => {
  it("detects exchange-for-review language", () => {
    const rs: Review[] = [
      { id: "1", ...base, text: "I received this product for free in exchange for an honest review" },
      { id: "2", ...base, text: "great quality, love it" },
    ];
    const res = incentivized(rs);
    expect(res.evidenceReviewIds).toEqual(["1"]);
    expect(res.score).toBeCloseTo(0.5);
  });

  it("returns 0 when no incentive language is present", () => {
    const rs: Review[] = [{ id: "1", ...base, text: "solid build, fair price" }];
    expect(incentivized(rs).score).toBe(0);
  });
});
