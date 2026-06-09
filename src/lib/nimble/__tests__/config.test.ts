import { describe, expect, it } from "vitest";
import { DEFAULT_NIMBLE_BASE_URL, resolveNimbleConfig } from "@/lib/nimble";
import type { Env } from "@/lib/env";

const baseEnv: Env = {
  LLM_PROVIDER: "groq",
  LLM_MODEL: undefined,
  GROQ_API_KEY: undefined,
  GEMINI_API_KEY: undefined,
  RUNPOD_API_KEY: undefined,
  RUNPOD_ENDPOINT_URL: undefined,
  ANTHROPIC_API_KEY: undefined,
  OPENAI_API_KEY: undefined,
  NIMBLE_API_KEY: undefined,
  NIMBLE_BASE_URL: undefined,
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DEMO_MODE: false,
};

describe("resolveNimbleConfig", () => {
  it("defaults to the current Nimble SDK API base URL", () => {
    const config = resolveNimbleConfig(baseEnv);
    expect(config.baseUrl).toBe(DEFAULT_NIMBLE_BASE_URL);
    expect(config.enabled).toBe(false);
  });

  it("enables live calls when a key is present", () => {
    const config = resolveNimbleConfig({
      ...baseEnv,
      NIMBLE_API_KEY: "short",
      NIMBLE_BASE_URL: "https://sdk.nimbleway.com/v1/",
    });
    expect(config.enabled).toBe(true);
    expect(config.baseUrl).toBe("https://sdk.nimbleway.com/v1");
  });
});
