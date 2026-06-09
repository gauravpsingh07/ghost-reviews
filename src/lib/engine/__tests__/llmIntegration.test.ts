import { describe, expect, it, vi } from "vitest";
import { analyzeReviews } from "@/lib/engine";
import { analyzeReviewsWithLlm, generateHauntingExplanations } from "@/lib/llm";
import type { LlmClient } from "@/lib/llm";
import type { Haunting, Review } from "@/types";

const reviews: Review[] = [
  {
    id: "r1",
    rating: 5,
    date: "2026-06-01T00:00:00.000Z",
    text: "This product is amazing and exceeded all expectations. Highly recommend to everyone.",
    source: "amazon",
  },
  {
    id: "r2",
    rating: 5,
    date: "2026-06-02T00:00:00.000Z",
    text: "An outstanding purchase with excellent quality. I would recommend it to anyone.",
    source: "amazon",
  },
  {
    id: "r3",
    rating: 5,
    date: "2026-06-03T00:00:00.000Z",
    text: "Fantastic value and perfect performance. This is a must buy product.",
    source: "amazon",
  },
  {
    id: "r4",
    rating: 5,
    date: "2026-06-04T00:00:00.000Z",
    text: "Best item ever, flawless and wonderful. Five stars without question.",
    source: "amazon",
  },
  {
    id: "r5",
    rating: 5,
    date: "2026-06-05T00:00:00.000Z",
    text: "Perfect in every way and worth every penny. I absolutely love it.",
    source: "amazon",
  },
];

function mockedClient(response: unknown): LlmClient {
  return {
    config: {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      endpoint: "https://example.test",
      enabled: true,
      apiKey: "short",
    },
    isConfigured: () => true,
    generateJson: vi.fn(async () => response),
  };
}

describe("engine + mocked LLM integration", () => {
  it("produces an evidence-backed ScanResult from mocked linguistic scores", async () => {
    const llmScores = await analyzeReviewsWithLlm(
      reviews,
      mockedClient({
        reviews: reviews.map((review) => ({
          id: review.id,
          aiLikelihood: 0.9,
          specificity: 0.15,
          sentiment: -0.85,
        })),
      }),
    );

    const result = analyzeReviews({
      product: { name: "Demo Gadget", source: "amazon" },
      reviews,
      llm: llmScores,
      demoMode: true,
    });

    expect(result.demoMode).toBe(true);
    expect(result.reviewsAnalyzed).toBe(5);
    expect(result.ghostScore).toBeGreaterThanOrEqual(50);
    expect(result.signals.aiGenerated).toBeCloseTo(0.9);
    expect(result.signals.generic).toBeCloseTo(0.85);
    expect(result.signals.sentimentMismatch).toBe(1);
    expect(result.hauntings.map((haunting) => haunting.id)).toEqual(
      expect.arrayContaining(["aiGenerated", "generic", "ratingAnomaly", "sentimentMismatch"]),
    );
    expect(result.reviews.every((review) => review.verdict === "ghost")).toBe(true);
    expect(result.reviews[0].reasons).toEqual(
      expect.arrayContaining(["reads as AI-generated", "vague, lacks concrete detail"]),
    );
  });

  it("can rewrite computed hauntings without changing their evidence", async () => {
    const base: Haunting[] = [
      {
        id: "aiGenerated",
        icon: "x",
        title: "Machine-written",
        detail: "90% average AI-likelihood.",
        severity: "high",
        evidenceRefs: ["r1", "r2"],
      },
    ];

    const output = await generateHauntingExplanations(
      {
        productName: "Demo Gadget",
        signals: {
          burstiness: 0,
          duplication: 0,
          aiGenerated: 0.9,
          generic: 0.85,
          ratingAnomaly: 1,
          sentimentMismatch: 1,
          incentivized: 0,
        },
        hauntings: base,
        reviews,
      },
      mockedClient({
        hauntings: [
          {
            id: "aiGenerated",
            detail: "Signals suggest these reviews may be templated or machine-written.",
          },
        ],
      }),
    );

    expect(output[0].detail).toContain("Signals suggest");
    expect(output[0].evidenceRefs).toEqual(["r1", "r2"]);
  });
});
