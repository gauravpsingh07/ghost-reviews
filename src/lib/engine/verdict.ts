import type { Review, AnalyzedReview, LlmReviewScore, ReviewVerdict } from "@/types";

export interface ReviewFlags {
  isDuplicate: boolean;
  isIncentivized: boolean;
  inBurst: boolean;
  llm?: LlmReviewScore;
}

/** Classify a single review from its per-review evidence. Pure + deterministic. */
export function classifyReview(review: Review, flags: ReviewFlags): AnalyzedReview {
  const reasons: string[] = [];
  let points = 0;

  if (flags.isDuplicate) {
    reasons.push("near-duplicate of other reviews");
    points += 2;
  }
  if (flags.llm && flags.llm.aiLikelihood >= 0.7) {
    reasons.push("reads as AI-generated");
    points += 2;
  }
  if (flags.isIncentivized) {
    reasons.push("mentions a free product or discount");
    points += 1;
  }
  if (flags.inBurst) {
    reasons.push("posted during a review burst");
    points += 1;
  }
  if (flags.llm && flags.llm.specificity <= 0.25) {
    reasons.push("vague, lacks concrete detail");
    points += 1;
  }
  if (flags.llm) {
    const expected = (review.rating - 3) / 2;
    if (Math.abs(expected - flags.llm.sentiment) >= 0.8) {
      reasons.push("tone contradicts the star rating");
      points += 1;
    }
  }

  let verdict: ReviewVerdict = "authentic";
  if (points >= 3) verdict = "ghost";
  else if (points >= 1) verdict = "suspicious";

  return { ...review, verdict, reasons };
}
