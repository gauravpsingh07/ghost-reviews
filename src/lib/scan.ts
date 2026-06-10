import type { Review, ScanResult, SourceId } from "@/types";
import { analyzeReviews } from "@/lib/engine";
import { loadDemoScanResult } from "@/lib/fixtures";
import {
  extractReviewContent,
  getReviewSourceAdapter,
  mapSourceContentToReviews,
  resolveReviewSources,
} from "@/lib/nimble";
import { analyzeReviewsWithLlm, generateHauntingExplanations } from "@/lib/llm";
import { env } from "@/lib/env";

export const DEMO_ONLY_MESSAGE =
  "This hosted demo runs on bundled sample data. Try one of the example products above for a full report.";

export interface ScanProductInput {
  query: string;
  source?: SourceId | "auto";
}

export class ScanError extends Error {
  constructor(
    readonly code: "NO_REVIEWS" | "DEMO_ONLY",
    message: string,
  ) {
    super(message);
    this.name = "ScanError";
  }
}

export async function scanProduct(input: ScanProductInput): Promise<ScanResult> {
  const { query } = input;
  // Only return a fixture when the query actually matches one (no silent fallback).
  const demo = loadDemoScanResult(query, { forceDemoMode: false });
  if (demo) return demo;

  // Hosted demo: don't live-crawl arbitrary queries — guide the user to the example products
  // instead of returning an unrelated sample.
  if (env.DEMO_MODE) {
    throw new ScanError("DEMO_ONLY", DEMO_ONLY_MESSAGE);
  }

  const sources = await resolveReviewSources(query);
  const candidates =
    input.source && input.source !== "auto"
      ? sources.filter((candidate) => candidate.source === input.source)
      : sources;
  if (candidates.length === 0) throw new ScanError("NO_REVIEWS", "No review sources found.");

  // Try sources in ranked order; skip any that block the crawl (e.g. Trustpilot/Amazon 403) or yield nothing.
  let reviews: Review[] = [];
  let usedSource = candidates[0];
  for (const candidate of candidates) {
    try {
      const adapter = getReviewSourceAdapter(candidate);
      const page = await extractReviewContent(candidate, undefined, adapter?.extractOptions);
      const mapped = mapSourceContentToReviews(candidate, [page]);
      if (mapped.length > reviews.length) {
        reviews = mapped;
        usedSource = candidate;
      }
      if (reviews.length >= 5) break;
    } catch {
      // source blocked or failed — try the next candidate
    }
  }
  if (reviews.length === 0) throw new ScanError("NO_REVIEWS", "No reviews found.");

  const llmScores = await analyzeReviewsWithLlm(reviews).catch(() => undefined);
  const result = analyzeReviews({
    product: {
      name: query,
      url: usedSource.url,
      source: usedSource.source,
    },
    reviews,
    llm: llmScores,
    demoMode: false,
  });

  const hauntings = await generateHauntingExplanations({
    productName: result.product.name,
    signals: result.signals,
    hauntings: result.hauntings,
    reviews,
  }).catch(() => result.hauntings);

  return { ...result, hauntings };
}
