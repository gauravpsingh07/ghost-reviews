import { getLlmConfig, type LlmRuntimeConfig } from "./config";

export interface GenerateJsonOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LlmClient {
  config: LlmRuntimeConfig;
  isConfigured(): boolean;
  generateJson<T>(options: GenerateJsonOptions): Promise<T>;
}

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

function assertConfigured(config: LlmRuntimeConfig): asserts config is LlmRuntimeConfig & {
  enabled: true;
  apiKey: string;
} {
  if (!config.enabled || !config.apiKey) {
    throw new LlmUnavailableError(config.reason ?? "LLM provider is not configured.");
  }
}

function parseLlmJson<T>(content: string): T {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed) as T;
}

function errorMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string") return error.message;
  }
  return undefined;
}

async function postJson<T>(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    const message = errorMessage(payload) ?? `HTTP ${response.status}`;
    throw new Error(`LLM request failed: ${message}`);
  }

  return payload as T;
}

async function generateWithGroq<T>(
  config: LlmRuntimeConfig & { enabled: true; apiKey: string },
  options: GenerateJsonOptions,
): Promise<T> {
  const payload = await postJson<GroqResponse>(
    config.endpoint,
    { Authorization: `Bearer ${config.apiKey}` },
    {
      model: config.model,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
      temperature: options.temperature ?? 0,
      max_tokens: options.maxTokens ?? 1200,
      response_format: { type: "json_object" },
    },
    options.signal,
  );

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM response did not include JSON content.");
  return parseLlmJson<T>(content);
}

async function generateWithGemini<T>(
  config: LlmRuntimeConfig & { enabled: true; apiKey: string },
  options: GenerateJsonOptions,
): Promise<T> {
  const url = `${config.endpoint}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const payload = await postJson<GeminiResponse>(
    url,
    {},
    {
      systemInstruction: { parts: [{ text: options.system }] },
      contents: [{ role: "user", parts: [{ text: options.user }] }],
      generationConfig: {
        temperature: options.temperature ?? 0,
        maxOutputTokens: options.maxTokens ?? 1200,
        responseMimeType: "application/json",
      },
    },
    options.signal,
  );

  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!content) throw new Error("LLM response did not include JSON content.");
  return parseLlmJson<T>(content);
}

export function createLlmClient(config: LlmRuntimeConfig = getLlmConfig()): LlmClient {
  return {
    config,
    isConfigured: () => config.enabled,
    async generateJson<T>(options: GenerateJsonOptions): Promise<T> {
      assertConfigured(config);
      if (config.provider === "groq") return generateWithGroq<T>(config, options);
      if (config.provider === "gemini") return generateWithGemini<T>(config, options);
      throw new LlmUnavailableError(`${config.provider} live calls are not wired for the free stack yet.`);
    },
  };
}

export function getLlmClient(): LlmClient {
  return createLlmClient();
}
