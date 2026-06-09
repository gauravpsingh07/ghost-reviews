import type { Review } from "@/types";
import type { SignalResult } from "../types";
import { clamp01 } from "../math";

const SIM_THRESHOLD = 0.85;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function termFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function magnitude(m: Map<string, number>): number {
  let s = 0;
  for (const v of m.values()) s += v * v;
  return Math.sqrt(s);
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [t, av] of a) {
    const bv = b.get(t);
    if (bv) dot += av * bv;
  }
  const denom = magnitude(a) * magnitude(b);
  return denom === 0 ? 0 : dot / denom;
}

/** Flags near-duplicate reviews (copy-paste farms) via cosine similarity over term vectors. */
export function duplication(reviews: Review[]): SignalResult {
  if (reviews.length < 3) {
    return { score: 0, detail: "Not enough reviews to compare.", evidenceReviewIds: [] };
  }

  const vecs = reviews.map((rv) => ({ id: rv.id, tf: termFreq(tokenize(rv.text)) }));
  const dupIds = new Set<string>();
  let pairCount = 0;

  for (let i = 0; i < vecs.length; i++) {
    for (let j = i + 1; j < vecs.length; j++) {
      if (cosine(vecs[i].tf, vecs[j].tf) >= SIM_THRESHOLD) {
        dupIds.add(vecs[i].id);
        dupIds.add(vecs[j].id);
        pairCount++;
      }
    }
  }

  if (dupIds.size === 0) {
    return { score: 0, detail: "No near-duplicate reviews detected.", evidenceReviewIds: [] };
  }

  return {
    score: clamp01(dupIds.size / reviews.length),
    detail: `${dupIds.size} reviews are near-identical to others (${pairCount} matching pair${pairCount === 1 ? "" : "s"}).`,
    evidenceReviewIds: [...dupIds],
  };
}
