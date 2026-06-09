import type { Review, LlmReviewScore } from "@/types";
import type { SignalResult } from "../types";
import { clamp01 } from "../math";

/**
 * Flags reviews whose text sentiment contradicts the star rating (e.g. 5★ with lukewarm text).
 * Requires LLM sentiment (Phase 3). Without it, returns a neutral 0 (deterministic-only mode).
 */
export function sentimentMismatch(
  reviews: Review[],
  llm?: Map<string, LlmReviewScore>,
): SignalResult {
  if (!llm || llm.size === 0) {
    return { score: 0, detail: "Sentiment analysis not run.", evidenceReviewIds: [] };
  }

  const considered = reviews.filter((r) => llm.has(r.id));
  if (considered.length === 0) {
    return { score: 0, detail: "No sentiment scores available.", evidenceReviewIds: [] };
  }

  const mismatched = considered.filter((r) => {
    const s = llm.get(r.id)!;
    const expected = (r.rating - 3) / 2; // map 1..5 -> -1..1
    return Math.abs(expected - s.sentiment) >= 0.8;
  });

  if (mismatched.length === 0) {
    return { score: 0, detail: "Review text matches the star ratings.", evidenceReviewIds: [] };
  }

  return {
    score: clamp01(mismatched.length / considered.length),
    detail: `${mismatched.length} reviews have a tone that contradicts their star rating.`,
    evidenceReviewIds: mismatched.map((r) => r.id),
  };
}
