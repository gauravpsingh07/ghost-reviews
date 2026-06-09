import { z } from "zod";
import type { LlmReviewScore, Review } from "@/types";
import { getLlmClient, type LlmClient } from "./client";

const MAX_REVIEWS_PER_BATCH = 40;
const MAX_REVIEW_TEXT_CHARS = 1600;

export const REVIEW_ANALYSIS_SYSTEM_PROMPT = [
  "You are an expert at detecting inauthentic product reviews.",
  "Return only strict JSON. Do not include markdown, commentary, or extra keys.",
  "Scores must be calibrated and cautious: 0 means clearly absent, 1 means clearly present.",
].join(" ");

const finiteNumber = z.coerce.number().refine(Number.isFinite, "Expected a finite number");

const llmReviewScoreSchema = z.object({
  id: z.string().min(1),
  aiLikelihood: finiteNumber.transform((n) => clamp(n, 0, 1)),
  specificity: finiteNumber.transform((n) => clamp(n, 0, 1)),
  sentiment: finiteNumber.transform((n) => clamp(n, -1, 1)),
});

const responseSchema = z.object({
  reviews: z.array(llmReviewScoreSchema),
});

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function trimReviewText(text: string): string {
  return text.length > MAX_REVIEW_TEXT_CHARS
    ? `${text.slice(0, MAX_REVIEW_TEXT_CHARS)}...`
    : text;
}

export function buildReviewAnalysisPrompt(reviews: Review[]): string {
  return JSON.stringify(
    {
      task: "Analyze each product review for inauthentic-writing signals.",
      definitions: {
        aiLikelihood:
          "0 = clearly human/specific, 1 = clearly AI-generated, templated, or mass-produced.",
        specificity:
          "0 = vague generic praise/complaint, 1 = concrete first-hand product details.",
        sentiment: "-1 = strongly negative, 0 = neutral/mixed, 1 = strongly positive.",
      },
      requiredResponseShape: {
        reviews: [
          {
            id: "same review id from input",
            aiLikelihood: "number from 0 to 1",
            specificity: "number from 0 to 1",
            sentiment: "number from -1 to 1",
          },
        ],
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        date: review.date,
        source: review.source,
        verifiedPurchase: review.verifiedPurchase ?? null,
        text: trimReviewText(review.text),
      })),
    },
    null,
    2,
  );
}

export function parseReviewAnalysisResponse(
  raw: unknown,
  expectedReviewIds: readonly string[],
): Map<string, LlmReviewScore> {
  const parsed = responseSchema.parse(raw);
  const expected = new Set(expectedReviewIds);
  const scores = new Map<string, LlmReviewScore>();

  for (const score of parsed.reviews) {
    if (!expected.has(score.id)) continue;
    scores.set(score.id, score);
  }

  return scores;
}

async function analyzeSingleBatch(
  reviews: Review[],
  client: LlmClient,
): Promise<Map<string, LlmReviewScore>> {
  if (reviews.length === 0) return new Map();

  const raw = await client.generateJson<unknown>({
    system: REVIEW_ANALYSIS_SYSTEM_PROMPT,
    user: buildReviewAnalysisPrompt(reviews),
    temperature: 0,
    maxTokens: Math.min(6000, 600 + reviews.length * 140),
  });

  return parseReviewAnalysisResponse(
    raw,
    reviews.map((review) => review.id),
  );
}

export async function analyzeReviewsWithLlm(
  reviews: Review[],
  client: LlmClient = getLlmClient(),
): Promise<Map<string, LlmReviewScore>> {
  const scores = new Map<string, LlmReviewScore>();

  for (const batch of chunks(reviews, MAX_REVIEWS_PER_BATCH)) {
    const batchScores = await analyzeSingleBatch(batch, client);
    for (const [id, score] of batchScores) scores.set(id, score);
  }

  return scores;
}
