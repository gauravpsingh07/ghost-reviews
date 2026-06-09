import type { SourceId } from "@/types";
import { getNimbleClient, type NimbleClient, type NimbleSearchResult } from "./client";

export interface ReviewSourceCandidate {
  source: SourceId;
  url: string;
  title?: string;
  description?: string;
  confidence: number;
}

export interface ResolveReviewSourcesOptions {
  maxSearchResults?: number;
  maxSources?: number;
}

const SOURCE_HOSTS: Array<{ source: SourceId; hosts: string[]; baseConfidence: number }> = [
  { source: "trustpilot", hosts: ["trustpilot.com"], baseConfidence: 0.95 },
  { source: "amazon", hosts: ["amazon."], baseConfidence: 0.85 },
  { source: "yelp", hosts: ["yelp.com"], baseConfidence: 0.8 },
  { source: "appstore", hosts: ["apps.apple.com"], baseConfidence: 0.75 },
  { source: "google", hosts: ["google.com", "maps.google.com"], baseConfidence: 0.55 },
];

const REVIEW_HINTS = /\b(review|reviews|rating|ratings|customer feedback|trustpilot|yelp)\b/i;

function clamp01(score: number): number {
  return Math.max(0, Math.min(1, score));
}

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function normalizeUrlKey(url: string): string {
  const parsed = parseUrl(url);
  if (!parsed) return url;
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}

export function inferReviewSource(url: string): SourceId {
  const parsed = parseUrl(url);
  if (!parsed) return "other";
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const match = SOURCE_HOSTS.find((entry) => entry.hosts.some((needle) => host.includes(needle)));
  return match?.source ?? "other";
}

function sourceBaseConfidence(source: SourceId): number {
  return SOURCE_HOSTS.find((entry) => entry.source === source)?.baseConfidence ?? 0.35;
}

function confidenceForResult(result: NimbleSearchResult, source: SourceId): number {
  const haystack = [result.title, result.description, result.url, result.content].filter(Boolean).join(" ");
  const reviewBonus = REVIEW_HINTS.test(haystack) ? 0.12 : 0;
  const pathBonus = /\/(review|reviews|product-reviews|customer-reviews|biz)\b/i.test(result.url)
    ? 0.08
    : 0;
  return clamp01(sourceBaseConfidence(source) + reviewBonus + pathBonus);
}

export function buildReviewSourceSearchQuery(query: string): string {
  return `${query.trim()} reviews customer ratings Trustpilot Amazon`;
}

export function rankReviewSourceResults(results: NimbleSearchResult[]): ReviewSourceCandidate[] {
  const byUrl = new Map<string, ReviewSourceCandidate>();

  for (const result of results) {
    if (!result.url) continue;
    const source = inferReviewSource(result.url);
    const confidence = confidenceForResult(result, source);
    if (source === "other" && confidence < 0.45) continue;

    const key = normalizeUrlKey(result.url);
    const candidate: ReviewSourceCandidate = {
      source,
      url: result.url,
      title: result.title,
      description: result.description,
      confidence,
    };
    const existing = byUrl.get(key);
    if (!existing || candidate.confidence > existing.confidence) byUrl.set(key, candidate);
  }

  return [...byUrl.values()].sort((a, b) => b.confidence - a.confidence);
}

export async function resolveReviewSources(
  query: string,
  client: NimbleClient = getNimbleClient(),
  options: ResolveReviewSourcesOptions = {},
): Promise<ReviewSourceCandidate[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const directUrl = parseUrl(trimmed);
  if (directUrl) {
    return [
      {
        source: inferReviewSource(trimmed),
        url: trimmed,
        confidence: 1,
      },
    ];
  }

  const response = await client.search({
    query: buildReviewSourceSearchQuery(trimmed),
    focus: "web",
    max_results: options.maxSearchResults ?? 10,
  });

  return rankReviewSourceResults(response.results).slice(0, options.maxSources ?? 3);
}
