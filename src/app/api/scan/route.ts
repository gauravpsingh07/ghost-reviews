import { NextResponse } from "next/server";
import {
  checkScanRateLimit,
  getCachedScanResult,
  setCachedScanResult,
} from "@/lib/api/cache";
import { parseScanRequestBody, rateLimitErrorResponse, scanErrorResponse } from "@/lib/api/scan";
import { scanProduct } from "@/lib/scan";

function requestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = parseScanRequestBody(body);

    const rateLimit = checkScanRateLimit(requestIdentifier(request));
    if (!rateLimit.allowed) {
      const response = rateLimitErrorResponse();
      return NextResponse.json(response.body, {
        status: response.status,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }

    const cached = getCachedScanResult(input);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Ghost-Cache": "HIT",
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }

    const result = await scanProduct(input);
    setCachedScanResult(input, result);
    return NextResponse.json(result, {
      headers: {
        "X-Ghost-Cache": "MISS",
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (error) {
    const response = scanErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
