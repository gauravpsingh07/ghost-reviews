import { describe, expect, it } from "vitest";
import { resolveAppUrl } from "@/lib/appUrl";

describe("resolveAppUrl", () => {
  it("prefers the explicit public app url", () => {
    expect(
      resolveAppUrl({
        NEXT_PUBLIC_APP_URL: "https://ghost.reviews",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toBe("https://ghost.reviews");
  });

  it("uses the production Vercel hostname when present", () => {
    expect(resolveAppUrl({ VERCEL_PROJECT_PRODUCTION_URL: "ghost-reviews.vercel.app" })).toBe(
      "https://ghost-reviews.vercel.app",
    );
  });

  it("falls back to the preview deployment hostname", () => {
    expect(resolveAppUrl({ VERCEL_URL: "ghost-reviews-git-main.vercel.app" })).toBe(
      "https://ghost-reviews-git-main.vercel.app",
    );
  });

  it("uses localhost when no deployment url is configured", () => {
    expect(resolveAppUrl({})).toBe("http://localhost:3000");
  });
});
