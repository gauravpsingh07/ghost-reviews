import { NextResponse } from "next/server";
import { parseScanRequestBody, scanErrorResponse } from "@/lib/api/scan";
import { scanProduct } from "@/lib/scan";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = parseScanRequestBody(body);
    const result = await scanProduct(input);
    return NextResponse.json(result);
  } catch (error) {
    const response = scanErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
