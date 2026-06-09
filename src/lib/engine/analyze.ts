import type { Review, ScanResult, SignalScores, LlmReviewScore, AnalyzedReview } from "@/types";
import type { SignalResult } from "./types";
import { burstiness } from "./signals/burstiness";
import { duplication } from "./signals/duplication";
import { ratingAnomaly } from "./signals/ratingAnomaly";
import { incentivized } from "./signals/incentivized";
import { sentimentMismatch } from "./signals/sentimentMismatch";
import { aiGeneratedSignal, genericSignal } from "./signals/llmSignals";
import { ghostScore, verdictTier } from "./score";
import { classifyReview } from "./verdict";
import { buildHauntings } from "./hauntings";

export interface AnalyzeInput {
  product: ScanResult["product"];
  reviews: Review[];
  /** Per-review LLM scores (Phase 3). Omit for deterministic-only scoring. */
  llm?: Map<string, LlmReviewScore>;
  demoMode?: boolean;
}

/**
 * Run the full detection engine and produce a ScanResult. Deterministic signals always run;
 * LLM-derived signals (aiGenerated, generic, sentimentMismatch) are 0 unless `llm` is provided.
 */
export function analyzeReviews({
  product,
  reviews,
  llm,
  demoMode = false,
}: AnalyzeInput): ScanResult {
  const results: Partial<Record<keyof SignalScores, SignalResult>> = {
    burstiness: burstiness(reviews),
    duplication: duplication(reviews),
    ratingAnomaly: ratingAnomaly(reviews),
    incentivized: incentivized(reviews),
    aiGenerated: aiGeneratedSignal(reviews, llm),
    generic: genericSignal(reviews, llm),
    sentimentMismatch: sentimentMismatch(reviews, llm),
  };

  const signals: SignalScores = {
    burstiness: results.burstiness!.score,
    duplication: results.duplication!.score,
    aiGenerated: results.aiGenerated!.score,
    generic: results.generic!.score,
    ratingAnomaly: results.ratingAnomaly!.score,
    sentimentMismatch: results.sentimentMismatch!.score,
    incentivized: results.incentivized!.score,
  };

  const score = ghostScore(signals);

  const dupSet = new Set(results.duplication!.evidenceReviewIds);
  const incSet = new Set(results.incentivized!.evidenceReviewIds);
  const burstSet = new Set(results.burstiness!.evidenceReviewIds);

  const analyzed: AnalyzedReview[] = reviews.map((r) =>
    classifyReview(r, {
      isDuplicate: dupSet.has(r.id),
      isIncentivized: incSet.has(r.id),
      inBurst: burstSet.has(r.id),
      llm: llm?.get(r.id),
    }),
  );

  return {
    product,
    ghostScore: score,
    verdict: verdictTier(score),
    reviewsAnalyzed: reviews.length,
    signals,
    hauntings: buildHauntings(results),
    reviews: analyzed,
    scannedAt: new Date().toISOString(),
    demoMode,
  };
}
