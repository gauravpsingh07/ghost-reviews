import { describe, expect, it } from "vitest";
import { parseScanRequestBody, scanErrorResponse } from "@/lib/api/scan";
import { ScanError } from "@/lib/scan";
import { NimbleUnavailableError } from "@/lib/nimble";

describe("parseScanRequestBody", () => {
  it("trims query and defaults source to auto", () => {
    expect(parseScanRequestBody({ query: "  GlowFit  " })).toEqual({
      query: "GlowFit",
      source: "auto",
    });
  });

  it("rejects empty queries", () => {
    expect(() => parseScanRequestBody({ query: "   " })).toThrow();
  });
});

describe("scanErrorResponse", () => {
  it("maps validation errors to 400", () => {
    const error = (() => {
      try {
        parseScanRequestBody({ query: "" });
      } catch (caught) {
        return caught;
      }
    })();

    expect(scanErrorResponse(error)).toMatchObject({
      status: 400,
      body: { error: { code: "BAD_REQUEST" } },
    });
  });

  it("maps no-review scan errors to 404", () => {
    expect(scanErrorResponse(new ScanError("NO_REVIEWS", "No reviews found."))).toEqual({
      status: 404,
      body: { error: { code: "NO_REVIEWS", message: "No reviews found." } },
    });
  });

  it("maps live crawl configuration problems to 502", () => {
    expect(scanErrorResponse(new NimbleUnavailableError("missing key"))).toMatchObject({
      status: 502,
      body: { error: { code: "UPSTREAM_ERROR" } },
    });
  });
});
