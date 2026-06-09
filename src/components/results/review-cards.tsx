"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Ghost, ListFilter } from "lucide-react";
import type { AnalyzedReview, ReviewVerdict } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReviewCardsProps {
  reviews: AnalyzedReview[];
  className?: string;
}

type ReviewFilter = "all" | ReviewVerdict;

const FILTERS: Array<{ key: ReviewFilter; label: string; icon: typeof ListFilter }> = [
  { key: "all", label: "All", icon: ListFilter },
  { key: "ghost", label: "Ghost", icon: Ghost },
  { key: "suspicious", label: "Suspicious", icon: AlertTriangle },
  { key: "authentic", label: "Authentic", icon: CheckCircle2 },
];

const VERDICT_STYLES: Record<ReviewVerdict, { label: string; icon: typeof CheckCircle2; badge: string }> = {
  authentic: {
    label: "Authentic",
    icon: CheckCircle2,
    badge: "border-emerald-500/25 bg-emerald-950/35 text-emerald-100",
  },
  suspicious: {
    label: "Suspicious",
    icon: AlertTriangle,
    badge: "border-amber-400/25 bg-amber-950/35 text-amber-100",
  },
  ghost: {
    label: "Ghost",
    icon: Ghost,
    badge: "border-red-400/25 bg-red-950/35 text-red-100",
  },
};

function countForFilter(reviews: AnalyzedReview[], filter: ReviewFilter): number {
  if (filter === "all") return reviews.length;
  return reviews.filter((review) => review.verdict === filter).length;
}

export function ReviewCards({ reviews, className }: ReviewCardsProps) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const filteredReviews = useMemo(
    () => (filter === "all" ? reviews : reviews.filter((review) => review.verdict === filter)),
    [filter, reviews],
  );

  return (
    <section className={className}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-400">Reviews</h2>
          <p className="mt-1 text-sm text-zinc-500">{filteredReviews.length} shown</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex" role="group" aria-label="Filter reviews">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const active = filter === item.key;
            return (
              <Button
                key={item.key}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className="h-9 justify-start"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
                <span className="ml-auto font-mono text-xs opacity-70">
                  {countForFilter(reviews, item.key)}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredReviews.map((review) => {
          const verdict = VERDICT_STYLES[review.verdict];
          const Icon = verdict.icon;
          return (
            <article
              key={review.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 shadow-lg shadow-black/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-200">{review.author ?? "Unknown reviewer"}</span>
                    <span aria-hidden="true">|</span>
                    <span className="font-mono">{review.rating}/5</span>
                    <span aria-hidden="true">|</span>
                    <span className="capitalize">{review.source}</span>
                    {review.verifiedPurchase ? (
                      <>
                        <span aria-hidden="true">|</span>
                        <span>Verified purchase</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-2 rounded-md border px-2.5 text-xs font-medium",
                    verdict.badge,
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {verdict.label}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-300">{review.text}</p>

              {review.reasons.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {review.reasons.map((reason) => (
                    <li
                      key={`${review.id}-${reason}`}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
