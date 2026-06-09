"use client";

import { AlertTriangle, Ghost, ShieldCheck, Skull } from "lucide-react";
import { motion } from "framer-motion";
import type { ScanResult, VerdictTier } from "@/types";
import { cn } from "@/lib/utils";

export interface VerdictBannerProps {
  verdict: ScanResult["verdict"];
  score?: number;
  className?: string;
}

const TIER_COPY: Record<
  VerdictTier,
  {
    summary: string;
    className: string;
    icon: typeof ShieldCheck;
  }
> = {
  clean: {
    summary: "Signals look mostly organic, with little evidence of coordinated review activity.",
    className: "border-emerald-500/30 bg-emerald-950/30 text-emerald-100",
    icon: ShieldCheck,
  },
  mild: {
    summary: "A few patterns deserve a closer look, but the review set is not strongly haunted.",
    className: "border-amber-400/30 bg-amber-950/30 text-amber-100",
    icon: AlertTriangle,
  },
  haunted: {
    summary: "Multiple signals suggest some reviews may be coordinated, templated, or ghostwritten.",
    className: "border-orange-400/30 bg-orange-950/30 text-orange-100",
    icon: Ghost,
  },
  severe: {
    summary: "Strong signals suggest the review set may contain substantial inauthentic activity.",
    className: "border-red-400/30 bg-red-950/30 text-red-100",
    icon: Skull,
  },
};

export function VerdictBanner({ verdict, score, className }: VerdictBannerProps) {
  const copy = TIER_COPY[verdict.tier];
  const Icon = copy.icon;

  return (
    <motion.section
      className={cn(
        "flex w-full items-start gap-4 rounded-lg border p-4 shadow-lg shadow-black/20",
        copy.className,
        className,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-label={`Verdict: ${verdict.label}`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-black/20">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold leading-tight">{verdict.label}</h2>
          {typeof score === "number" ? (
            <span className="font-mono text-sm text-current/70">{Math.round(score)}/100</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-current/75">{copy.summary}</p>
      </div>
    </motion.section>
  );
}
