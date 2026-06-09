import type { SignalScores, VerdictTier } from "@/types";
import { clamp01 } from "./math";

/** Weights per BUILD_PLAN.md §3.1 (sum to 1.0). */
export const SIGNAL_WEIGHTS: Record<keyof SignalScores, number> = {
  burstiness: 0.2,
  duplication: 0.2,
  aiGenerated: 0.2,
  generic: 0.15,
  ratingAnomaly: 0.1,
  sentimentMismatch: 0.1,
  incentivized: 0.05,
};

/** Weighted blend of 0..1 signals -> 0..100 Ghost Score. */
export function ghostScore(signals: SignalScores): number {
  let sum = 0;
  for (const key of Object.keys(SIGNAL_WEIGHTS) as (keyof SignalScores)[]) {
    sum += SIGNAL_WEIGHTS[key] * clamp01(signals[key]);
  }
  return Math.round(100 * sum);
}

const TIERS: { max: number; tier: VerdictTier; label: string; emoji: string }[] = [
  { max: 25, tier: "clean", label: "Clean — barely a whisper", emoji: "✨" },
  { max: 50, tier: "mild", label: "Mildly haunted", emoji: "👻" },
  { max: 75, tier: "haunted", label: "Haunted — proceed with caution", emoji: "👻👻" },
  { max: 100, tier: "severe", label: "Heavily haunted", emoji: "💀" },
];

export function verdictTier(score: number): { tier: VerdictTier; label: string; emoji: string } {
  const t = TIERS.find((x) => score <= x.max) ?? TIERS[TIERS.length - 1];
  return { tier: t.tier, label: t.label, emoji: t.emoji };
}
