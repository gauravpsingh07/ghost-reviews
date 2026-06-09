import { Copy } from "lucide-react";
import type { AnalyzedReview, Haunting } from "@/types";
import { cn } from "@/lib/utils";

export interface DuplicateEvidenceViewProps {
  reviews: AnalyzedReview[];
  hauntings: Haunting[];
  className?: string;
}

function duplicateReviews(reviews: AnalyzedReview[], hauntings: Haunting[]): AnalyzedReview[] {
  const duplicate = hauntings.find((haunting) => haunting.id === "duplication");
  if (!duplicate) return [];
  const ids = new Set(duplicate.evidenceRefs);
  return reviews.filter((review) => ids.has(review.id)).slice(0, 4);
}

function excerpt(text: string): string {
  return text.length > 360 ? `${text.slice(0, 360)}...` : text;
}

export function DuplicateEvidenceView({ reviews, hauntings, className }: DuplicateEvidenceViewProps) {
  const evidence = duplicateReviews(reviews, hauntings);

  return (
    <section className={cn("rounded-lg border border-zinc-800 bg-zinc-950/60 p-5", className)}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-zinc-900 text-zinc-300">
          <Copy className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-400">
            Duplicate Evidence
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Near-identical reviews shown side by side</p>
        </div>
      </div>

      {evidence.length < 2 ? (
        <p className="text-sm leading-6 text-zinc-500">
          No duplicate-review pairs crossed the evidence threshold.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {evidence.map((review) => (
            <article key={review.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-300">{review.author ?? "Unknown reviewer"}</span>
                <span aria-hidden="true">|</span>
                <span className="font-mono">{review.rating}/5</span>
                <span aria-hidden="true">|</span>
                <span className="capitalize">{review.source}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-200">{excerpt(review.text)}</p>
              {review.reasons.length > 0 ? (
                <p className="mt-3 text-xs text-zinc-500">{review.reasons[0]}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
