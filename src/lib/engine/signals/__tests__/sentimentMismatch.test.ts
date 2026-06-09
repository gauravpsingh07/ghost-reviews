import { describe, it, expect } from "vitest";
import { sentimentMismatch } from "@/lib/engine/signals/sentimentMismatch";
import type { Review, LlmReviewScore } from "@/types";

const base = { date: new Date().toISOString(), source: "amazon" as const };

describe("sentimentMismatch", () => {
  it("returns 0 without LLM scores", () => {
    expect(sentimentMismatch([{ id: "1", rating: 5, text: "y", ...base }]).score).toBe(0);
  });

  it("flags a 5-star review with negative tone", () => {
    const reviews: Review[] = [{ id: "1", rating: 5, text: "meh, not great", ...base }];
    const llm = new Map<string, LlmReviewScore>([
      ["1", { id: "1", aiLikelihood: 0, specificity: 0.5, sentiment: -0.9 }],
    ]);
    const res = sentimentMismatch(reviews, llm);
    expect(res.evidenceReviewIds).toEqual(["1"]);
    expect(res.score).toBeCloseTo(1);
  });
});
