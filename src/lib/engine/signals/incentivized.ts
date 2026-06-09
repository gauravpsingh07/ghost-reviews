import type { Review } from "@/types";
import type { SignalResult } from "../types";
import { clamp01 } from "../math";

const PATTERNS: RegExp[] = [
  /free (product|sample|item|unit)/i,
  /in exchange for (an?\s+)?(honest\s+)?review/i,
  /received .*(for free|at a discount)/i,
  /discount(ed)? (in exchange|for (my|a|an honest) review)/i,
  /complimentary (product|unit|sample)/i,
  /\b(sponsored|gifted)\b/i,
];

/** Detects incentivized-review language ("free in exchange for an honest review", etc.). */
export function incentivized(reviews: Review[]): SignalResult {
  if (reviews.length === 0) {
    return { score: 0, detail: "No reviews.", evidenceReviewIds: [] };
  }

  const hits = reviews.filter((r) => PATTERNS.some((re) => re.test(r.text)));
  if (hits.length === 0) {
    return { score: 0, detail: "No incentivized-review language found.", evidenceReviewIds: [] };
  }

  return {
    score: clamp01(hits.length / reviews.length),
    detail: `${hits.length} review${hits.length === 1 ? "" : "s"} mention free products, discounts, or gifts in exchange for a review.`,
    evidenceReviewIds: hits.map((r) => r.id),
  };
}
