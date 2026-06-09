import { describe, expect, it, vi } from "vitest";
import {
  buildHauntingExplanationPrompt,
  generateHauntingExplanations,
  mergeHauntingExplanations,
} from "@/lib/llm";
import type { LlmClient } from "@/lib/llm";
import type { Haunting, Review, SignalScores } from "@/types";

const signals: SignalScores = {
  burstiness: 0.8,
  duplication: 0,
  aiGenerated: 0.4,
  generic: 0.2,
  ratingAnomaly: 0,
  sentimentMismatch: 0,
  incentivized: 0,
};

const hauntings: Haunting[] = [
  {
    id: "burstiness",
    icon: "x",
    title: "Review burst",
    detail: "8 reviews arrived in one day.",
    severity: "high",
    evidenceRefs: ["r1"],
  },
];

const reviews: Review[] = [
  {
    id: "r1",
    rating: 5,
    date: "2026-06-01T00:00:00.000Z",
    text: "Amazing product, perfect in every way.",
    source: "amazon",
  },
];

describe("buildHauntingExplanationPrompt", () => {
  it("includes existing findings and evidence snippets", () => {
    const prompt = buildHauntingExplanationPrompt({
      productName: "Demo Product",
      signals,
      hauntings,
      reviews,
    });
    const parsed = JSON.parse(prompt) as {
      hauntings: Array<{ id: string; existingDetail: string; evidenceSnippets: Array<{ id: string }> }>;
    };

    expect(parsed.hauntings[0].id).toBe("burstiness");
    expect(parsed.hauntings[0].existingDetail).toContain("8 reviews");
    expect(parsed.hauntings[0].evidenceSnippets[0].id).toBe("r1");
  });
});

describe("mergeHauntingExplanations", () => {
  it("updates only known haunting details and preserves evidence", () => {
    const merged = mergeHauntingExplanations(hauntings, {
      hauntings: [
        { id: "burstiness", detail: "Signals suggest an unusual same-day review spike." },
        { id: "unknown", detail: "ignored" },
      ],
    });

    expect(merged).toHaveLength(1);
    expect(merged[0].detail).toContain("same-day");
    expect(merged[0].evidenceRefs).toEqual(["r1"]);
  });
});

describe("generateHauntingExplanations", () => {
  it("asks the client for concise rewrites", async () => {
    const generateJson = vi.fn(async () => ({
      hauntings: [{ id: "burstiness", detail: "Signals suggest a concentrated review spike." }],
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

    const output = await generateHauntingExplanations(
      { productName: "Demo Product", signals, hauntings, reviews },
      client,
    );

    expect(generateJson).toHaveBeenCalledTimes(1);
    expect(output[0].detail).toContain("concentrated");
  });
});
