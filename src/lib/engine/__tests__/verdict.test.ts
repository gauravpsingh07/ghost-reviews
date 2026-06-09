import { describe, it, expect } from "vitest";
import { classifyReview } from "@/lib/engine/verdict";
import type { Review } from "@/types";

const base: Review = { id: "1", rating: 5, date: new Date().toISOString(), text: "great", source: "amazon" };

describe("classifyReview", () => {
  it("is authentic with no flags", () => {
    expect(
      classifyReview(base, { isDuplicate: false, isIncentivized: false, inBurst: false }).verdict,
    ).toBe("authentic");
  });

  it("is a ghost when duplicate + AI-generated", () => {
    const r = classifyReview(base, {
      isDuplicate: true,
      isIncentivized: false,
      inBurst: false,
      llm: { id: "1", aiLikelihood: 0.9, specificity: 0.5, sentiment: 1 },
    });
    expect(r.verdict).toBe("ghost");
    expect(r.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it("is suspicious with a single soft flag", () => {
    expect(
      classifyReview(base, { isDuplicate: false, isIncentivized: true, inBurst: false }).verdict,
    ).toBe("suspicious");
  });
});
