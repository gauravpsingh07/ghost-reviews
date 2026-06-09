import { describe, expect, it } from "vitest";
import {
  amazonAdapter,
  getReviewSourceAdapter,
  mapSourceContentToReviews,
  trustpilotAdapter,
} from "@/lib/nimble";
import type { RawReviewContentPage, ReviewSourceCandidate } from "@/lib/nimble";

const trustpilotSource: ReviewSourceCandidate = {
  source: "trustpilot",
  url: "https://www.trustpilot.com/review/demo.test",
  confidence: 0.95,
};

const amazonSource: ReviewSourceCandidate = {
  source: "amazon",
  url: "https://www.amazon.com/product-reviews/B000",
  confidence: 0.9,
};

describe("review source adapters", () => {
  it("selects Trustpilot and Amazon adapters through the common interface", () => {
    expect(getReviewSourceAdapter(trustpilotSource)).toBe(trustpilotAdapter);
    expect(getReviewSourceAdapter(amazonSource)).toBe(amazonAdapter);
  });

  it("exposes source-specific crawl defaults", () => {
    expect(trustpilotAdapter.crawlOptions.includePaths).toEqual(["/review/"]);
    expect(amazonAdapter.crawlOptions.includePaths).toEqual([
      "/product-reviews/",
      "/gp/customer-reviews/",
    ]);
  });

  it("maps Trustpilot content to Trustpilot reviews", () => {
    const pages: RawReviewContentPage[] = [
      {
        source: "other",
        url: trustpilotSource.url,
        fetchedAt: "2026-06-09T00:00:00.000Z",
        parsing: {
          reviews: [
            {
              author: "Mina",
              rating: 4,
              date: "2026-06-01",
              text: "Delivery took two days and the support team answered quickly.",
            },
          ],
        },
      },
    ];

    const reviews = mapSourceContentToReviews(trustpilotSource, pages);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ source: "trustpilot", author: "Mina", rating: 4 });
  });

  it("maps Amazon content and marks verified purchase mentions", () => {
    const pages: RawReviewContentPage[] = [
      {
        source: "other",
        url: amazonSource.url,
        fetchedAt: "2026-06-09T00:00:00.000Z",
        markdown:
          "Rating: 5/5\nVerified Purchase. The battery charged my laptop twice during a train ride.",
      },
    ];

    const reviews = mapSourceContentToReviews(amazonSource, pages);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ source: "amazon", rating: 5, verifiedPurchase: true });
  });
});
