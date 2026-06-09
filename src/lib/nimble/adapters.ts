import type { Review, SourceId } from "@/types";
import type { RawReviewContentPage, ReviewContentCrawlOptions, ReviewContentExtractOptions } from "./content";
import type { ReviewSourceCandidate } from "./sources";
import { mapRawNimbleOutputToReviews } from "./reviews";

export interface ReviewSourceAdapter {
  source: SourceId;
  canHandle(candidate: Pick<ReviewSourceCandidate, "source" | "url">): boolean;
  extractOptions: ReviewContentExtractOptions;
  crawlOptions: ReviewContentCrawlOptions;
  mapContentToReviews(pages: RawReviewContentPage[]): Review[];
}

function withSource(pages: RawReviewContentPage[], source: SourceId): RawReviewContentPage[] {
  return pages.map((page) => ({ ...page, source }));
}

function hostIncludes(url: string, hostPart: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes(hostPart);
  } catch {
    return false;
  }
}

function ensureSource(reviews: Review[], source: SourceId): Review[] {
  return reviews.map((review) => ({ ...review, source }));
}

export const trustpilotAdapter: ReviewSourceAdapter = {
  source: "trustpilot",
  canHandle(candidate) {
    return candidate.source === "trustpilot" || hostIncludes(candidate.url, "trustpilot.com");
  },
  extractOptions: {
    render: true,
    driver: "vx8",
    formats: ["html", "markdown", "links"],
    country: "US",
    locale: "en-US",
  },
  crawlOptions: {
    render: true,
    driver: "vx8",
    formats: ["html", "markdown", "links"],
    country: "US",
    locale: "en-US",
    limit: 6,
    maxDiscoveryDepth: 2,
    includePaths: ["/review/"],
  },
  mapContentToReviews(pages) {
    return ensureSource(mapRawNimbleOutputToReviews(withSource(pages, "trustpilot")), "trustpilot");
  },
};

export const amazonAdapter: ReviewSourceAdapter = {
  source: "amazon",
  canHandle(candidate) {
    return candidate.source === "amazon" || hostIncludes(candidate.url, "amazon.");
  },
  extractOptions: {
    render: true,
    driver: "vx8",
    formats: ["html", "markdown", "links"],
    country: "US",
    locale: "en-US",
  },
  crawlOptions: {
    render: true,
    driver: "vx8",
    formats: ["html", "markdown", "links"],
    country: "US",
    locale: "en-US",
    limit: 6,
    maxDiscoveryDepth: 2,
    includePaths: ["/product-reviews/", "/gp/customer-reviews/"],
  },
  mapContentToReviews(pages) {
    return ensureSource(mapRawNimbleOutputToReviews(withSource(pages, "amazon")), "amazon").map((review) => ({
      ...review,
      verifiedPurchase: review.verifiedPurchase ?? (/verified purchase/i.test(review.text) || undefined),
    }));
  },
};

export const reviewSourceAdapters: ReviewSourceAdapter[] = [trustpilotAdapter, amazonAdapter];

export function getReviewSourceAdapter(
  candidate: Pick<ReviewSourceCandidate, "source" | "url">,
): ReviewSourceAdapter | undefined {
  return reviewSourceAdapters.find((adapter) => adapter.canHandle(candidate));
}

export function mapSourceContentToReviews(
  candidate: Pick<ReviewSourceCandidate, "source" | "url">,
  pages: RawReviewContentPage[],
): Review[] {
  const adapter = getReviewSourceAdapter(candidate);
  if (adapter) return adapter.mapContentToReviews(pages);
  return mapRawNimbleOutputToReviews(pages);
}
