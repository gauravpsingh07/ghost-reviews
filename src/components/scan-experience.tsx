"use client";

import { type FormEvent, useState } from "react";
import { AlertCircle, Radar, RotateCcw, Search, ShieldCheck } from "lucide-react";
import type { ScanResult } from "@/types";
import { Button } from "@/components/ui/button";
import { DuplicateEvidenceView } from "@/components/results/duplicate-evidence-view";
import { GhostScoreGauge } from "@/components/results/ghost-score-gauge";
import { HauntingsList } from "@/components/results/hauntings-list";
import { ReviewCards } from "@/components/results/review-cards";
import { ScanLoadingState } from "@/components/results/scan-loading-state";
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

function EmptyPrompt() {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Ready to scan</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
        Try a demo query for an instant no-network report, or paste a product name or review URL for
        a live scan when Nimble credentials are configured.
      </p>
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
        <header className="grid gap-4">
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
            className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 sm:grid-cols-[1fr_auto]"
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
            <Button type="submit" size="lg" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              Scan
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {DEMO_QUERIES.map((item) => (
              <Button
                key={item.query}
                type="button"
                variant="outline"
                size="sm"
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
                  className="flex min-h-[104px] items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/55 p-4"
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
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-950/25 p-4 text-sm text-red-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        {isLoading ? <ScanLoadingState /> : result ? <ResultsComposition result={result} /> : <EmptyPrompt />}
      </div>
    </main>
  );
}
