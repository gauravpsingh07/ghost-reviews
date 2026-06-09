import type { SourceId } from "@/types";
import {
  getNimbleClient,
  type NimbleClient,
  type NimbleCrawlResponse,
  type NimbleDriver,
  type NimbleExtractRequest,
  type NimbleExtractResponse,
  type NimbleFormat,
  type NimbleTaskResultResponse,
} from "./client";
import type { ReviewSourceCandidate } from "./sources";

export interface RawReviewContentPage {
  source: SourceId;
  url: string;
  title?: string;
  html?: string;
  markdown?: string;
  parsing?: unknown;
  links?: unknown;
  statusCode?: number;
  taskId?: string;
  fetchedAt: string;
}

export interface ReviewContentExtractOptions {
  render?: boolean;
  driver?: NimbleDriver;
  formats?: NimbleFormat[];
  country?: string;
  locale?: string;
}

export interface ReviewContentCrawlOptions extends ReviewContentExtractOptions {
  limit?: number;
  maxDiscoveryDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
}

const DEFAULT_FORMATS: NimbleFormat[] = ["html", "markdown", "links"];

function extractRequestForSource(
  source: ReviewSourceCandidate,
  options: ReviewContentExtractOptions = {},
): NimbleExtractRequest {
  return {
    url: source.url,
    render: options.render ?? true,
    driver: options.driver ?? "vx8",
    formats: options.formats ?? DEFAULT_FORMATS,
    country: options.country ?? "US",
    locale: options.locale ?? "en-US",
  };
}

export function mapExtractResponseToRawContent(
  source: ReviewSourceCandidate,
  response: NimbleExtractResponse | NimbleTaskResultResponse,
): RawReviewContentPage {
  return {
    source: source.source,
    url: response.url ?? source.url,
    title: source.title,
    html: response.data?.html,
    markdown: response.data?.markdown,
    parsing: response.data?.parsing,
    links: response.data?.links,
    statusCode: response.status_code,
    taskId: response.task_id,
    fetchedAt: new Date().toISOString(),
  };
}

export async function extractReviewContent(
  source: ReviewSourceCandidate,
  client: NimbleClient = getNimbleClient(),
  options: ReviewContentExtractOptions = {},
): Promise<RawReviewContentPage> {
  const response = await client.extract(extractRequestForSource(source, options));
  return mapExtractResponseToRawContent(source, response);
}

export async function startReviewContentCrawl(
  source: ReviewSourceCandidate,
  client: NimbleClient = getNimbleClient(),
  options: ReviewContentCrawlOptions = {},
): Promise<NimbleCrawlResponse> {
  return client.createCrawl({
    url: source.url,
    name: `ghost-reviews-${source.source}`,
    sitemap: "include",
    limit: options.limit ?? 8,
    max_discovery_depth: options.maxDiscoveryDepth ?? 2,
    include_paths: options.includePaths,
    exclude_paths: options.excludePaths,
    crawl_entire_domain: false,
    allow_external_links: false,
    allow_subdomains: false,
    extract_options: {
      render: options.render ?? true,
      driver: options.driver ?? "vx8",
      formats: options.formats ?? DEFAULT_FORMATS,
      country: options.country ?? "US",
      locale: options.locale ?? "en-US",
    },
  });
}

export async function fetchCompletedCrawlContent(
  source: ReviewSourceCandidate,
  crawl: NimbleCrawlResponse,
  client: NimbleClient = getNimbleClient(),
): Promise<RawReviewContentPage[]> {
  const completedTasks = (crawl.tasks ?? []).filter((task) => task.status === "completed");
  const pages = await Promise.all(
    completedTasks.map(async (task) => {
      const response = await client.getTaskResult(task.task_id);
      return mapExtractResponseToRawContent(source, response);
    }),
  );
  return pages;
}
