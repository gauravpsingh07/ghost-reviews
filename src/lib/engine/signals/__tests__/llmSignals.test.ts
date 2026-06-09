import { describe, expect, it } from "vitest";
import { aiGeneratedSignal, genericSignal } from "@/lib/engine/signals/llmSignals";
import type { LlmReviewScore, Review } from "@/types";

const reviews: Review[] = [
  {
    id: "r1",
    rating: 5,
    date: "2026-06-01T00:00:00.000Z",
    text: "Amazing product, highly recommend.",
    source: "amazon",
  },
  {
    id: "r2",
    rating: 4,
    date: "2026-06-02T00:00:00.000Z",
    text: "The hinge feels sturdy after two weeks of travel.",
    source: "amazon",
  },
];

const llm = new Map<string, LlmReviewScore>([
  ["r1", { id: "r1", aiLikelihood: 0.9, specificity: 0.2, sentiment: 0.8 }],
  ["r2", { id: "r2", aiLikelihood: 0.1, specificity: 0.9, sentiment: 0.7 }],
]);

describe("aiGeneratedSignal", () => {
  it("returns neutral output without LLM scores", () => {
    expect(aiGeneratedSignal(reviews).score).toBe(0);
  });

  it("averages AI likelihood and includes high-likelihood evidence", () => {
    const res = aiGeneratedSignal(reviews, llm);
    expect(res.score).toBeCloseTo(0.5);
    expect(res.evidenceReviewIds).toEqual(["r1"]);
  });
});

describe("genericSignal", () => {
  it("uses inverse specificity and includes vague-review evidence", () => {
    const res = genericSignal(reviews, llm);
    expect(res.score).toBeCloseTo(0.45);
    expect(res.evidenceReviewIds).toEqual(["r1"]);
  });
});
