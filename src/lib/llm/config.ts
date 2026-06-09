import { env, type Env } from "@/lib/env";

export type FreeLlmProvider = "groq" | "gemini" | "runpod";
export type PaidLlmProvider = "anthropic" | "openai";
export type LlmProvider = FreeLlmProvider | PaidLlmProvider;

export const FREE_LLM_PROVIDERS: readonly FreeLlmProvider[] = ["groq", "gemini", "runpod"];
export const PAID_LLM_PROVIDERS: readonly PaidLlmProvider[] = ["anthropic", "openai"];

const DEFAULT_MODELS: Record<FreeLlmProvider, string> = {
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
  runpod: "openai/gpt-oss-120b",
};

const DEFAULT_ENDPOINTS: Record<FreeLlmProvider, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  runpod: "",
};

export interface LlmRuntimeConfig {
  provider: LlmProvider;
  model: string;
  endpoint: string;
  enabled: boolean;
  apiKey?: string;
  reason?: string;
}

export function isFreeLlmProvider(provider: LlmProvider): provider is FreeLlmProvider {
  return FREE_LLM_PROVIDERS.includes(provider as FreeLlmProvider);
}

function keyForProvider(source: Env, provider: FreeLlmProvider): string | undefined {
  if (provider === "groq") return source.GROQ_API_KEY;
  if (provider === "gemini") return source.GEMINI_API_KEY;
  return source.RUNPOD_API_KEY;
}

function keyName(provider: FreeLlmProvider): string {
  if (provider === "groq") return "GROQ_API_KEY";
  if (provider === "gemini") return "GEMINI_API_KEY";
  return "RUNPOD_API_KEY";
}

function endpointForProvider(source: Env, provider: FreeLlmProvider): string {
  if (provider === "runpod") return source.RUNPOD_ENDPOINT_URL ?? "";
  return DEFAULT_ENDPOINTS[provider];
}

export function resolveLlmConfig(source: Env = env): LlmRuntimeConfig {
  const provider = source.LLM_PROVIDER as LlmProvider;

  if (!isFreeLlmProvider(provider)) {
    return {
      provider,
      model: source.LLM_MODEL ?? provider,
      endpoint: "",
      enabled: false,
      reason: `${provider} is a paid provider; ghost.reviews is configured for the free Groq/Gemini/RunPod stack.`,
    };
  }

  const model = source.LLM_MODEL ?? DEFAULT_MODELS[provider];
  const endpoint = endpointForProvider(source, provider);
  const apiKey = keyForProvider(source, provider);

  if (!endpoint) {
    return {
      provider,
      model,
      endpoint,
      enabled: false,
      reason: `${provider} needs an endpoint URL before live LLM calls can run.`,
    };
  }

  if (!apiKey) {
    return {
      provider,
      model,
      endpoint,
      enabled: false,
      reason: `Missing ${keyName(provider)}; use demo mode or deterministic-only scoring.`,
    };
  }

  return { provider, model, endpoint, apiKey, enabled: true };
}

export function getLlmConfig(): LlmRuntimeConfig {
  return resolveLlmConfig(env);
}
