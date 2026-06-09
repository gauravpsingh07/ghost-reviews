import { describe, it, expect } from "vitest";
import { burstiness } from "@/lib/engine/signals/burstiness";
import type { Review } from "@/types";

function mk(id: string, date: string): Review {
  return { id, rating: 5, date: new Date(date).toISOString(), text: "ok", source: "amazon" };
}

describe("burstiness", () => {
  it("returns 0 with too few reviews", () => {
    expect(burstiness([mk("1", "2026-01-01")]).score).toBe(0);
  });

  it("flags a spike of same-day reviews", () => {
    const spread = ["2026-01-01", "2026-01-08", "2026-01-15", "2026-01-22", "2026-02-01"].map(
      (d, i) => mk("s" + i, d),
    );
    const spike = Array.from({ length: 10 }, (_, i) => mk("b" + i, "2026-03-01"));
    const res = burstiness([...spread, ...spike]);
    expect(res.score).toBeGreaterThan(0.5);
    expect(res.evidenceReviewIds).toHaveLength(10);
  });

  it("stays low for organic timing", () => {
    const organic = Array.from({ length: 12 }, (_, i) => mk("o" + i, `2026-0${(i % 9) + 1}-15`));
    expect(burstiness(organic).score).toBeLessThan(0.5);
  });
});
