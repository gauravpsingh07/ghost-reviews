import type { LlmReviewScore, Review, ScanResult } from "@/types";
import { analyzeReviews } from "@/lib/engine";

export interface DemoScanFixture {
  key: string;
  queries: string[];
  result: ScanResult;
}

function review(
  id: string,
  rating: number,
  date: string,
  text: string,
  author: string,
  source: Review["source"] = "amazon",
  verifiedPurchase?: boolean,
): Review {
  return {
    id,
    rating,
    date: new Date(date).toISOString(),
    text,
    author,
    source,
    verifiedPurchase,
  };
}

function llmScores(
  reviews: Review[],
  defaults: Omit<LlmReviewScore, "id">,
  overrides: Record<string, Partial<Omit<LlmReviewScore, "id">>> = {},
): Map<string, LlmReviewScore> {
  return new Map(
    reviews.map((item) => [
      item.id,
      {
        id: item.id,
        ...defaults,
        ...overrides[item.id],
      },
    ]),
  );
}

function fixture(input: {
  key: string;
  queries: string[];
  scannedAt: string;
  product: ScanResult["product"];
  reviews: Review[];
  llm: Map<string, LlmReviewScore>;
}): DemoScanFixture {
  return {
    key: input.key,
    queries: input.queries,
    result: {
      ...analyzeReviews({
        product: input.product,
        reviews: input.reviews,
        llm: input.llm,
        demoMode: true,
      }),
      scannedAt: input.scannedAt,
    },
  };
}

const ghostCaseReviews = [
  ...Array.from({ length: 7 }, (_, index) =>
    review(
      `ghostcase-copy-${index}`,
      5,
      "2026-05-29",
      "Amazing battery case, premium quality, fast charging, best purchase ever, highly recommend to everyone.",
      `Customer ${index + 1}`,
      "amazon",
      true,
    ),
  ),
  review(
    "ghostcase-free",
    5,
    "2026-05-29",
    "I received this free in exchange for an honest review and it is amazing, premium, and perfect.",
    "Promo Reviewer",
    "amazon",
    false,
  ),
  review(
    "ghostcase-burnt",
    1,
    "2026-02-11",
    "The case got hot while charging and left a scorch mark near the connector.",
    "Dana",
    "amazon",
    true,
  ),
  review(
    "ghostcase-returned",
    1,
    "2026-03-04",
    "Returned it after the magnet slipped off my phone twice in the first week.",
    "Miles",
    "amazon",
    true,
  ),
];

const cozyBrewReviews = [
  review(
    "cozybrew-pour",
    5,
    "2026-01-09",
    "The narrow spout gives me better pour control, and the handle stays cool during a full kettle.",
    "Nora",
    "trustpilot",
  ),
  review(
    "cozybrew-lid",
    4,
    "2026-02-18",
    "Heats quickly and the thermometer is accurate, though the lid rattles when it boils hard.",
    "Chen",
    "trustpilot",
  ),
  review(
    "cozybrew-size",
    3,
    "2026-03-20",
    "Good for one large mug, but I wish the capacity were bigger for guests.",
    "Avery",
    "trustpilot",
  ),
  review(
    "cozybrew-scale",
    4,
    "2026-04-24",
    "After a month the inside shows light mineral scale, but vinegar cleaned it fast.",
    "Priya",
    "trustpilot",
  ),
  review(
    "cozybrew-cord",
    2,
    "2026-05-06",
    "The cord is shorter than my counter setup needs, so I moved the base closer to the outlet.",
    "Leo",
    "trustpilot",
  ),
  review(
    "cozybrew-travel",
    5,
    "2026-05-28",
    "Packed it for a cabin weekend and it worked well with a small hand grinder.",
    "Sam",
    "trustpilot",
  ),
];

const glowFitReviews = [
  ...Array.from({ length: 5 }, (_, index) =>
    review(
      `glowfit-template-${index}`,
      5,
      "2026-06-01",
      "This fitness band is excellent, stylish, accurate, comfortable, and truly life changing.",
      `Wellness Fan ${index + 1}`,
      "amazon",
      false,
    ),
  ),
  review(
    "glowfit-discount",
    5,
    "2026-06-01",
    "Received at a discount for my honest review; excellent band with stylish design and accurate tracking.",
    "Discount Tester",
    "amazon",
    false,
  ),
  review(
    "glowfit-sleep",
    2,
    "2026-04-17",
    "Sleep tracking missed two wakeups every night compared with my phone alarm log.",
    "Morgan",
    "amazon",
    true,
  ),
  review(
    "glowfit-strap",
    1,
    "2026-05-02",
    "The strap pin snapped during a run and the replacement band took nine days to arrive.",
    "Iris",
    "amazon",
    true,
  ),
  review(
    "glowfit-heart",
    3,
    "2026-05-18",
    "Heart-rate readings are close on walks, but interval workouts lag behind my chest strap.",
    "Evan",
    "amazon",
    true,
  ),
];

export const DEMO_SCAN_FIXTURES: DemoScanFixture[] = [
  fixture({
    key: "ghostcase-power-snap",
    queries: ["ghostcase power snap", "ghostcase battery case", "demo haunted charger"],
    scannedAt: "2026-06-09T12:00:00.000Z",
    product: {
      name: "GhostCase Power Snap",
      url: "https://www.amazon.com/product-reviews/GHOSTCASE",
      source: "amazon",
    },
    reviews: ghostCaseReviews,
    llm: llmScores(ghostCaseReviews, { aiLikelihood: 0.86, specificity: 0.18, sentiment: 0.92 }, {
      "ghostcase-burnt": { aiLikelihood: 0.12, specificity: 0.82, sentiment: -0.85 },
      "ghostcase-returned": { aiLikelihood: 0.1, specificity: 0.8, sentiment: -0.75 },
    }),
  }),
  fixture({
    key: "cozybrew-kettle",
    queries: ["cozybrew kettle", "cozybrew gooseneck", "demo clean kettle"],
    scannedAt: "2026-06-09T12:05:00.000Z",
    product: {
      name: "CozyBrew Gooseneck Kettle",
      url: "https://www.trustpilot.com/review/cozybrew.example",
      source: "trustpilot",
    },
    reviews: cozyBrewReviews,
    llm: llmScores(cozyBrewReviews, { aiLikelihood: 0.12, specificity: 0.82, sentiment: 0.45 }, {
      "cozybrew-cord": { sentiment: -0.35 },
      "cozybrew-size": { sentiment: 0.05 },
    }),
  }),
  fixture({
    key: "glowfit-pulse-band",
    queries: ["glowfit pulse band", "glowfit tracker reviews", "demo incentivized fitness band"],
    scannedAt: "2026-06-09T12:10:00.000Z",
    product: {
      name: "GlowFit Pulse Band",
      url: "https://www.amazon.com/product-reviews/GLOWFIT",
      source: "amazon",
    },
    reviews: glowFitReviews,
    llm: llmScores(glowFitReviews, { aiLikelihood: 0.78, specificity: 0.22, sentiment: 0.88 }, {
      "glowfit-sleep": { aiLikelihood: 0.14, specificity: 0.86, sentiment: -0.55 },
      "glowfit-strap": { aiLikelihood: 0.1, specificity: 0.9, sentiment: -0.9 },
      "glowfit-heart": { aiLikelihood: 0.18, specificity: 0.82, sentiment: 0.05 },
    }),
  }),
];
