import { describe, expect, it } from "vitest";
import amazonPayload from "@/lib/nimble/__fixtures__/amazon-extract.json";
import trustpilotPayload from "@/lib/nimble/__fixtures__/trustpilot-extract.json";
import { mapExtractResponseToRawContent, mapSourceContentToReviews } from "@/lib/nimble";
import type { NimbleExtractResponse, ReviewSourceCandidate } from "@/lib/nimble";

const trustpilotSource: ReviewSourceCandidate = {
  source: "trustpilot",
  url: "https://www.trustpilot.com/review/demo.test",
  confidence: 0.95,
};

const amazonSource: ReviewSourceCandidate = {
  source: "amazon",
  url: "https://www.amazon.com/product-reviews/B000DEMO",
  confidence: 0.9,
};

describe("Nimble captured fixture payloads", () => {
  it("parses a Trustpilot extract payload into normalized reviews", () => {
    const page = mapExtractResponseToRawContent(
      trustpilotSource,
      trustpilotPayload as NimbleExtractResponse,
    );
    const reviews = mapSourceContentToReviews(trustpilotSource, [page]);

    expect(reviews).toHaveLength(2);
    expect(reviews[0]).toMatchObject({
      author: "Lena M.",
      rating: 5,
      source: "trustpilot",
      text: expect.stringContaining("replacement charger"),
    });
    expect(reviews[1]).toMatchObject({
      author: "Omar K.",
      rating: 2,
      date: "2026-05-30T00:00:00.000Z",
    });
  });

  it("parses an Amazon extract payload into normalized reviews", () => {
    const page = mapExtractResponseToRawContent(amazonSource, amazonPayload as NimbleExtractResponse);
    const reviews = mapSourceContentToReviews(amazonSource, [page]);

    expect(reviews).toHaveLength(2);
    expect(reviews[0]).toMatchObject({
      author: "Priya",
      rating: 4,
      source: "amazon",
      verifiedPurchase: true,
      text: expect.stringContaining("train ride"),
    });
    expect(reviews[1]).toMatchObject({
      author: "Mateo",
      rating: 1,
      verifiedPurchase: false,
      text: expect.stringContaining("burnt plastic"),
    });
  });
});
