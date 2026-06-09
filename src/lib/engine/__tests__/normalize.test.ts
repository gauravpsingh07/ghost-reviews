import { describe, it, expect } from "vitest";
import { normalizeReview, normalizeReviews, normalizeText, makeReviewId } from "@/lib/engine/normalize";

describe("normalizeText", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeText("  hello   world\n\t! ")).toBe("hello world !");
  });
});

describe("normalizeReview", () => {
  it("clamps ratings to 1..5 and parses strings", () => {
    expect(normalizeReview({ rating: "7", text: "great" }).rating).toBe(5);
    expect(normalizeReview({ rating: 0, text: "x" }).rating).toBe(1);
  });

  it("produces a stable id for identical content", () => {
    const a = makeReviewId({ source: "amazon", author: "A", date: "2026-01-01", text: "hi" });
    const b = makeReviewId({ source: "amazon", author: "A", date: "2026-01-01", text: "hi" });
    expect(a).toBe(b);
  });
});

describe("normalizeReviews", () => {
  it("drops empty text and exact duplicates", () => {
    const out = normalizeReviews([
      { rating: 5, text: "same", source: "amazon", author: "A", date: "2026-01-01" },
      { rating: 5, text: "same", source: "amazon", author: "A", date: "2026-01-01" },
      { rating: 5, text: "   ", source: "amazon" },
    ]);
    expect(out).toHaveLength(1);
  });
});
