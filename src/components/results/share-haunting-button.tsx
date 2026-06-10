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
  const [status, setStatus] = useState<"idle" | "shared" | "opened">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function handleShare(): Promise<void> {
    const url = shareCardUrl(result);
    const title = `${result.product.name} Ghost Score`;
    const text = `${result.product.name}: Ghost Score ${result.ghostScore}/100 (${result.verdict.label})`;

    // Native share only on touch devices (mobile/tablet); desktop browsers fake-support it.
    const useNativeShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      Boolean(window.matchMedia?.("(pointer: coarse)").matches);

    if (useNativeShare) {
      try {
        await navigator.share({ title, text, url });
        setStatus("shared");
        return;
      } catch (error) {
        // User dismissed the sheet — respect that and stop.
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Otherwise fall through to the desktop behaviour.
      }
    }

    // Desktop: open the generated card so the user actually sees it, and copy the link too.
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be unavailable (permissions / non-secure context); the opened card is enough.
    }
    setStatus("opened");
  }

  const done = status !== "idle";

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={() => void handleShare()}>
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {status === "opened" ? "Opened card" : status === "shared" ? "Shared" : "Share this haunting"}
    </Button>
  );
}
