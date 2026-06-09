import type { ScanResult, SourceId } from "@/types";
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
  source?: SourceId | "auto";
}

export class ScanError extends Error {
  constructor(
    readonly code: "NO_REVIEWS",
    message: string,
  ) {
    super(message);
    this.name = "ScanError";
  }
}

function chooseSource(
  sources: Awaited<ReturnType<typeof resolveReviewSources>>,
  preferred: SourceId | "auto" | undefined,
) {
  if (!preferred || preferred === "auto") return sources[0];
  return sources.find((source) => source.source === preferred);
}

export async function scanProduct(input: ScanProductInput): Promise<ScanResult> {
  const { query } = input;
  const demo = loadDemoScanResult(query);
  if (demo) return demo;

  const sources = await resolveReviewSources(query);
  const source = chooseSource(sources, input.source);
  if (!source) throw new ScanError("NO_REVIEWS", "No review sources found.");

  const adapter = getReviewSourceAdapter(source);
  const page = await extractReviewContent(source, undefined, adapter?.extractOptions);
  const reviews = mapSourceContentToReviews(source, [page]);
  if (reviews.length === 0) throw new ScanError("NO_REVIEWS", "No reviews found.");

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
