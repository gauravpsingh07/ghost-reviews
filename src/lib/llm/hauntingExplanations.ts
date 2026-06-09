import { z } from "zod";
import type { Haunting, Review, SignalScores } from "@/types";
import { getLlmClient, type LlmClient } from "./client";

const MAX_EVIDENCE_SNIPPET_CHARS = 220;

export const HAUNTING_EXPLANATION_SYSTEM_PROMPT = [
  "You write concise, evidence-backed explanations for ghost.reviews.",
  "Use cautious language like 'signals suggest' and 'may indicate'.",
  "Do not add findings, numbers, review ids, or claims that are not present in the input.",
  "Return only strict JSON. No markdown or commentary.",
].join(" ");

export interface HauntingExplanationInput {
  productName: string;
  signals: SignalScores;
  hauntings: Haunting[];
  reviews: Review[];
}

const explanationSchema = z.object({
  hauntings: z.array(
    z.object({
      id: z.string().min(1),
      detail: z.string().min(1).max(240),
    }),
  ),
});

function snippet(text: string): string {
  return text.length > MAX_EVIDENCE_SNIPPET_CHARS
    ? `${text.slice(0, MAX_EVIDENCE_SNIPPET_CHARS)}...`
    : text;
}

export function buildHauntingExplanationPrompt(input: HauntingExplanationInput): string {
  const reviewsById = new Map(input.reviews.map((review) => [review.id, review]));

  return JSON.stringify(
    {
      task: "Rewrite each haunting detail in one clear sentence for a consumer-facing trust report.",
      rules: [
        "Keep the same meaning as the existing detail.",
        "Use only the supplied signals, details, and evidence snippets.",
        "Do not invent new evidence, counts, sources, or review ids.",
        "Return every input haunting id exactly once.",
      ],
      requiredResponseShape: {
        hauntings: [{ id: "existing haunting id", detail: "one concise evidence-backed sentence" }],
      },
      productName: input.productName,
      signals: input.signals,
      hauntings: input.hauntings.map((haunting) => ({
        id: haunting.id,
        title: haunting.title,
        severity: haunting.severity,
        existingDetail: haunting.detail,
        evidenceReviewIds: haunting.evidenceRefs,
        evidenceSnippets: haunting.evidenceRefs
          .map((id) => reviewsById.get(id))
          .filter((review): review is Review => Boolean(review))
          .slice(0, 4)
          .map((review) => ({
            id: review.id,
            rating: review.rating,
            text: snippet(review.text),
          })),
      })),
    },
    null,
    2,
  );
}

export function mergeHauntingExplanations(base: Haunting[], raw: unknown): Haunting[] {
  const parsed = explanationSchema.parse(raw);
  const detailsById = new Map(parsed.hauntings.map((haunting) => [haunting.id, haunting.detail]));

  return base.map((haunting) => ({
    ...haunting,
    detail: detailsById.get(haunting.id) ?? haunting.detail,
  }));
}

export async function generateHauntingExplanations(
  input: HauntingExplanationInput,
  client: LlmClient = getLlmClient(),
): Promise<Haunting[]> {
  if (input.hauntings.length === 0) return input.hauntings;

  const raw = await client.generateJson<unknown>({
    system: HAUNTING_EXPLANATION_SYSTEM_PROMPT,
    user: buildHauntingExplanationPrompt(input),
    temperature: 0.2,
    maxTokens: Math.min(2400, 400 + input.hauntings.length * 180),
  });

  return mergeHauntingExplanations(input.hauntings, raw);
}
