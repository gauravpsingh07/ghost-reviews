import { describe, expect, it, vi } from "vitest";
import {
  extractReviewContent,
  fetchCompletedCrawlContent,
  mapExtractResponseToRawContent,
  startReviewContentCrawl,
} from "@/lib/nimble";
import type { NimbleClient, ReviewSourceCandidate } from "@/lib/nimble";

const source: ReviewSourceCandidate = {
  source: "trustpilot",
  url: "https://www.trustpilot.com/review/demo.test",
  title: "Demo reviews",
  confidence: 0.98,
};

describe("mapExtractResponseToRawContent", () => {
  it("keeps raw content and source metadata together", () => {
    const page = mapExtractResponseToRawContent(source, {
      url: source.url,
      task_id: "task-1",
      status_code: 200,
      data: {
        html: "<article>Review</article>",
        markdown: "Review",
        parsing: { reviews: [] },
      },
    });

    expect(page).toMatchObject({
      source: "trustpilot",
      url: source.url,
      title: "Demo reviews",
      html: "<article>Review</article>",
      markdown: "Review",
      parsing: { reviews: [] },
      taskId: "task-1",
      statusCode: 200,
    });
  });
});

describe("extractReviewContent", () => {
  it("requests rendered html/markdown/link extraction for a source", async () => {
    const extract = vi.fn(async () => ({
      url: source.url,
      status_code: 200,
      data: { markdown: "review text" },
    }));
    const client = { extract } as unknown as NimbleClient;

    const page = await extractReviewContent(source, client);

    expect(extract).toHaveBeenCalledWith({
      url: source.url,
      render: true,
      driver: "vx8",
      formats: ["html", "markdown", "links"],
      country: "US",
      locale: "en-US",
    });
    expect(page.markdown).toBe("review text");
  });
});

describe("startReviewContentCrawl", () => {
  it("starts a bounded crawl with extract options", async () => {
    const createCrawl = vi.fn(async () => ({
      crawl_id: "crawl-1",
      url: source.url,
      status: "queued",
    }));
    const client = { createCrawl } as unknown as NimbleClient;

    await startReviewContentCrawl(source, client, { limit: 3, maxDiscoveryDepth: 1 });

    expect(createCrawl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: source.url,
        name: "ghost-reviews-trustpilot",
        limit: 3,
        max_discovery_depth: 1,
        extract_options: expect.objectContaining({
          render: true,
          driver: "vx8",
          formats: ["html", "markdown", "links"],
        }),
      }),
    );
  });
});

describe("fetchCompletedCrawlContent", () => {
  it("fetches task results for completed crawl tasks only", async () => {
    const getTaskResult = vi.fn(async (taskId: string) => ({
      url: `${source.url}/${taskId}`,
      task_id: taskId,
      status_code: 200,
      data: { markdown: `content ${taskId}` },
    }));
    const client = { getTaskResult } as unknown as NimbleClient;

    const pages = await fetchCompletedCrawlContent(
      source,
      {
        crawl_id: "crawl-1",
        url: source.url,
        status: "completed",
        tasks: [
          { task_id: "done", status: "completed" },
          { task_id: "failed", status: "failed" },
        ],
      },
      client,
    );

    expect(getTaskResult).toHaveBeenCalledOnce();
    expect(pages).toHaveLength(1);
    expect(pages[0].markdown).toBe("content done");
  });
});
