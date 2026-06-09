import type { LlmReviewScore, Review } from "@/types";
import type { SignalResult } from "../types";
import { clamp01, mean } from "../math";

function availableScores(reviews: Review[], llm?: Map<string, LlmReviewScore>): LlmReviewScore[] {
  if (!llm || llm.size === 0) return [];
  return reviews.map((review) => llm.get(review.id)).filter((score): score is LlmReviewScore => Boolean(score));
}

function pct(score: number): number {
  return Math.round(score * 100);
}

export function aiGeneratedSignal(
  reviews: Review[],
  llm?: Map<string, LlmReviewScore>,
): SignalResult {
  const scores = availableScores(reviews, llm);
  if (scores.length === 0) {
    return { score: 0, detail: "AI-writing analysis not run.", evidenceReviewIds: [] };
  }

  const score = clamp01(mean(scores.map((item) => clamp01(item.aiLikelihood))));
  const strong = scores.filter((item) => item.aiLikelihood >= 0.7);

  return {
    score,
    detail:
      strong.length > 0
        ? `${pct(score)}% average AI-likelihood; ${strong.length} review${strong.length === 1 ? "" : "s"} strongly read as AI-generated or templated.`
        : `${pct(score)}% average AI-likelihood across analyzed reviews.`,
    evidenceReviewIds: strong.map((item) => item.id),
  };
}

export function genericSignal(
  reviews: Review[],
  llm?: Map<string, LlmReviewScore>,
): SignalResult {
  const scores = availableScores(reviews, llm);
  if (scores.length === 0) {
    return { score: 0, detail: "Specificity analysis not run.", evidenceReviewIds: [] };
  }

  const genericScores = scores.map((item) => 1 - clamp01(item.specificity));
  const score = clamp01(mean(genericScores));
  const vague = scores.filter((item) => item.specificity <= 0.3);

  return {
    score,
    detail:
      vague.length > 0
        ? `${vague.length} review${vague.length === 1 ? "" : "s"} lack concrete product detail (${pct(score)}% average generic-language score).`
        : `${pct(score)}% average generic-language score across analyzed reviews.`,
    evidenceReviewIds: vague.map((item) => item.id),
  };
}
