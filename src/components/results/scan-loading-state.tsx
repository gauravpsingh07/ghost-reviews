"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Radar, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScanLoadingStateProps {
  className?: string;
}

export function ScanLoadingState({ className }: ScanLoadingStateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={cn(
        "grid min-h-[320px] place-items-center rounded-lg border border-zinc-800 bg-zinc-950/70 p-8 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex max-w-md flex-col items-center">
        <div className="relative grid h-24 w-24 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full border border-violet-400/25"
            animate={reduceMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.7, 0.2, 0.7] }}
            transition={reduceMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute inset-3 rounded-full border border-cyan-300/20"
            animate={reduceMotion ? undefined : { scale: [1.1, 0.92, 1.1], opacity: [0.2, 0.7, 0.2] }}
            transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative grid h-14 w-14 place-items-center rounded-lg bg-zinc-900 text-violet-100">
            <Radar className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mt-5 text-lg font-semibold text-zinc-100">Conducting a seance</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Crawling review pages and checking the evidence trail.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
          <Search className="h-4 w-4" aria-hidden="true" />
          Summoning review signals
        </div>
      </div>
    </section>
  );
}
