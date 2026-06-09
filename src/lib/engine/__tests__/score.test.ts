import { describe, it, expect } from "vitest";
import { ghostScore, verdictTier, SIGNAL_WEIGHTS } from "@/lib/engine/score";
import type { SignalScores } from "@/types";

const zero: SignalScores = {
  burstiness: 0,
  duplication: 0,
  aiGenerated: 0,
  generic: 0,
  ratingAnomaly: 0,
  sentimentMismatch: 0,
  incentivized: 0,
};

describe("ghostScore", () => {
  it("weights sum to 1", () => {
    expect(Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("is 0 for all-clean and 100 for all-max", () => {
    expect(ghostScore(zero)).toBe(0);
    const max: SignalScores = {
      burstiness: 1,
      duplication: 1,
      aiGenerated: 1,
      generic: 1,
      ratingAnomaly: 1,
      sentimentMismatch: 1,
      incentivized: 1,
    };
    expect(ghostScore(max)).toBe(100);
  });

  it("blends by weight", () => {
    expect(ghostScore({ ...zero, burstiness: 1, duplication: 1 })).toBe(40);
  });
});

describe("verdictTier", () => {
  it("maps scores to tiers", () => {
    expect(verdictTier(10).tier).toBe("clean");
    expect(verdictTier(40).tier).toBe("mild");
    expect(verdictTier(70).tier).toBe("haunted");
    expect(verdictTier(90).tier).toBe("severe");
  });
});
