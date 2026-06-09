import type { SignalScores } from "@/types";
import { SIGNAL_WEIGHTS } from "@/lib/engine";
import { cn } from "@/lib/utils";

export interface SignalBreakdownMetersProps {
  signals: SignalScores;
  className?: string;
}

const SIGNAL_META: Record<
  keyof SignalScores,
  { label: string; detail: string; bar: string; track: string }
> = {
  burstiness: {
    label: "Review burst",
    detail: "Unusual timing clusters",
    bar: "bg-amber-300",
    track: "bg-amber-950/35",
  },
  duplication: {
    label: "Near-duplicates",
    detail: "Copy-paste similarity",
    bar: "bg-orange-300",
    track: "bg-orange-950/35",
  },
  aiGenerated: {
    label: "Machine-written",
    detail: "AI or templated language",
    bar: "bg-red-300",
    track: "bg-red-950/35",
  },
  generic: {
    label: "Low specificity",
    detail: "Vague, low-detail wording",
    bar: "bg-fuchsia-300",
    track: "bg-fuchsia-950/30",
  },
  ratingAnomaly: {
    label: "Rating anomaly",
    detail: "Hollow or extreme rating curve",
    bar: "bg-sky-300",
    track: "bg-sky-950/30",
  },
  sentimentMismatch: {
    label: "Tone mismatch",
    detail: "Text sentiment vs stars",
    bar: "bg-cyan-300",
    track: "bg-cyan-950/30",
  },
  incentivized: {
    label: "Incentivized",
    detail: "Free-product or discount language",
    bar: "bg-rose-300",
    track: "bg-rose-950/30",
  },
};

function pct(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export function SignalBreakdownMeters({ signals, className }: SignalBreakdownMetersProps) {
  return (
    <section className={cn("rounded-lg border border-zinc-800 bg-zinc-950/60 p-5", className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-400">Signals</h2>
        <span className="text-xs text-zinc-500">weighted blend</span>
      </div>
      <ul className="grid gap-4">
        {(Object.keys(SIGNAL_META) as (keyof SignalScores)[]).map((key) => {
          const meta = SIGNAL_META[key];
          const value = pct(signals[key]);
          const weight = Math.round(SIGNAL_WEIGHTS[key] * 100);
          return (
            <li key={key} className="grid gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">{meta.label}</h3>
                  <p className="text-xs leading-5 text-zinc-500">{meta.detail}</p>
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-zinc-400">
                  <div>{value}%</div>
                  <div className="text-zinc-600">w {weight}%</div>
                </div>
              </div>
              <div
                className={cn("h-2 overflow-hidden rounded-full", meta.track)}
                role="progressbar"
                aria-label={`${meta.label}: ${value}% suspicious`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
              >
                <div className={cn("h-full rounded-full", meta.bar)} style={{ width: `${value}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
