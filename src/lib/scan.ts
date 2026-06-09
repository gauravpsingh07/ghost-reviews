import type { ScanResult } from "@/types";
import { analyzeReviews } from "@/lib/engine";
import { loadDemoScanResult } from "@/lib/fixtures";
import {
  extractReviewContent,
  getReviewSourceAdapter,
  mapSourceContentToReviews,
  resolveReviewSources,
} from "@/lib/nimble";
import { analyzeReviewsWithLlm, generateHauntingExplanations } from "@/lib/llm";

export interface ScanProductInput {
  query: string;
}

export async function scanProduct({ query }: ScanProductInput): Promise<ScanResult> {
  const demo = loadDemoScanResult(query);
  if (demo) return demo;

  const sources = await resolveReviewSources(query);
  const source = sources[0];
  if (!source) throw new Error("No review sources found.");

  const adapter = getReviewSourceAdapter(source);
  const page = await extractReviewContent(source, undefined, adapter?.extractOptions);
  const reviews = mapSourceContentToReviews(source, [page]);
  if (reviews.length === 0) throw new Error("No reviews found.");

  const llmScores = await analyzeReviewsWithLlm(reviews).catch(() => undefined);
  const result = analyzeReviews({
    product: {
      name: query,
      url: source.url,
      source: source.source,
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
