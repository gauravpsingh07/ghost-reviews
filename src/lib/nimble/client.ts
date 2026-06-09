import { getNimbleConfig, type NimbleRuntimeConfig } from "./config";

export type NimbleDriver = "vx6" | "vx8" | "vx8-pro" | "vx10" | "vx10-pro";
export type NimbleFormat = "html" | "markdown" | "screenshot" | "headers" | "links";

export interface NimbleSearchRequest {
  query: string;
  focus?: "web" | "news" | "social" | "shopping";
  max_results?: number;
}

export interface NimbleSearchResult {
  title: string;
  description?: string;
  url: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface NimbleSearchResponse {
  answer?: string;
  total_results?: number;
  results: NimbleSearchResult[];
  request_id?: string;
}

export interface NimbleExtractRequest {
  url: string;
  render?: boolean;
  country?: string;
  locale?: string;
  parse?: boolean;
  parser?: Record<string, unknown>;
  formats?: NimbleFormat[];
  driver?: NimbleDriver;
  browser_actions?: unknown[];
}

export interface NimbleExtractResponse {
  url?: string;
  task_id?: string;
  status?: "success" | "failed" | string;
  status_code?: number;
  data?: {
    html?: string;
    markdown?: string;
    parsing?: unknown;
    links?: unknown;
    headers?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

export interface NimbleCreateCrawlRequest {
  url: string;
  name?: string;
  sitemap?: "skip" | "include" | "only";
  limit?: number;
  max_discovery_depth?: number;
  include_paths?: string[];
  exclude_paths?: string[];
  crawl_entire_domain?: boolean;
  allow_external_links?: boolean;
  allow_subdomains?: boolean;
  extract_options?: Omit<NimbleExtractRequest, "url">;
}

export interface NimbleCrawlTask {
  task_id: string;
  status: "pending" | "running" | "completed" | "failed" | string;
  created_at?: string;
  updated_at?: string;
}

export interface NimbleCrawlResponse {
  crawl_id: string;
  name?: string | null;
  url: string;
  status: "queued" | "running" | "completed" | "succeeded" | "failed" | string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  pending?: number;
  completed?: number;
  failed?: number;
  total?: number;
  tasks?: NimbleCrawlTask[];
}

export interface NimbleTaskResultResponse extends NimbleExtractResponse {
  task_id: string;
}

export interface NimbleClient {
  config: NimbleRuntimeConfig;
  isConfigured(): boolean;
  search(request: NimbleSearchRequest, signal?: AbortSignal): Promise<NimbleSearchResponse>;
  extract(request: NimbleExtractRequest, signal?: AbortSignal): Promise<NimbleExtractResponse>;
  extractAsync(request: NimbleExtractRequest, signal?: AbortSignal): Promise<{ status: string; task: { id: string } }>;
  createCrawl(request: NimbleCreateCrawlRequest, signal?: AbortSignal): Promise<NimbleCrawlResponse>;
  getCrawl(id: string, signal?: AbortSignal): Promise<NimbleCrawlResponse>;
  getTaskResult(taskId: string, signal?: AbortSignal): Promise<NimbleTaskResultResponse>;
}

export class NimbleUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NimbleUnavailableError";
  }
}

export class NimbleApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NimbleApiError";
  }
}

function assertConfigured(config: NimbleRuntimeConfig): asserts config is NimbleRuntimeConfig & {
  enabled: true;
  apiKey: string;
} {
  if (!config.enabled || !config.apiKey) {
    throw new NimbleUnavailableError(config.reason ?? "Nimble is not configured.");
  }
}

function pathUrl(baseUrl: string, path: string): string {
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown; error?: { message?: unknown } }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
    const nested = (payload as { error?: { message?: unknown } }).error?.message;
    if (typeof nested === "string") return nested;
  }
  return `Nimble request failed with HTTP ${status}`;
}

async function requestJson<T>(
  config: NimbleRuntimeConfig & { enabled: true; apiKey: string },
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(pathUrl(config.baseUrl, path), {
    method,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new NimbleApiError(response.status, errorMessage(payload, response.status));
  }

  return payload as T;
}

export function createNimbleClient(config: NimbleRuntimeConfig = getNimbleConfig()): NimbleClient {
  return {
    config,
    isConfigured: () => config.enabled,
    async search(request, signal) {
      assertConfigured(config);
      return requestJson<NimbleSearchResponse>(config, "POST", "/search", request, signal);
    },
    async extract(request, signal) {
      assertConfigured(config);
      return requestJson<NimbleExtractResponse>(config, "POST", "/extract", request, signal);
    },
    async extractAsync(request, signal) {
      assertConfigured(config);
      return requestJson<{ status: string; task: { id: string } }>(
        config,
        "POST",
        "/extract/async",
        request,
        signal,
      );
    },
    async createCrawl(request, signal) {
      assertConfigured(config);
      return requestJson<NimbleCrawlResponse>(config, "POST", "/crawl", request, signal);
    },
    async getCrawl(id, signal) {
      assertConfigured(config);
      return requestJson<NimbleCrawlResponse>(config, "GET", `/crawl/${encodeURIComponent(id)}`, undefined, signal);
    },
    async getTaskResult(taskId, signal) {
      assertConfigured(config);
      return requestJson<NimbleTaskResultResponse>(
        config,
        "GET",
        `/tasks/${encodeURIComponent(taskId)}/results`,
        undefined,
        signal,
      );
    },
  };
}

export function getNimbleClient(): NimbleClient {
  return createNimbleClient();
}
