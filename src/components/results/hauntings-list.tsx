import type { Haunting, Severity } from "@/types";
import { cn } from "@/lib/utils";

export interface HauntingsListProps {
  hauntings: Haunting[];
  className?: string;
}

const SEVERITY_STYLES: Record<Severity, { card: string; label: string }> = {
  low: {
    card: "border-emerald-500/20 bg-emerald-950/20",
    label: "text-emerald-200",
  },
  med: {
    card: "border-amber-400/25 bg-amber-950/20",
    label: "text-amber-100",
  },
  high: {
    card: "border-red-400/25 bg-red-950/20",
    label: "text-red-100",
  },
};

function evidenceLabel(count: number): string {
  if (count === 0) return "aggregate signal";
  if (count === 1) return "1 review cited";
  return `${count} reviews cited`;
}

export function HauntingsList({ hauntings, className }: HauntingsListProps) {
  if (hauntings.length === 0) {
    return (
      <section className={cn("rounded-lg border border-zinc-800 bg-zinc-950/60 p-5", className)}>
        <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-400">Hauntings</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          No major review-pattern hauntings crossed the evidence threshold.
        </p>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-400">Hauntings</h2>
        <span className="text-xs text-zinc-500">{hauntings.length} detected</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {hauntings.map((haunting) => {
          const styles = SEVERITY_STYLES[haunting.severity];
          return (
            <li
              key={haunting.id}
              className={cn("rounded-lg border p-4 shadow-lg shadow-black/10", styles.card)}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-black/20 text-lg"
                  aria-hidden="true"
                >
                  {haunting.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">{haunting.title}</h3>
                    <span className={cn("text-xs font-medium uppercase", styles.label)}>
                      {haunting.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{haunting.detail}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    {evidenceLabel(haunting.evidenceRefs.length)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
