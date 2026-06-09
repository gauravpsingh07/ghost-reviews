import { describe, expect, it, vi } from "vitest";
import {
  buildReviewSourceSearchQuery,
  inferReviewSource,
  rankReviewSourceResults,
  resolveReviewSources,
} from "@/lib/nimble";
import type { NimbleClient } from "@/lib/nimble";

describe("inferReviewSource", () => {
  it("maps known review hosts to SourceId values", () => {
    expect(inferReviewSource("https://www.trustpilot.com/review/example.com")).toBe("trustpilot");
    expect(inferReviewSource("https://www.amazon.com/product-reviews/B000")).toBe("amazon");
    expect(inferReviewSource("https://www.yelp.com/biz/demo")).toBe("yelp");
  });
});

describe("buildReviewSourceSearchQuery", () => {
  it("keeps the original query and adds review-source terms", () => {
    expect(buildReviewSourceSearchQuery("Anker 737")).toContain("Anker 737");
    expect(buildReviewSourceSearchQuery("Anker 737")).toContain("Trustpilot");
  });
});

describe("rankReviewSourceResults", () => {
  it("dedupes urls and ranks likely review sources first", () => {
    const ranked = rankReviewSourceResults([
      {
        title: "Generic product page",
        url: "https://example.com/products/1",
      },
      {
        title: "Demo reviews on Trustpilot",
        url: "https://www.trustpilot.com/review/demo.test?utm=1",
        description: "Customer reviews and ratings",
      },
      {
        title: "Demo reviews on Trustpilot duplicate",
        url: "https://www.trustpilot.com/review/demo.test?utm=2",
        description: "Customer ratings",
      },
      {
        title: "Amazon customer reviews",
        url: "https://www.amazon.com/product-reviews/B000",
      },
    ]);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].source).toBe("trustpilot");
    expect(ranked[1].source).toBe("amazon");
  });
});

describe("resolveReviewSources", () => {
  it("returns direct URL candidates without a network search", async () => {
    const search = vi.fn();
    const client = { search } as unknown as NimbleClient;

    const candidates = await resolveReviewSources("https://www.amazon.com/product-reviews/B000", client);

    expect(search).not.toHaveBeenCalled();
    expect(candidates[0]).toMatchObject({ source: "amazon", confidence: 1 });
  });

  it("uses Nimble search for product-name queries", async () => {
    const search = vi.fn(async () => ({
      results: [
        {
          title: "Demo Product Reviews",
          url: "https://www.trustpilot.com/review/demo.test",
          description: "Customer reviews",
        },
      ],
    }));
    const client = { search } as unknown as NimbleClient;

    const candidates = await resolveReviewSources("Demo Product", client);

    expect(search).toHaveBeenCalledWith({
      query: "Demo Product reviews customer ratings Trustpilot Amazon",
      focus: "web",
      max_results: 10,
    });
    expect(candidates).toEqual([
      expect.objectContaining({ source: "trustpilot", url: "https://www.trustpilot.com/review/demo.test" }),
    ]);
  });
});
