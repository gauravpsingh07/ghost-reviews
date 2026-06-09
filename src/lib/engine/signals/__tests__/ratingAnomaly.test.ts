import { describe, it, expect } from "vitest";
import { ratingAnomaly } from "@/lib/engine/signals/ratingAnomaly";
import type { Review } from "@/types";

function r(rating: number, id = "r"): Review {
  return { id, rating, date: new Date().toISOString(), text: "x", source: "amazon" };
}

describe("ratingAnomaly", () => {
  it("returns 0 with too few ratings", () => {
    expect(ratingAnomaly([r(5)]).score).toBe(0);
  });

  it("scores high for a J-shaped curve (only 5s and 1s)", () => {
    const rs = [
      ...Array.from({ length: 8 }, (_, i) => r(5, "a" + i)),
      ...Array.from({ length: 2 }, (_, i) => r(1, "b" + i)),
    ];
    expect(ratingAnomaly(rs).score).toBeGreaterThan(0.4);
  });

  it("scores low for a healthy spread", () => {
    const rs = [1, 2, 3, 3, 4, 4, 4, 5, 5, 5].map((n, i) => r(n, "c" + i));
    expect(ratingAnomaly(rs).score).toBeLessThan(0.2);
  });
});
