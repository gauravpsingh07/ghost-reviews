import { describe, it, expect } from "vitest";
import { duplication } from "@/lib/engine/signals/duplication";
import type { Review } from "@/types";

const base = { rating: 5, date: new Date().toISOString(), source: "amazon" as const };

describe("duplication", () => {
  it("flags copy-paste reviews", () => {
    const text = "this product is amazing best purchase ever five stars";
    const dups = [0, 1, 2].map((i) => ({ id: "d" + i, ...base, text }));
    const uniq = { id: "u", ...base, rating: 3, text: "battery died after two weeks, disappointed" };
    const res = duplication([...dups, uniq]);
    expect(res.evidenceReviewIds).toHaveLength(3);
    expect(res.score).toBeGreaterThan(0.5);
  });

  it("returns 0 when all reviews differ", () => {
    const rs = [
      "great battery life lasts all day",
      "screen cracked easily very fragile",
      "fast shipping thanks seller",
      "too expensive for what it offers",
    ].map((t, i) => ({ id: "x" + i, ...base, text: t }));
    expect(duplication(rs).score).toBe(0);
  });
});
