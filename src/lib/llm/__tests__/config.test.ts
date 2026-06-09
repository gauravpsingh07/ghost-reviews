import { describe, expect, it } from "vitest";
import { createLlmClient, LlmUnavailableError, resolveLlmConfig } from "@/lib/llm";
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

describe("resolveLlmConfig", () => {
  it("uses Groq as the default free provider", () => {
    const config = resolveLlmConfig({ ...baseEnv, GROQ_API_KEY: "short" });
    expect(config.enabled).toBe(true);
    expect(config.provider).toBe("groq");
    expect(config.model).toBe("llama-3.3-70b-versatile");
  });

  it("uses the Gemini model default when Gemini is selected", () => {
    const config = resolveLlmConfig({
      ...baseEnv,
      LLM_PROVIDER: "gemini",
      GEMINI_API_KEY: "short",
    });
    expect(config.enabled).toBe(true);
    expect(config.model).toBe("gemini-2.0-flash");
  });

  it("stays disabled when a free provider key is missing", () => {
    const config = resolveLlmConfig(baseEnv);
    expect(config.enabled).toBe(false);
    expect(config.reason).toContain("GROQ_API_KEY");
  });

  it("keeps paid providers disabled for the free stack", () => {
    const config = resolveLlmConfig({
      ...baseEnv,
      LLM_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "short",
    });
    expect(config.enabled).toBe(false);
    expect(config.reason).toContain("paid provider");
  });
});

describe("createLlmClient", () => {
  it("fails closed when no free provider is configured", async () => {
    const client = createLlmClient(resolveLlmConfig(baseEnv));
    await expect(
      client.generateJson({ system: "Return JSON.", user: "{}" }),
    ).rejects.toBeInstanceOf(LlmUnavailableError);
  });
});
