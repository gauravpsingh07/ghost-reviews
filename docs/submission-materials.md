# ghost.reviews Submission Materials

Use this as the copy source for Devpost, the demo video, and the final pitch.

## Project Basics

- Project name: ghost.reviews
- Tagline: Every product is haunted. We find the ghosts.
- Challenges: name.com Domain Roulette, Nimble live web
- Public repo: `https://github.com/gauravpsingh07/ghost-reviews`
- Live link: `https://ghost-reviews-nb3a.vercel.app`
- Deadline: June 10, 2026 at 10:00 AM EST

## Elevator Pitch

Every product is haunted by reviews no human ever wrote. ghost.reviews crawls product reviews, scores how suspicious they look, and shows the evidence behind the verdict so shoppers can see the ghosts before they buy.

## Short Description

ghost.reviews is a fake-review detector for the live web. Paste a product name or review URL and it returns a Ghost Score, signal breakdown, suspicious-review evidence, duplicate-review clusters, and per-review verdicts. It combines Nimble-powered crawl/extract workflows with a transparent scoring engine and optional free-tier LLM signals.

## Full Story

Fake reviews are everywhere, and generative AI made them cheap to produce at scale. The FTC banned fake reviews in 2024, but shoppers still need a practical way to inspect the reviews in front of them.

ghost.reviews turns the domain into the product: the "ghosts" are ghostwritten or synthetic reviews. The app crawls review pages with Nimble, normalizes the findings, and scores them with a hybrid engine that looks for burst timing, duplicated text, rating anomalies, incentivized language, generic writing, AI-like phrasing, and sentiment-rating mismatch.

The output is intentionally transparent. Instead of saying "trust us," it shows the Ghost Score, the signal breakdown, the hauntings that drove the score, duplicate evidence side by side, and per-review reasons. Demo mode is locked to bundled fixtures so the presentation does not depend on network calls or paid APIs.

The hosted demo accepts the three bundled example products for full reports. Unmatched searches show a clean sample-data notice instead of returning unrelated fallback data.

## What Makes It Useful

- Shoppers get a fast trust check before buying.
- Marketplaces and brands get explainable review-quality signals.
- Judges can see both live-web architecture and no-network demo reliability.
- The domain is not decorative; it directly explains the product concept.

## Built With

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Framer Motion
- lucide-react
- Vitest
- Nimble SDK API
- Groq, Gemini, or RunPod free/sponsor-credit LLM path
- Vercel

## Demo Queries

Use these in order for a clean recording:

1. `ghostcase power snap` - haunted charger, strongest evidence.
2. `cozybrew kettle` - cleaner baseline.
3. `glowfit pulse band` - incentivized/generic review pattern.

Do not type an arbitrary product during the recorded demo unless you intentionally want to show the guardrail message: "This hosted demo runs on bundled sample data. Try one of the example products above for a full report."

## Demo Flow

1. Open the app on the landing page.
2. Point out the tagline and the product/review URL input.
3. Run `ghostcase power snap`.
4. Pause on the Ghost Score and verdict banner.
5. Scroll through hauntings and signal meters.
6. Show duplicate review evidence side by side.
7. Show per-review verdict reasons.
8. Click "Share this haunting" and show the generated share card URL/copy behavior.
9. Close with demo mode reliability and live Nimble architecture.

## Video Script, 2-3 Minutes

### 0:00-0:15 - Hook

"Every product you buy is haunted by reviews that might not have been written by a real customer. ghost.reviews finds those ghosts."

Show the landing page and the input.

### 0:15-0:35 - Problem

"Fake reviews are not just annoying. They change what people buy, and with modern AI they are cheap to generate in bulk. The FTC banned fake reviews in 2024, but consumers still need a way to inspect the reviews in front of them."

### 0:35-0:55 - What It Does

"Paste a product name or review URL. The production demo uses bundled sample data for reliability, while the app architecture supports Nimble-powered live review crawl and extraction. It analyzes the text and timing patterns, then returns a Ghost Score with evidence."

Run `ghostcase power snap`.

### 0:55-1:35 - Result Reveal

"This product comes back haunted. The score is not a black box: the app shows which signals contributed, including duplicated wording, suspicious timing, generic language, and rating/sentiment mismatch."

Show the gauge, verdict banner, hauntings, and signal breakdown.

### 1:35-2:05 - Evidence

"The important part is evidence. Here are the reviews behind the finding, with duplicate clusters side by side and per-review reasons. The tool does not claim legal proof; it shows concrete signals a human can inspect."

Show duplicate evidence and review cards.

### 2:05-2:25 - How It Works

"Under the hood, Nimble handles the live-web search, crawl, and extraction path. The detection engine is pure TypeScript and unit-tested. For judging, demo mode uses cached fixtures so the presentation is reliable even without network calls, and unmatched searches show a clear sample-data notice instead of wrong results."

### 2:25-2:45 - Close

"ghost.reviews turns an unusual domain into a practical trust tool: every product is haunted, and we find the ghosts."

## Devpost Answers

### Inspiration

The domain ghost.reviews immediately suggested ghostwritten reviews. Fake reviews are a real consumer problem, and the rise of cheap AI text makes the problem feel urgent. The goal was to make the domain useful, memorable, and demoable.

### What It Does

ghost.reviews analyzes product reviews and returns an explainable Ghost Score. It highlights suspicious review bursts, near-duplicate text, rating anomalies, generic phrasing, AI-like language, incentivized wording, and sentiment-rating mismatch.

### How We Built It

The app uses Next.js, TypeScript, and Tailwind for the interface. `POST /api/scan` orchestrates bundled demo fixtures or live Nimble crawling, normalizes reviews, runs the pure detection engine, optionally enriches language signals with a free LLM provider, and returns a typed `ScanResult`. Results are rendered as a gauge, verdict banner, hauntings, signal meters, duplicate evidence, review cards, and a generated share image.

### Challenges

The biggest challenge was making the system reliable enough for a hackathon demo while still representing live-web architecture. Demo fixtures solve the no-network path, while the Nimble client and adapters preserve the live crawl path when credentials are configured. Another challenge was keeping the score explainable rather than arbitrary, so every signal is surfaced with evidence.

### Accomplishments

- Built an end-to-end scan flow from query to score to evidence.
- Added no-network demo fixtures for reliable presentation.
- Kept the engine pure and covered by unit tests.
- Built a polished themed UI with share-card generation.
- Stayed on the free stack with no required paid APIs.

### What We Learned

For trust tooling, presentation matters as much as detection. A score is only useful when users can see why it happened. Evidence-first UI makes the result more credible and easier to judge.

### What's Next

- Browser extension overlay for shopping pages.
- Product comparison mode.
- Public API for review-quality checks.
- Brand dashboard for monitoring review manipulation over time.
- Stronger source adapters for more marketplaces.

## Screenshot Checklist

- Landing page with input and how-it-works strip: `public/readme-home.png`
- Generated share card: `public/readme-share-card.png`
- Final Devpost capture to add manually: results page showing gauge, hauntings, and duplicate evidence after production deploy.

## Final Submission Checklist

- Live URL added: `https://ghost-reviews-nb3a.vercel.app`.
- Confirm public repo URL.
- Confirm `DEMO_MODE=true` in production if live credentials are not configured.
- Upload screenshots.
- Upload 2-3 minute video.
- Select name.com Domain Roulette and Nimble challenges.
- Submit before June 10, 2026 at 10:00 AM EST.
