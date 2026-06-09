"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import type { ScanResult } from "@/types";
import { Button } from "@/components/ui/button";

export interface ShareHauntingButtonProps {
  result: ScanResult;
  className?: string;
}

function shareCardUrl(result: ScanResult): string {
  const url = new URL("/api/share-card", window.location.origin);
  url.searchParams.set("product", result.product.name);
  url.searchParams.set("score", String(result.ghostScore));
  url.searchParams.set("tier", result.verdict.tier);
  return url.toString();
}

export function ShareHauntingButton({ result, className }: ShareHauntingButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function handleShare(): Promise<void> {
    const url = shareCardUrl(result);
    const title = `${result.product.name} Ghost Score`;
    const text = `${result.product.name}: Ghost Score ${result.ghostScore}/100 (${result.verdict.label})`;

    if (navigator.share) {
      await navigator.share({ title, text, url });
      setStatus("shared");
      return;
    }

    await navigator.clipboard.writeText(url);
    setStatus("copied");
  }

  const done = status !== "idle";

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={() => void handleShare()}>
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {status === "copied" ? "Copied card" : status === "shared" ? "Shared" : "Share this haunting"}
    </Button>
  );
}
