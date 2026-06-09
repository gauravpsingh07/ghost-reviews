import type { ScanResult } from "@/types";
import type { ScanRequestBody } from "./scan";

export const SCAN_CACHE_TTL_MS = 10 * 60 * 1000;
export const SCAN_CACHE_MAX_ENTRIES = 50;
export const SCAN_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const SCAN_RATE_LIMIT_MAX = 20;

interface CacheEntry {
  expiresAt: number;
  result: ScanResult;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

const scanCache = new Map<string, CacheEntry>();
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function cloneScanResult(result: ScanResult): ScanResult {
  return JSON.parse(JSON.stringify(result)) as ScanResult;
}

function cacheKey(input: ScanRequestBody): string {
  return `${input.source}:${input.query.toLowerCase().trim().replace(/\s+/g, " ")}`;
}

function pruneExpired(now: number): void {
  for (const [key, entry] of scanCache) {
    if (entry.expiresAt <= now) scanCache.delete(key);
  }
}

function trimCache(): void {
  while (scanCache.size > SCAN_CACHE_MAX_ENTRIES) {
    const oldestKey = scanCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    scanCache.delete(oldestKey);
  }
}

export function getCachedScanResult(
  input: ScanRequestBody,
  now = Date.now(),
): ScanResult | undefined {
  pruneExpired(now);
  const entry = scanCache.get(cacheKey(input));
  if (!entry) return undefined;
  return cloneScanResult(entry.result);
}

export function setCachedScanResult(input: ScanRequestBody, result: ScanResult, now = Date.now()): void {
  pruneExpired(now);
  scanCache.set(cacheKey(input), {
    expiresAt: now + SCAN_CACHE_TTL_MS,
    result: cloneScanResult(result),
  });
  trimCache();
}

export function checkScanRateLimit(identifier: string, now = Date.now()): RateLimitDecision {
  const key = identifier || "anonymous";
  const existing = rateLimitBuckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + SCAN_RATE_LIMIT_WINDOW_MS };

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  const remaining = Math.max(0, SCAN_RATE_LIMIT_MAX - bucket.count);
  return {
    allowed: bucket.count <= SCAN_RATE_LIMIT_MAX,
    limit: SCAN_RATE_LIMIT_MAX,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function clearScanApiGuardsForTests(): void {
  scanCache.clear();
  rateLimitBuckets.clear();
}
