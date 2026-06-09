import { describe, expect, it } from "vitest";
import { DEMO_SCAN_FIXTURES, loadDemoScanResult } from "@/lib/fixtures";
import type { ScanResult } from "@/types";

function snapshotShape(result: ScanResult) {
  return {
    product: result.product,
    ghostScore: result.ghostScore,
    verdict: result.verdict,
    reviewsAnalyzed: result.reviewsAnalyzed,
    signals: result.signals,
    hauntings: result.hauntings.map((haunting) => ({
      id: haunting.id,
      title: haunting.title,
      detail: haunting.detail,
      severity: haunting.severity,
      evidenceRefs: haunting.evidenceRefs,
    })),
    reviews: result.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      source: review.source,
      verifiedPurchase: review.verifiedPurchase,
      verdict: review.verdict,
      reasons: review.reasons,
    })),
    scannedAt: result.scannedAt,
    demoMode: result.demoMode,
  };
}

describe("demo scan fixtures", () => {
  it("matches the cached scan-result snapshots", () => {
    expect(
      DEMO_SCAN_FIXTURES.map((fixture) => ({
        key: fixture.key,
        aliases: fixture.queries,
        result: snapshotShape(fixture.result),
      })),
    ).toMatchSnapshot();
  });

  it("loads every advertised query alias without network fallback", () => {
    for (const fixture of DEMO_SCAN_FIXTURES) {
      for (const query of fixture.queries) {
        expect(loadDemoScanResult(query, { forceDemoMode: false })?.product.name).toBe(
          fixture.result.product.name,
        );
      }
    }
  });
});
