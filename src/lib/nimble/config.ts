import { env, type Env } from "@/lib/env";

export const DEFAULT_NIMBLE_BASE_URL = "https://sdk.nimbleway.com/v1";

export interface NimbleRuntimeConfig {
  baseUrl: string;
  enabled: boolean;
  apiKey?: string;
  reason?: string;
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  return (baseUrl || DEFAULT_NIMBLE_BASE_URL).replace(/\/+$/, "");
}

export function resolveNimbleConfig(source: Env = env): NimbleRuntimeConfig {
  const baseUrl = normalizeBaseUrl(source.NIMBLE_BASE_URL);

  if (!source.NIMBLE_API_KEY) {
    return {
      baseUrl,
      enabled: false,
      reason: "Missing NIMBLE_API_KEY; use demo mode or fixtures for no-network scans.",
    };
  }

  return { baseUrl, apiKey: source.NIMBLE_API_KEY, enabled: true };
}

export function getNimbleConfig(): NimbleRuntimeConfig {
  return resolveNimbleConfig(env);
}
