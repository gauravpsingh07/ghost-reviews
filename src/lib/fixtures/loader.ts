import type { ScanResult } from "@/types";
import { env } from "@/lib/env";
import { DEMO_SCAN_FIXTURES, type DemoScanFixture } from "./demoScans";

export interface DemoScanLoadOptions {
  forceDemoMode?: boolean;
  fallbackKey?: string;
}

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function fixtureTerms(fixture: DemoScanFixture): string[] {
  return [fixture.key, fixture.result.product.name, fixture.result.product.url ?? "", ...fixture.queries].map(
    normalizeQuery,
  );
}

function cloneScanResult(result: ScanResult): ScanResult {
  return JSON.parse(JSON.stringify(result)) as ScanResult;
}

export function findDemoScanFixture(query: string): DemoScanFixture | undefined {
  const normalized = normalizeQuery(query);
  if (!normalized) return undefined;

  return DEMO_SCAN_FIXTURES.find((fixture) =>
    fixtureTerms(fixture).some((term) => term === normalized || normalized.includes(term)),
  );
}

export function loadDemoScanResult(
  query: string,
  options: DemoScanLoadOptions = {},
): ScanResult | undefined {
  const matched = findDemoScanFixture(query);
  if (matched) return cloneScanResult(matched.result);

  const forceDemoMode = options.forceDemoMode ?? env.DEMO_MODE;
  if (!forceDemoMode) return undefined;

  const fallback =
    DEMO_SCAN_FIXTURES.find((fixture) => fixture.key === options.fallbackKey) ?? DEMO_SCAN_FIXTURES[0];
  return fallback ? cloneScanResult(fallback.result) : undefined;
}

export function isDemoScanQuery(query: string): boolean {
  return Boolean(findDemoScanFixture(query));
}
