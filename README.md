<div align="center">

# 👻 ghost.reviews

### Every product is haunted. We find the ghosts.

**ghost.reviews** crawls a product's **live** reviews from across the web and returns a
**Ghost Score** — the percentage of reviews likely to be fake or ghostwritten — backed by evidence.

Built for the **DeveloperWeek New York 2026 Hackathon** · name.com *Domain Roulette* + Nimble *Live Web* challenges.

</div>

---

## What it does

Paste a product (name, URL, app, or business). ghost.reviews:

1. **Crawls the live web** for that product's reviews across multiple sites (powered by **Nimble**).
2. **Analyzes** them with a transparent hybrid engine — deterministic signals (review bursts,
   near-duplicates, rigged rating curves, incentivized language) + an LLM (AI-written detection,
   specificity, sentiment).
3. **Reports a Ghost Score (0–100)** with **"hauntings"** (the evidence) and a per-review
   👻 *ghost* / ⚠️ *suspicious* / ✅ *authentic* verdict.

It's a transparency tool — it surfaces *signals* of inauthentic reviews **with evidence**, not a
black-box verdict.

## Why it matters

The FTC banned fake reviews in 2024, and LLMs made them trivially cheap to mass-produce. Consumers,
marketplaces, and brands all need a way to see which reviews are real. ghost.reviews is that detector.

## How it works

```
paste product ──► Nimble live crawl ──► detection engine ──► Ghost Score + evidence
                   (search + extract)    (code signals + LLM)   (gauge, hauntings, per-review)
```

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · **Nimble** (live web) ·
**Anthropic Claude** (review analysis) · Vercel.

## Detection signals

Review burstiness · near-duplicate clusters · rating-distribution anomalies · AI-generated likelihood ·
low-specificity / generic language · sentiment–rating mismatch · incentivized-language markers — blended
into a weighted Ghost Score (see [`BUILD_PLAN.md`](BUILD_PLAN.md) §3).

## Run locally

```bash
npm install
cp .env.example .env.local   # add your NIMBLE_API_KEY and ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Set `DEMO_MODE=true` to run on bundled fixtures without any API keys.

> **Secrets:** real keys go only in `.env.local` (gitignored). A pre-commit hook blocks accidental
> commits of `.env`/key files and key-like content. After cloning, enable it once with
> `git config core.hooksPath .githooks`.

## Project status & full plan

This repo is built in phases (~50 commits). The complete spec, architecture, API contract, and
commit-by-commit plan live in **[`BUILD_PLAN.md`](BUILD_PLAN.md)** — start there.

---

<div align="center">
<sub>A transparency tool. Ghost Scores reflect statistical signals, not definitive proof of fraud.</sub>
</div>
