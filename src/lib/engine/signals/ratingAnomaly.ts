import type { Review } from "@/types";
import type { SignalResult } from "../types";
import { clamp01 } from "../math";

/**
 * Detects J-shaped / bimodal rating curves: extremes (5★ + 1★) dominate while the
 * 2–4★ middle nearly vanishes — a hallmark of manipulated ratings.
 */
export function ratingAnomaly(reviews: Review[]): SignalResult {
  const rated = reviews.filter((r) => r.rating >= 1 && r.rating <= 5);
  if (rated.length < 5) {
    return {
      score: 0,
      detail: "Not enough ratings to assess distribution.",
      evidenceReviewIds: [],
    };
  }

  const n = rated.length;
  const hist = [0, 0, 0, 0, 0, 0]; // index 1..5 used
  for (const r of rated) hist[r.rating]++;

  const fiveStar = hist[5] / n;
  const oneStar = hist[1] / n;
  const middle = (hist[2] + hist[3] + hist[4]) / n;
  const extremes = fiveStar + oneStar;

  // High only when extremes dominate AND the middle is hollowed out.
  const score = clamp01((extremes - 0.6) / 0.4) * clamp01((0.2 - middle) / 0.2);
  const pct = (x: number) => Math.round(x * 100);

  return {
    score,
    detail: `${pct(fiveStar)}% 5★, ${pct(oneStar)}% 1★, only ${pct(middle)}% in the 2–4★ middle.`,
    evidenceReviewIds: [],
  };
}
