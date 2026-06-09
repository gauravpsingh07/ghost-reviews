import { z } from "zod";

/**
 * Server-side environment config (validated). All keys are optional so the app runs at $0:
 * demo mode needs no keys, and missing provider keys simply disable live calls.
 * Do NOT import this into client components — it reads server-only secrets.
 */
const schema = z.object({
  LLM_PROVIDER: z.enum(["groq", "gemini", "runpod", "anthropic", "openai"]).default("groq"),
  LLM_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RUNPOD_API_KEY: z.string().optional(),
  RUNPOD_ENDPOINT_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NIMBLE_API_KEY: z.string().optional(),
  NIMBLE_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export const env = schema.parse(process.env);
export type Env = typeof env;

/** True when no live LLM key is configured (use demo mode / deterministic-only scoring). */
export function hasLlmKey(): boolean {
  return Boolean(env.GROQ_API_KEY || env.GEMINI_API_KEY || env.RUNPOD_API_KEY);
}
