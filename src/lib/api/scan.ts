import { z, ZodError } from "zod";
import { ScanError } from "@/lib/scan";
import { NimbleApiError, NimbleUnavailableError } from "@/lib/nimble";

const sourceSchema = z.enum(["auto", "amazon", "trustpilot", "google", "appstore", "yelp", "other"]);

export const scanRequestSchema = z.object({
  query: z.string().trim().min(1, "Query is required.").max(300, "Query is too long."),
  source: sourceSchema.optional().default("auto"),
});

export type ScanRequestBody = z.infer<typeof scanRequestSchema>;

export type ApiErrorCode = "BAD_REQUEST" | "NO_REVIEWS" | "UPSTREAM_ERROR" | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export function parseScanRequestBody(body: unknown): ScanRequestBody {
  return scanRequestSchema.parse(body);
}

export function scanErrorResponse(error: unknown): { status: number; body: ApiErrorResponse } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid scan request.",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
    };
  }

  if (error instanceof ScanError && error.code === "NO_REVIEWS") {
    return {
      status: 404,
      body: { error: { code: "NO_REVIEWS", message: error.message } },
    };
  }

  if (error instanceof NimbleUnavailableError || error instanceof NimbleApiError) {
    return {
      status: 502,
      body: {
        error: {
          code: "UPSTREAM_ERROR",
          message: "Live review crawl is unavailable. Try a demo query or retry shortly.",
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "The scan failed unexpectedly.",
      },
    },
  };
}
