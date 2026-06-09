import type { Haunting, Severity, SignalScores } from "@/types";
import type { SignalResult } from "./types";

const META: Record<keyof SignalScores, { icon: string; title: string }> = {
  burstiness: { icon: "🕯️", title: "Review burst" },
  duplication: { icon: "👯", title: "Copy-paste coven" },
  aiGenerated: { icon: "🤖", title: "Machine-written" },
  generic: { icon: "🌫️", title: "Vague & generic" },
  ratingAnomaly: { icon: "📊", title: "Rigged ratings" },
  sentimentMismatch: { icon: "🎭", title: "Tone mismatch" },
  incentivized: { icon: "🎁", title: "Bought-and-paid" },
};

const MIN_SCORE = 0.25; // only surface signals that actually fired

function severityFromScore(score: number): Severity {
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "med";
  return "low";
}

function rank(s: Severity): number {
  return s === "high" ? 3 : s === "med" ? 2 : 1;
}

/** Turn the signals that crossed threshold into themed, evidence-backed "hauntings". */
export function buildHauntings(
  results: Partial<Record<keyof SignalScores, SignalResult>>,
): Haunting[] {
  const hauntings: Haunting[] = [];
  for (const key of Object.keys(META) as (keyof SignalScores)[]) {
    const res = results[key];
    if (!res || res.score < MIN_SCORE) continue;
    hauntings.push({
      id: key,
      icon: META[key].icon,
      title: META[key].title,
      detail: res.detail,
      severity: severityFromScore(res.score),
      evidenceRefs: res.evidenceReviewIds,
    });
  }
  return hauntings.sort((a, b) => rank(b.severity) - rank(a.severity));
}
