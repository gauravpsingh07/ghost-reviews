import { describe, expect, it } from "vitest";
import { mapRawNimbleOutputToReviews, rawReviewsFromNimbleContent } from "@/lib/nimble";
import type { RawReviewContentPage } from "@/lib/nimble";

const basePage: RawReviewContentPage = {
  source: "trustpilot",
  url: "https://www.trustpilot.com/review/demo.test",
  fetchedAt: "2026-06-09T00:00:00.000Z",
};

describe("rawReviewsFromNimbleContent", () => {
  it("extracts review-like objects from structured parsing output", () => {
    const raw = rawReviewsFromNimbleContent({
      ...basePage,
      parsing: {
        reviews: [
          {
            authorName: "Jane",
            rating: "5 stars",
            publishedDate: "2026-06-01",
            reviewText: "The charger stayed cool during a full workday and charged my phone twice.",
          },
        ],
      },
    });

    expect(raw).toEqual([
      expect.objectContaining({
        author: "Jane",
        rating: 5,
        source: "trustpilot",
        text: expect.stringContaining("charger"),
      }),
    ]);
  });

  it("falls back to markdown blocks with explicit ratings", () => {
    const raw = rawReviewsFromNimbleContent({
      ...basePage,
      markdown: [
        "Rating: 2/5",
        "Author: Sam",
        "The zipper broke after one week and support never replied.",
        "",
        "5 stars - Fits under the airplane seat and the wheels stayed smooth.",
      ].join("\n"),
    });

    expect(raw).toHaveLength(2);
    expect(raw[0]).toMatchObject({ rating: 2, author: "Sam" });
    expect(raw[1].text).toContain("airplane seat");
  });

  it("returns no reviews when text or rating evidence is missing", () => {
    expect(rawReviewsFromNimbleContent({ ...basePage, parsing: { reviews: [{ text: "great" }] } })).toEqual([]);
  });
});

describe("mapRawNimbleOutputToReviews", () => {
  it("normalizes and dedupes reviews across raw pages", () => {
    const pages: RawReviewContentPage[] = [
      {
        ...basePage,
        parsing: {
          reviews: [
            {
              author: "A",
              rating: 5,
              date: "2026-06-01",
              text: "Battery lasted through a three-day camping trip.",
            },
          ],
        },
      },
      {
        ...basePage,
        parsing: {
          reviews: [
            {
              author: "A",
              rating: 5,
              date: "2026-06-01",
              text: "Battery lasted through a three-day camping trip.",
            },
          ],
        },
      },
    ];

    const reviews = mapRawNimbleOutputToReviews(pages);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      rating: 5,
      source: "trustpilot",
      text: "Battery lasted through a three-day camping trip.",
    });
    expect(reviews[0].id).toMatch(/^r_/);
  });
});
