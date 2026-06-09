import type { Review, SourceId } from "@/types";

/** Tiny deterministic string hash (djb2) -> base36. Not crypto; just stable ids. */
export function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function makeReviewId(parts: {
  source: string;
  author?: string;
  date?: string;
  text: string;
}): string {
  return `r_${hashString([parts.source, parts.author ?? "", parts.date ?? "", parts.text].join("|"))}`;
}

/** Collapse runs of whitespace and trim. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clampRating(rating: number): number {
  if (Number.isNaN(rating)) return 0;
  return Math.max(1, Math.min(5, Math.round(rating)));
}

export interface RawReview {
  author?: string;
  rating: number | string;
  date?: string;
  text: string;
  source?: SourceId;
  verifiedPurchase?: boolean;
}

export function normalizeReview(raw: RawReview, fallbackSource: SourceId = "other"): Review {
  const source = raw.source ?? fallbackSource;
  const text = normalizeText(String(raw.text ?? ""));
  const ratingNum = typeof raw.rating === "string" ? parseFloat(raw.rating) : raw.rating;
  const rating = clampRating(ratingNum);
  const date =
    raw.date && !Number.isNaN(Date.parse(raw.date))
      ? new Date(raw.date).toISOString()
      : new Date(0).toISOString();
  return {
    id: makeReviewId({ source, author: raw.author, date, text }),
    author: raw.author?.trim() || undefined,
    rating,
    date,
    text,
    source,
    verifiedPurchase: raw.verifiedPurchase,
  };
}

/** Normalize, drop empty-text reviews, and dedupe exact duplicates by id. */
export function normalizeReviews(raws: RawReview[], fallbackSource: SourceId = "other"): Review[] {
  const seen = new Set<string>();
  const out: Review[] = [];
  for (const raw of raws) {
    const r = normalizeReview(raw, fallbackSource);
    if (!r.text) continue;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}
