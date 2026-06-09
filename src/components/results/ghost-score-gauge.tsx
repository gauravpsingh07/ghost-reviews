"use client";

import { motion } from "framer-motion";
import type { VerdictTier } from "@/types";
import { cn } from "@/lib/utils";

export interface GhostScoreGaugeProps {
  score: number;
  tier?: VerdictTier;
  label?: string;
  className?: string;
}

const TIER_STYLES: Record<VerdictTier, { stroke: string; glow: string; text: string }> = {
  clean: {
    stroke: "stroke-emerald-400",
    glow: "shadow-emerald-500/20",
    text: "text-emerald-200",
  },
  mild: {
    stroke: "stroke-amber-300",
    glow: "shadow-amber-500/20",
    text: "text-amber-100",
  },
  haunted: {
    stroke: "stroke-orange-400",
    glow: "shadow-orange-500/25",
    text: "text-orange-100",
  },
  severe: {
    stroke: "stroke-red-400",
    glow: "shadow-red-500/25",
    text: "text-red-100",
  },
};

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function tierForScore(score: number): VerdictTier {
  if (score <= 25) return "clean";
  if (score <= 50) return "mild";
  if (score <= 75) return "haunted";
  return "severe";
}

export function GhostScoreGauge({
  score,
  tier,
  label = "Ghost Score",
  className,
}: GhostScoreGaugeProps) {
  const value = clampScore(score);
  const activeTier = tier ?? tierForScore(value);
  const styles = TIER_STYLES[activeTier];
  const progress = value / 100;

  return (
    <section
      className={cn(
        "relative grid aspect-square w-full max-w-[260px] place-items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl",
        styles.glow,
        className,
      )}
      aria-label={`${label}: ${value} out of 100`}
    >
      <svg
        className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] -rotate-90"
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        <circle
          className="stroke-zinc-800"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="10"
        />
        <motion.circle
          className={styles.stroke}
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeLinecap="round"
          strokeWidth="10"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="relative z-10 flex min-h-[132px] flex-col items-center justify-center text-center">
        <span className="text-xs font-medium uppercase tracking-normal text-zinc-500">{label}</span>
        <span className={cn("mt-2 text-6xl font-black tabular-nums leading-none", styles.text)}>
          {value}
        </span>
        <span className="mt-2 text-sm font-medium text-zinc-400">out of 100</span>
      </div>
    </section>
  );
}
