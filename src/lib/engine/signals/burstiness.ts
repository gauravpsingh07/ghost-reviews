import type { Review } from "@/types";
import type { SignalResult } from "../types";
import { clamp01, median } from "../math";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Flags suspicious clusters of reviews in a short window (paid bursts / review bombing).
 * baseline = median reviews per active day; a "burst" day has >= 3x baseline.
 */
export function burstiness(reviews: Review[]): SignalResult {
  const dated = reviews.filter((r) => Date.parse(r.date) > 0);
  if (dated.length < 5) {
    return { score: 0, detail: "Not enough dated reviews to assess timing.", evidenceReviewIds: [] };
  }

  const byDay = new Map<number, Review[]>();
  for (const r of dated) {
    const day = Math.floor(Date.parse(r.date) / DAY_MS);
    const arr = byDay.get(day);
    if (arr) arr.push(r);
    else byDay.set(day, [r]);
  }

  const counts = [...byDay.values()].map((v) => v.length);
  const baseline = Math.max(1, median(counts));
  const burstDays = [...byDay.entries()].filter(([, v]) => v.length >= 3 * baseline);
  const burstReviews = burstDays.flatMap(([, v]) => v);

  if (burstReviews.length === 0) {
    return { score: 0, detail: "Review timing looks organic.", evidenceReviewIds: [] };
  }

  const peak = burstDays.reduce((a, b) => (b[1].length > a[1].length ? b : a));
  const multiplier = Math.round((peak[1].length / baseline) * 10) / 10;
  return {
    score: clamp01(burstReviews.length / dated.length),
    detail: `${burstReviews.length} reviews arrived in burst windows (peak ${peak[1].length} in a single day, ${multiplier}x the typical rate).`,
    evidenceReviewIds: burstReviews.map((r) => r.id),
  };
}
