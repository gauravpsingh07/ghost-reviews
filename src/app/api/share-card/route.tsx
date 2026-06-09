/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";

const size = { width: 1200, height: 630 };

function cleanText(value: string | null, fallback: string): string {
  return (value ?? fallback).slice(0, 80);
}

function scoreValue(value: string | null): number {
  const score = Number(value);
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function tierLabel(tier: string | null): string {
  if (tier === "clean") return "Clean - barely a whisper";
  if (tier === "mild") return "Mildly haunted";
  if (tier === "haunted") return "Haunted - proceed with caution";
  if (tier === "severe") return "Heavily haunted";
  return "Review trust report";
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const product = cleanText(url.searchParams.get("product"), "ghost.reviews");
  const score = scoreValue(url.searchParams.get("score"));
  const tier = tierLabel(url.searchParams.get("tier"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#08080a",
          color: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        <img
          src={new URL("/ghost-mascot-og.png", request.url).toString()}
          alt=""
          width="1200"
          height="686"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.34,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8, 8, 10, 0.64)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 28, color: "#c4b5fd", fontWeight: 700 }}>ghost.reviews</div>
            <div style={{ fontSize: 24, color: "#a1a1aa" }}>review trust report</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 48 }}>
            <div
              style={{
                width: 250,
                height: 250,
                borderRadius: 28,
                border: "2px solid rgba(167,139,250,0.44)",
                background: "rgba(20,20,23,0.86)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 28, color: "#a1a1aa" }}>Ghost Score</div>
              <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 1, color: "#fda4af" }}>
                {score}
              </div>
              <div style={{ fontSize: 26, color: "#a1a1aa" }}>out of 100</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
              <div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 900 }}>{product}</div>
              <div style={{ fontSize: 34, color: "#fed7aa" }}>{tier}</div>
              <div style={{ fontSize: 26, color: "#d4d4d8" }}>
                Signals suggest. Evidence shown. Verdicts are not proof of fraud.
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
