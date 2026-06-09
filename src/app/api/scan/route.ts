import { NextResponse } from "next/server";
import { scanProduct } from "@/lib/scan";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { query?: unknown };
    const query = typeof body.query === "string" ? body.query : "";
    const result = await scanProduct({ query });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
