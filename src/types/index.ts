// Core domain types for ghost.reviews — see BUILD_PLAN.md §5.

export type SourceId = "amazon" | "trustpilot" | "google" | "appstore" | "yelp" | "other";

export interface Review {
  id: string;
  author?: string;
  rating: number; // 1..5 (0 = unknown)
  date: string; // ISO 8601
  text: string;
  source: SourceId;
  verifiedPurchase?: boolean;
}

export interface SignalScores {
  burstiness: number; // 0..1 (1 = most suspicious)
  duplication: number;
  aiGenerated: number;
  generic: number;
  ratingAnomaly: number;
  sentimentMismatch: number;
  incentivized: number;
}

export type Severity = "low" | "med" | "high";

export interface Haunting {
  id: string;
  icon: string;
  title: string;
  detail: string;
  severity: Severity;
  evidenceRefs: string[]; // review ids
}

export type ReviewVerdict = "authentic" | "suspicious" | "ghost";

export interface AnalyzedReview extends Review {
  verdict: ReviewVerdict;
  reasons: string[];
}

export type VerdictTier = "clean" | "mild" | "haunted" | "severe";

export interface ScanResult {
  product: { name: string; url?: string; image?: string; source: SourceId };
  ghostScore: number; // 0..100
  verdict: { tier: VerdictTier; label: string; emoji: string };
  reviewsAnalyzed: number;
  signals: SignalScores;
  hauntings: Haunting[];
  reviews: AnalyzedReview[];
  scannedAt: string; // ISO
  demoMode: boolean;
}

/** Per-review linguistic scores from the LLM (Phase 3). Optional in deterministic-only mode. */
export interface LlmReviewScore {
  id: string;
  aiLikelihood: number; // 0..1
  specificity: number; // 0..1
  sentiment: number; // -1..1
}
