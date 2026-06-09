import { describe, it, expect } from "vitest";
import { analyzeReviews } from "@/lib/engine/analyze";
import type { LlmReviewScore, Review } from "@/types";

function mk(id: string, rating: number, date: string, text: string): Review {
  return { id, rating, date: new Date(date).toISOString(), text, source: "amazon" };
}

describe("analyzeReviews", () => {
  it("produces a clean ScanResult for organic reviews", () => {
    const reviews = [
      mk("1", 5, "2026-01-03", "battery lasts two days, love the compact size"),
      mk("2", 4, "2026-02-10", "screen is bright but the speaker is a bit tinny"),
      mk("3", 2, "2026-03-01", "stopped charging after a month, disappointed"),
      mk("4", 5, "2026-04-05", "great for travel, fits right in my pocket"),
      mk("5", 3, "2026-05-09", "works fine, nothing special to report"),
    ];
    const res = analyzeReviews({ product: { name: "Gadget", source: "amazon" }, reviews });
    expect(res.ghostScore).toBeLessThan(40);
    expect(["clean", "mild"]).toContain(res.verdict.tier);
    expect(res.reviews).toHaveLength(5);
    expect(res.reviewsAnalyzed).toBe(5);
  });

  it("flags heavily-gamed reviews (burst + duplicates + rigged ratings)", () => {
    const spam = Array.from({ length: 10 }, (_, i) =>
      mk("s" + i, 5, "2026-06-01", "best product ever amazing five stars highly recommend"),
    );
    const incent = mk("i1", 5, "2026-06-01", "received this free in exchange for an honest review, amazing");
    const ones = [mk("a", 1, "2026-01-01", "broke immediately"), mk("b", 1, "2026-02-01", "waste of money")];
    const res = analyzeReviews({
      product: { name: "Spammy", source: "amazon" },
      reviews: [...spam, incent, ...ones],
    });
    expect(res.ghostScore).toBeGreaterThan(40);
    expect(res.hauntings.length).toBeGreaterThan(0);
    expect(res.reviews.some((r) => r.verdict === "ghost")).toBe(true);
  });

  it("integrates LLM scores into aggregate signals and per-review reasons", () => {
    const reviews = [
      mk("ai", 5, "2026-06-01", "This product exceeded all expectations and is truly amazing."),
      mk("human", 4, "2026-06-02", "The zipper snagged once, but the side pocket fits my charger."),
    ];
    const llm = new Map<string, LlmReviewScore>([
      ["ai", { id: "ai", aiLikelihood: 0.95, specificity: 0.1, sentiment: 0.9 }],
      ["human", { id: "human", aiLikelihood: 0.1, specificity: 0.9, sentiment: 0.6 }],
    ]);

    const res = analyzeReviews({ product: { name: "Gadget", source: "amazon" }, reviews, llm });

    expect(res.signals.aiGenerated).toBeGreaterThan(0.4);
    expect(res.signals.generic).toBeGreaterThan(0.4);
    expect(res.hauntings.map((h) => h.id)).toContain("aiGenerated");
    expect(res.hauntings.map((h) => h.id)).toContain("generic");
    expect(res.reviews.find((r) => r.id === "ai")?.reasons).toContain("reads as AI-generated");
  });
});
