import { describe, expect, it, vi } from "vitest";
import {
  analyzeReviewsWithLlm,
  buildReviewAnalysisPrompt,
  parseReviewAnalysisResponse,
} from "@/lib/llm";
import type { LlmClient } from "@/lib/llm";
import type { Review } from "@/types";

function review(id: string, text = "This battery lasted two full travel days."): Review {
  return {
    id,
    rating: 5,
    date: "2026-06-01T00:00:00.000Z",
    text,
    source: "amazon",
  };
}

describe("buildReviewAnalysisPrompt", () => {
  it("serializes reviews and the strict response shape", () => {
    const prompt = buildReviewAnalysisPrompt([review("r1")]);
    const parsed = JSON.parse(prompt) as {
      requiredResponseShape: unknown;
      reviews: Array<{ id: string; text: string }>;
    };

    expect(parsed.requiredResponseShape).toBeDefined();
    expect(parsed.reviews[0].id).toBe("r1");
    expect(parsed.reviews[0].text).toContain("battery");
  });
});

describe("parseReviewAnalysisResponse", () => {
  it("clamps scores and ignores unknown review ids", () => {
    const parsed = parseReviewAnalysisResponse(
      {
        reviews: [
          { id: "r1", aiLikelihood: 1.5, specificity: -0.2, sentiment: 2 },
          { id: "other", aiLikelihood: 0.5, specificity: 0.5, sentiment: 0 },
        ],
      },
      ["r1"],
    );

    expect(parsed.get("r1")).toEqual({
      id: "r1",
      aiLikelihood: 1,
      specificity: 0,
      sentiment: 1,
    });
    expect(parsed.has("other")).toBe(false);
  });
});

describe("analyzeReviewsWithLlm", () => {
  it("calls the client once for a small batch and returns a score map", async () => {
    const generateJson = vi.fn(async () => ({
      reviews: [{ id: "r1", aiLikelihood: 0.2, specificity: 0.8, sentiment: 0.9 }],
    }));
    const client: LlmClient = {
      config: {
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        endpoint: "https://example.test",
        enabled: true,
        apiKey: "short",
      },
      isConfigured: () => true,
      generateJson,
    };

    const scores = await analyzeReviewsWithLlm([review("r1")], client);

    expect(generateJson).toHaveBeenCalledTimes(1);
    expect(scores.get("r1")?.specificity).toBe(0.8);
  });
});
