import { afterEach, describe, expect, it, vi } from "vitest";
import { createNimbleClient, NimbleApiError, NimbleUnavailableError } from "@/lib/nimble";

const configured = {
  baseUrl: "https://sdk.nimbleway.com/v1",
  enabled: true,
  apiKey: "short",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createNimbleClient", () => {
  it("fails closed when no API key is configured", async () => {
    const client = createNimbleClient({
      baseUrl: "https://sdk.nimbleway.com/v1",
      enabled: false,
      reason: "missing key",
    });

    await expect(client.search({ query: "reviews" })).rejects.toBeInstanceOf(NimbleUnavailableError);
  });

  it("posts search requests with bearer auth", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [], total_results: 0 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createNimbleClient(configured);
    await client.search({ query: "anker reviews", max_results: 5 });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sdk.nimbleway.com/v1/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer short",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ query: "anker reviews", max_results: 5 }),
      }),
    );
  });

  it("throws a typed API error for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 402,
        json: async () => ({ message: "trial expired" }),
      })),
    );

    const client = createNimbleClient(configured);
    await expect(client.extract({ url: "https://example.com" })).rejects.toMatchObject({
      name: "NimbleApiError",
      status: 402,
      message: "trial expired",
    } satisfies Partial<NimbleApiError>);
  });
});
