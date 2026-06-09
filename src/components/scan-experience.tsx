"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { AlertCircle, Radar, RotateCcw, Search, ShieldCheck } from "lucide-react";
import type { ScanResult } from "@/types";
import { Button } from "@/components/ui/button";
import { DuplicateEvidenceView } from "@/components/results/duplicate-evidence-view";
import { GhostScoreGauge } from "@/components/results/ghost-score-gauge";
import { HauntingsList } from "@/components/results/hauntings-list";
import { ReviewCards } from "@/components/results/review-cards";
import { ScanLoadingState } from "@/components/results/scan-loading-state";
import { ShareHauntingButton } from "@/components/results/share-haunting-button";
import { SignalBreakdownMeters } from "@/components/results/signal-breakdown-meters";
import { VerdictBanner } from "@/components/results/verdict-banner";

const DEMO_QUERIES = [
  { label: "Haunted charger", query: "ghostcase power snap" },
  { label: "Clean kettle", query: "cozybrew kettle" },
  { label: "Incentivized band", query: "glowfit pulse band" },
];

const HOW_IT_WORKS = [
  {
    label: "Crawl",
    text: "Find live review pages for the product or URL.",
    icon: Search,
  },
  {
    label: "Score",
    text: "Blend timing, duplication, ratings, language, and incentive signals.",
    icon: Radar,
  },
  {
    label: "Explain",
    text: "Show the evidence behind each haunting and per-review verdict.",
    icon: ShieldCheck,
  },
];

async function requestScan(query: string): Promise<ScanResult> {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const payload = (await response.json()) as ScanResult | { error?: { message?: string } };

  if (!response.ok) {
    const message = "error" in payload ? payload.error?.message : undefined;
    throw new Error(message ?? "The scan failed. Try a demo query or retry shortly.");
  }

  return payload as ScanResult;
}

function formatScannedAt(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ResultsComposition({ result }: { result: ScanResult }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 lg:grid-cols-[280px_1fr]">
        <div className="flex justify-center lg:justify-start">
          <GhostScoreGauge score={result.ghostScore} tier={result.verdict.tier} />
        </div>
        <div className="min-w-0">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span className="capitalize">{result.product.source}</span>
              <span aria-hidden="true">|</span>
              <span>{result.reviewsAnalyzed} reviews analyzed</span>
              <span aria-hidden="true">|</span>
              <span>{formatScannedAt(result.scannedAt)}</span>
              {result.demoMode ? (
                <>
                  <span aria-hidden="true">|</span>
                  <span>Demo fixture</span>
                </>
              ) : null}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-50">
              {result.product.name}
            </h2>
            {result.product.url ? (
              <p className="mt-1 truncate text-sm text-zinc-500">{result.product.url}</p>
            ) : null}
          </div>
          <VerdictBanner verdict={result.verdict} score={result.ghostScore} />
          <div className="mt-3 flex justify-start">
            <ShareHauntingButton result={result} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <HauntingsList hauntings={result.hauntings} />
          <DuplicateEvidenceView reviews={result.reviews} hauntings={result.hauntings} />
          <ReviewCards reviews={result.reviews} />
        </div>
        <SignalBreakdownMeters signals={result.signals} className="lg:sticky lg:top-6 lg:self-start" />
      </div>
    </div>
  );
}

function EmptyPrompt({ onDemoScan }: { onDemoScan: (query: string) => void }) {
  return (
    <section className="grid gap-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">No spirits summoned yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Start with a bundled demo scan for an instant no-network report, or scan live when
          credentials are configured.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => onDemoScan(DEMO_QUERIES[0].query)}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Run demo
      </Button>
    </section>
  );
}

function ScanErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-red-400/25 bg-red-950/25 p-4 text-sm text-red-100 sm:flex-row sm:items-start sm:justify-between"
      role="alert"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">The connection to the other side was lost</h2>
          <p className="mt-1 leading-6 text-red-100/75">{message}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={onRetry}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </section>
  );
}

export function ScanExperience() {
  const [query, setQuery] = useState("ghostcase power snap");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runScan(nextQuery: string): Promise<void> {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    setError(null);
    setIsLoading(true);
    try {
      const scan = await requestScan(trimmed);
      setResult(scan);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scan failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void runScan(query);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="relative -mx-4 grid gap-4 overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Image
            src="/ghost-mascot-og.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-background/70" />
          <div className="relative z-10 grid gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-violet-300">
                ghost.reviews
              </p>
              <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-normal text-zinc-50 sm:text-5xl">
                Every product is haunted. We find the ghosts.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
                Paste a product name or review URL to get a Ghost Score with concrete review evidence.
              </p>
            </div>
            <form
              className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950/75 p-3 sm:grid-cols-[1fr_auto]"
              onSubmit={handleSubmit}
            >
              <label className="sr-only" htmlFor="scan-query">
                Product name or review URL
              </label>
              <input
                id="scan-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Product name or review URL"
                className="h-12 min-w-0 rounded-md border border-zinc-800 bg-zinc-900 px-4 text-base text-zinc-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-4 w-4" aria-hidden="true" />
                )}
                Scan
              </Button>
            </form>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              {DEMO_QUERIES.map((item) => (
                <Button
                  key={item.query}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                  disabled={isLoading}
                  onClick={() => {
                    setQuery(item.query);
                    void runScan(item.query);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3" aria-label="How it works">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex min-h-[104px] items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-zinc-900 text-violet-200">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{item.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        {error ? <ScanErrorState message={error} onRetry={() => void runScan(query)} /> : null}

        {isLoading ? (
          <ScanLoadingState />
        ) : result ? (
          <ResultsComposition result={result} />
        ) : (
          <EmptyPrompt
            onDemoScan={(nextQuery) => {
              setQuery(nextQuery);
              void runScan(nextQuery);
            }}
          />
        )}
      </div>
    </main>
  );
}
