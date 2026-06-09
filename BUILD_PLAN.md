# ghost.reviews — Master Build Plan & Context

> **This is the single source of truth for the project.** It contains the full product spec,
> technical design, and a phased, commit-by-commit build plan. If you are an AI agent (Claude,
> Codex, etc.) picking this up cold: **read this entire file first**, then implement the phases in
> order, one commit per listed item, using the exact commit messages provided. Everything you need
> is in this document — you should not need outside context.

---

## 0. TL;DR / How to use this doc

- **What we're building:** `ghost.reviews` — a web app that crawls a product's **live** reviews from
  across the web and returns a **Ghost Score** (0–100, % likely fake / ghostwritten) with evidence.
- **Why:** to win the **name.com "Domain Roulette" cash prize ($2,500 1st / $1,000 2nd)** at the
  DeveloperWeek New York 2026 Hackathon, and stack the **Nimble "agentic live-web" prize**
  (+$500 gift card +$500 credits).
- **Deadline:** **Wednesday, June 10, 2026 @ 10:00 AM EST.** No late submissions. (This plan assumes
  an overnight build — scope is ruthless on purpose.)
- **Stack:** Next.js (App Router, TypeScript) + Tailwind + shadcn/ui + Framer Motion, deployed on
  Vercel. Live web data via **Nimble**. Linguistic analysis via a **free-tier LLM** (Groq or Google Gemini — no credit card). **Total cost: $0 (see §11.1).**
- **Commit plan:** 50 commits across 10 phases (0–9). Use the exact commit messages in §14.
- **Progress tracker:** §19 — check items off as you go.

**Working agreement for agents:** small commits, conventional-commit messages, run tests/lint before
each commit, never commit secrets (`.env*` is gitignored — use `.env.example` as the template).

---

## 1. The hackathon & the win strategy

**Event:** DeveloperWeek New York 2026 Hackathon (DevNetwork). Online + in-person (TWA Hotel, Queens).
Teams 1–5. Focus areas: DevOps, Enterprise, ML/AI.

**Prize we are targeting (cash):**
- **name.com — Domain Roulette: $2,500 (1st) / $1,000 (2nd) — pure cash.** This is the only large
  cash prize; everything else is gear / gift cards / credits.
- **Nimble — "Build an agentic app that sees the live web": $500 + $500 credits (1st).** Our app uses
  Nimble as its core engine, so we enter this challenge for free → stacked near-cash.

**name.com judging criteria (build to these):**
1. Creative interpretation of the domain
2. Technical execution
3. Product polish & experience
4. Strength of concept & originality
5. How deeply the project connects back to the domain itself

> name.com's stated intent (verbatim): *"We are looking to reward teams that take an **unexpected**
> domain and turn it into something **surprisingly thoughtful, useful, or entertaining**."*

**Overall hackathon judging (also applies):** Progress · Concept (solves a real problem) · Feasibility
(could become a startup).

**Nimble challenge requirement:** build an AI-powered agentic app using Nimble (Search, Extract, Crawl,
Map, Web Search Agents, MCP server, or APIs) to search/browse/extract/analyze **live** web data.

**Domain selected:** `ghost.reviews` (claimed at https://domainroulette.dev/).

**Strategic principles (do not violate):**
- **Polish + one flawless 90-second demo beats technical sprawl.** This is a creativity/polish contest.
  Build ONE real working feature, then pour remaining hours into making it feel finished.
- **Every detection signal must show real, concrete, human-readable evidence.** Truthful evidence =
  credibility under judge Q&A. Never fabricate signals; compute real ones.
- **Spooky brand, serious tool.** Think *Have I Been Pwned* meets a friendly ghost — not a Halloween gag.

---

## 2. Product spec

### 2.1 Concept
The reframe: **"ghost" = ghostwritten / fake / phantom reviews** (not literal ghosts). User pastes a
product (name, URL, app, or business) → app crawls its live reviews across the web → returns a
**Ghost Score** with **"hauntings"** (evidence) and a per-review 👻 / ⚠️ / ✅ verdict. It's a
"trust report" for any product's reviews.

**Taglines (pick one for the hero):**
- "Every product is haunted. We find the ghosts."
- "Bust the fake reviews haunting your favorite products."
- "See which reviews were never written by a real human."

### 2.2 Brand & tone
- Friendly-ghost 👻 mascot. Dark mode. Tasteful "haunted" motif. **Professional**, trustworthy,
  security-tool feel. Spooky accents, not clutter.
- Themed microcopy (loading = "Conducting a séance…", empty = "No spirits found", error = "The
  connection to the other side was lost"). Keep it clean and confident.

### 2.3 Scope

**MVP — must ship before the video freeze:**
1. Input (product name or URL) + Scan button.
2. Nimble live crawl → normalized reviews `{author?, rating, date, text, source, verifiedPurchase?}`
   from 1–2 sources (start with whichever returns cleanest data; Trustpilot and Amazon are good).
3. Detection engine → Ghost Score + hauntings + per-review verdicts.
4. Polished result page: Ghost Score gauge + verdict, hauntings list, flagged-review cards,
   side-by-side duplicate-review evidence.
5. Themed loading / empty / error states.
6. **Demo mode**: cached results for 2–3 pre-tested products (reliability — demo must never depend on
   a live network at the wrong moment).
7. Deployed live on Vercel.

**Stretch (only if MVP is rock-solid):** shareable result / OG card · "recently haunted" gallery ·
compare two products · browser-extension (great feasibility story — **mock it in the video**, don't
build it) · public API endpoint (B2B story) · RunPod-hosted classifier.

**Out of scope:** accounts/auth, training a real ML model, exhaustive marketplace coverage, the actual
browser extension, payments.

---

## 3. Detection engine (the credibility core)

Real fake-review detection is fuzzy. We do **not** need SOTA accuracy — we need **explainable signals
computed from real data**, each with a concrete reason. Blend deterministic signals (pure code) +
linguistic signals (one batched LLM call) into a weighted Ghost Score.

### 3.1 Signals

| Key | Signal | Type | Algorithm | Weight |
|-----|--------|------|-----------|--------|
| `burstiness` | Review burst | code | Bucket reviews by day. Compute baseline = median daily count. Flag windows where count ≥ 3× baseline. Score = normalized fraction of reviews inside burst windows. | 0.20 |
| `duplication` | Near-duplicates | code | TF-IDF or embedding cosine similarity across all review texts; count pairs > 0.85 sim. Score = fraction of reviews in a near-dup cluster. | 0.20 |
| `aiGenerated` | Machine-written | LLM | Per review: "does this read as AI/templated?" 0–1. Score = mean. | 0.20 |
| `generic` | Low specificity | LLM | Per review: specificity 0–1 (concrete product details vs vague praise). Score = mean of (1 − specificity). | 0.15 |
| `ratingAnomaly` | Rigged ratings | code | Compare rating histogram to a healthy reference. J-shape/bimodal (high 5★ + 1★, sparse middle) → high score. | 0.10 |
| `sentimentMismatch` | Sentiment ≠ rating | code+LLM | Per review: compare LLM sentiment to star rating; large gaps → suspicious. Score = fraction with large gap. | 0.10 |
| `incentivized` | Bought-and-paid | code | Regex for "free in exchange for", "received a discount", "in exchange for honest", etc. Score = fraction matching. | 0.05 |

All signals normalized to **0–1** (1 = most suspicious). Weights live in one config object and must be
easy to tune.

### 3.2 Ghost Score
```
GhostScore = round(100 × Σ(weightᵢ × signalᵢ))    // 0–100, higher = more likely fake
```
Always render the per-signal breakdown alongside the score.

### 3.3 Verdict tiers
| Range | Tier key | Label | Emoji |
|-------|----------|-------|-------|
| 0–25 | `clean` | Clean — barely a whisper | ✨ |
| 26–50 | `mild` | Mildly haunted | 👻 |
| 51–75 | `haunted` | Haunted — proceed with caution | 👻👻 |
| 76–100 | `severe` | Heavily haunted | 💀 |

### 3.4 Per-review verdict
Compute per-review sub-scores (duplication membership, aiGenerated, 1−specificity, incentivized match,
sentimentMismatch). Combine → label each review:
- `ghost` 👻 (strong signals), `suspicious` ⚠️ (some signals), `authentic` ✅ (clean).
- Attach `reasons: string[]` — the top 1–2 human-readable reasons (e.g., "near-duplicate of 8 others",
  "reads as AI-generated", "mentions a free product").

### 3.5 Hauntings (aggregate findings — themed, for polish)
Generate a `Haunting[]` from the signals that crossed threshold. Each: `{ id, icon, title, detail,
severity, evidenceRefs }`. Examples:
- 🕯️ **Review burst** — "41 reviews in 72 hours (12× the normal rate)" (high)
- 👯 **Copy-paste coven** — "12 reviews are >85% identical" (high)
- 🤖 **Machine-written** — "28% of reviews read as AI-generated" (med)
- 🎁 **Bought-and-paid** — "9 reviews mention free products or discounts" (med)
- 📊 **Rigged ratings** — "92% 5★, 6% 1★, almost no middle" (med)

### 3.6 Ethics framing (also strengthens the pitch)
Use hedged language everywhere ("signals suggest", "likely"). Position as a **transparency tool that
surfaces evidence**, not a verdict machine. This is honest, defensible under judge questions, and a
stronger concept.

---

## 4. Architecture & stack

```
[ Next.js UI (App Router) ]
   - landing/hero + scan form
   - results: GhostScore gauge, verdict, hauntings, review cards, dup evidence
        │  POST /api/scan { query }
        ▼
[ /api/scan route handler ]
   1. resolve sources + crawl reviews   ── Nimble (search + extract/crawl)
   2. run deterministic signals         ── lib/engine (pure TS, unit-tested)
   3. run LLM signals (1 batched call)  ── lib/llm (Claude Haiku 4.5)
   4. blend → GhostScore + hauntings + per-review verdicts
        ▼
[ ScanResult JSON ]  (see §8 contract)  ──► rendered by UI
```

**Stack (committed):**
- Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion (animations).
- Zod for request/response validation.
- LLM (pluggable via `LLM_PROVIDER`): default **Groq** (free, no card — e.g. `llama-3.3-70b-versatile`)
  or **Google Gemini** (free tier — `gemini-2.0-flash`). Optional: free **RunPod** sponsor credits to
  host an open model (also enters the RunPod challenge). Anthropic/OpenAI work but are paid + optional.
- Live web: **Nimble** (Search + Extract/Crawl). Wire the Nimble MCP server if time allows.
- Deploy: Vercel.
- Tests: Vitest (engine + parsers are pure functions → high-value, fast tests).

**Python alternative (if preferred):** FastAPI backend (engine in Python) + a Vite/React front. Same
contract (§8), same engine spec (§3). The default plan below is the Next.js path.

---

## 5. Data types (TypeScript)

```ts
// lib/types.ts
export type SourceId = "amazon" | "trustpilot" | "google" | "appstore" | "yelp" | "other";

export interface Review {
  id: string;
  author?: string;
  rating: number;          // 1–5
  date: string;            // ISO 8601
  text: string;
  source: SourceId;
  verifiedPurchase?: boolean;
}

export interface SignalScores {
  burstiness: number;        // 0–1
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
  icon: string;            // emoji
  title: string;
  detail: string;
  severity: Severity;
  evidenceRefs: string[];  // review ids
}

export type ReviewVerdict = "authentic" | "suspicious" | "ghost";

export interface AnalyzedReview extends Review {
  verdict: ReviewVerdict;
  reasons: string[];
}

export type VerdictTier = "clean" | "mild" | "haunted" | "severe";

export interface ScanResult {
  product: { name: string; url?: string; image?: string; source: SourceId };
  ghostScore: number;      // 0–100
  verdict: { tier: VerdictTier; label: string; emoji: string };
  reviewsAnalyzed: number;
  signals: SignalScores;
  hauntings: Haunting[];
  reviews: AnalyzedReview[];
  scannedAt: string;       // ISO
  demoMode: boolean;
}
```

---

## 6. API contract — `POST /api/scan`

**Request**
```jsonc
{ "query": "Anker 737 Power Bank", "source": "auto" }   // source optional: "auto" | SourceId
```
**Response 200** → `ScanResult` (see §5). Example:
```jsonc
{
  "product": { "name": "Anker 737 Power Bank", "url": "https://...", "source": "amazon" },
  "ghostScore": 73,
  "verdict": { "tier": "haunted", "label": "Haunted — proceed with caution", "emoji": "👻👻" },
  "reviewsAnalyzed": 128,
  "signals": { "burstiness": 0.8, "duplication": 0.6, "aiGenerated": 0.28,
               "generic": 0.4, "ratingAnomaly": 0.7, "sentimentMismatch": 0.3, "incentivized": 0.2 },
  "hauntings": [
    { "id": "burst", "icon": "🕯️", "title": "Review burst",
      "detail": "41 reviews in 72 hours (12× the normal rate)", "severity": "high",
      "evidenceRefs": ["r12","r13"] }
  ],
  "reviews": [
    { "id": "r12", "author": "John D.", "rating": 5, "date": "2026-05-02", "text": "...",
      "verdict": "ghost", "reasons": ["near-duplicate of 8 others","reads as AI-generated"],
      "source": "amazon" }
  ],
  "scannedAt": "2026-06-10T05:00:00Z",
  "demoMode": false
}
```
**Errors:** `400` invalid body (zod), `404` no reviews found (themed empty state), `502` upstream
(Nimble/LLM) failure → friendly error state. If `DEMO_MODE=true` or query matches a fixture key, return
the cached fixture instantly.

---

## 7. Nimble integration notes

- Purpose: find the product's review pages across the web and extract the actual reviews (text, rating,
  date, author) — **live**, not from a static dataset. This is the Nimble-challenge story.
- Flow: (1) **Search** for review sources for the query (e.g., Trustpilot/Amazon/Google listings) →
  (2) **Extract/Crawl** the review content from the best source(s) → (3) normalize to `Review[]`.
- Implement behind a `NimbleClient` interface so we can add per-source adapters and swap in fixtures.
- **Verify the exact base URL, auth header, and endpoint shapes in the current Nimble docs / MCP
  server** before wiring (env: `NIMBLE_API_KEY`, `NIMBLE_BASE_URL`). Wire the Nimble **MCP server** if
  time permits for a cleaner agentic narrative.
- Pitch line: *"We don't use a stale dataset — we crawl the reviews that are live right now."*

---

## 8. LLM integration notes

- One **batched** call per scan: send an array of review texts, get back per-review
  `{ aiLikelihood: 0–1, specificity: 0–1, sentiment: -1..1 }` as strict JSON. Chunk if > ~40 reviews.
- A second small call (or same call) produces the human-readable haunting explanations.
- Model: a **free** provider via `LLM_PROVIDER` — Groq `llama-3.3-70b-versatile` or Gemini `gemini-2.0-flash`. Keep prompts deterministic; request JSON only.
- **Prompt sketch:**
  > You are an expert at detecting inauthentic product reviews. For each review, return strict JSON
  > `{id, aiLikelihood, specificity, sentiment}`. `aiLikelihood`: 0=clearly human, 1=clearly AI/templated.
  > `specificity`: 0=vague generic praise, 1=concrete first-hand product detail. `sentiment`: −1..1.
  > Do not add commentary. Reviews: `[…]`
- Always degrade gracefully: if the LLM call fails, compute the score from deterministic signals only
  and note it (don't crash the scan).

---

## 9. Demo mode & reliability (MANDATORY)

- Ship 2–3 cached `ScanResult` fixtures for well-known, clearly review-gamed products. Store under
  `lib/fixtures/`.
- `DEMO_MODE=true` (env) OR a query that matches a fixture key returns the fixture instantly.
- The live demo and the recorded video **must** use demo mode (or pre-warmed cache) so a flaky network
  can never break the moment. Keep a real live scan as the "wow" only if reliable on the venue network.

---

## 10. UI/UX spec & polish checklist (this decides the $2,500)

**Screens:** (1) Landing/hero + scan form, (2) Loading (séance), (3) Results, (4) Empty, (5) Error.

**Results page composition (top → bottom):**
1. Product header (name, source, optional image).
2. **Ghost Score gauge** (animated 0→score) + verdict banner (tier label + emoji + 1-line summary).
3. **Hauntings** — severity-colored cards with themed icons (§3.5).
4. **Signal breakdown** — small bar/meter per signal with its weight.
5. **Reviews** — list of `AnalyzedReview` cards with 👻/⚠️/✅ badge + top reason; filter by verdict.
6. **Duplicate evidence** — when duplication is high, show the near-identical reviews **side by side**
   (this is the most convincing demo moment).
7. **Share this haunting** button (OG card) — stretch.

**Polish checklist:**
- [ ] Animated gauge + verdict reveal (Framer Motion).
- [ ] Themed loading / empty / error states.
- [ ] Dark mode + ghost motif + favicon + OG image + page title.
- [ ] Mobile responsive.
- [ ] Confident, hedged microcopy (no overclaiming).
- [ ] "How it works" 3-step strip on the landing page.

---

## 11. Environment & setup

**Prereqs:** Node ≥ 20 (repo built on v24), npm. A Nimble API key. An Anthropic API key.

**Install & run:**
```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
npm run test                 # vitest
npm run lint
npm run build
```

**Env vars (`.env.example`):**
```
LLM_PROVIDER=groq           # groq | gemini | runpod | anthropic | openai  (groq/gemini are FREE)
LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=               # free, no card: https://console.groq.com/keys
GEMINI_API_KEY=             # free tier: https://aistudio.google.com/apikey
NIMBLE_API_KEY=             # free hackathon sponsor credits
NIMBLE_BASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_MODE=false             # true => cached fixtures, no keys/network needed
```

**Deploy:** `vercel` (or connect the GitHub repo in the Vercel dashboard). Set the same env vars in the
Vercel project settings.

### 11.1 Cost — everything is $0 (do not add a credit card anywhere)
- **Nimble:** free hackathon **sponsor credits** — grab the participant key from the Devpost "Updates"
  tab / kickoff email / sponsor Discord. (The Nimble prize even includes $500 in credits.)
- **LLM:** **Groq** (free, no card) or **Google Gemini** free tier. Optional: free **RunPod** sponsor
  credits to host an open model (also enters the RunPod challenge). Anthropic/OpenAI are paid + optional.
- **Hosting:** **Vercel Hobby** (free) on a free `*.vercel.app` URL. **GitHub:** free.
- **No domain purchase:** runs on the free Vercel subdomain; name.com may provide the real domain.
- **Demo mode** needs **no keys at all** — build and demo entirely on bundled fixtures.
> If any tool asks for paid billing, stop and use the free option above.

---

## 12. Git workflow & commit conventions

- Branch: work on `main` for hackathon speed (small team / solo). Optionally feature branches per phase.
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `style:`, `refactor:`.
- One logical change per commit (the plan in §14 is already commit-sized). Target **~50 commits**.
- Run `npm run lint && npm run test` before each commit. Never commit `.env*` or keys.
- Push after each phase (or each commit) so progress is visible on GitHub.

---

## 13. (reserved)

---

## 14. Phased build plan — 50 commits

> Use these **exact** commit messages. Each line is one commit. `[n]` is the global commit number.
> Acceptance = the stated outcome compiles, lints, and (where noted) tests pass.

### Phase 0 — Repo & docs  *(commit 1)*
- [1] `docs: add master build plan, README, env example, gitignore, license, agents guide`
  - Files: `BUILD_PLAN.md`, `README.md`, `.gitignore`, `.env.example`, `LICENSE`, `AGENTS.md`.
  - **(Done by initial setup — this is the first commit of the repo.)**

### Phase 1 — Project scaffolding  *(commits 2–6)*
- [2] `chore: scaffold Next.js app router + typescript + tailwind`
- [3] `chore: add shadcn/ui, framer-motion, lucide icons`
- [4] `chore: configure eslint, prettier, vitest, and npm scripts`
- [5] `chore: set up folder structure (app, components, lib, lib/engine, lib/fixtures, types)`
- [6] `feat: add env config module with zod validation and theme tokens/fonts`
  - Acceptance: `npm run dev` serves a blank themed page; `npm run test` runs (0 tests OK); lint clean.

### Phase 2 — Types & deterministic detection engine  *(commits 7–16)*
- [7] `feat: define core domain types (Review, SignalScores, Haunting, ScanResult)`  → §5
- [8] `feat: add review normalization + dedupe-id utilities`
- [9] `feat(engine): burstiness signal with unit tests`
- [10] `feat(engine): rating-distribution anomaly signal with unit tests`
- [11] `feat(engine): near-duplication signal (tf-idf cosine) with unit tests`
- [12] `feat(engine): incentivized-language signal with unit tests`
- [13] `feat(engine): sentiment-rating mismatch signal scaffold with unit tests`
- [14] `feat(engine): ghost score blend + verdict tiers with unit tests`  → §3.2/§3.3
- [15] `feat(engine): per-review verdict + reasons with unit tests`  → §3.4
- [16] `feat(engine): hauntings aggregator with unit tests`  → §3.5
  - Acceptance: engine runs on a hand-written `Review[]` sample and returns a valid `ScanResult` shape
    (LLM signals stubbed to 0 for now); all unit tests pass.

### Phase 3 — LLM signals  *(commits 17–21)*
- [17] `feat(llm): add anthropic client wrapper + model config`
- [18] `feat(llm): batched review analysis prompt returning strict json`  → §8
- [19] `feat(engine): integrate ai-likelihood, specificity, sentiment into scoring`
- [20] `feat(llm): generate human-readable haunting explanations`
- [21] `test(engine): full-engine integration test with mocked llm`
  - Acceptance: with a mocked LLM, the engine produces correct scores and hauntings end-to-end.

### Phase 4 — Nimble live crawl  *(commits 22–27)*
- [22] `feat(nimble): add nimble client wrapper + env config`
- [23] `feat(nimble): resolve query -> review source(s) via search`
- [24] `feat(nimble): extract/crawl review content for a source`
- [25] `feat(nimble): map raw nimble output -> normalized Review[]`
- [26] `feat(nimble): trustpilot + amazon source adapters behind common interface`  → §7
- [27] `test(nimble): parser tests against captured fixture payloads`
  - Acceptance: given a saved Nimble payload fixture, the parser yields a clean `Review[]`.

### Phase 5 — Demo mode & fixtures  *(commits 28–30)*
- [28] `feat: add demo fixtures (3 cached scan results)`  → §9
- [29] `feat: demo-mode toggle + fixture loader (env + query match)`
- [30] `test: snapshot scan over demo fixtures`
  - Acceptance: `DEMO_MODE=true` returns a fixture `ScanResult` instantly without network.

### Phase 6 — API route  *(commits 31–33)*
- [31] `feat(api): implement POST /api/scan orchestration (crawl -> engine -> result)`
- [32] `feat(api): zod request validation + typed error responses`
- [33] `feat(api): response caching + basic rate-limit guard`  → §6
  - Acceptance: `curl POST /api/scan` returns a valid `ScanResult` (demo mode) and a live result when keys set.

### Phase 7 — UI: result experience  *(commits 34–41)*
- [34] `feat(ui): ghost score gauge component (animated)`
- [35] `feat(ui): verdict banner component`
- [36] `feat(ui): hauntings list with severity cards`
- [37] `feat(ui): signal breakdown meters`
- [38] `feat(ui): review card with verdict badge + reasons + filter`
- [39] `feat(ui): side-by-side duplicate-review evidence view`
- [40] `feat(ui): themed loading (séance) state`
- [41] `feat(ui): results page composition + scan form wiring to /api/scan`
  - Acceptance: pasting a demo query renders a complete, animated results page.

### Phase 8 — Landing & brand polish  *(commits 42–46)*
- [42] `feat(ui): landing hero + tagline + how-it-works strip`
- [43] `feat(ui): ghost mascot, dark theme, favicon, OG image, metadata`
- [44] `feat(ui): empty + error states + mobile responsive pass`
- [45] `feat(ui): share-this-haunting button + OG share card`
- [46] `style: microcopy + spacing + animation polish pass`
  - Acceptance: the app looks finished on desktop + mobile; all states themed.

### Phase 9 — Deploy & submission  *(commits 47–50)*
- [47] `chore: add vercel config + deploy + env setup`
- [48] `docs: finalize README (architecture, nimble usage, screenshots, live link)`
- [49] `docs: add submission materials (elevator pitch, story, video script)`
- [50] `chore: lock demo mode + final env validation + production smoke test`
  - Acceptance: live URL works; demo mode verified; README + submission docs complete.

### Optional Phase 10 — Stretch (extra commits if ahead of schedule)
`feat: recently-haunted gallery` · `feat: compare two products` · `feat: public /api docs page` ·
`feat: browser-extension mock page` · `feat(llm): optional runpod-hosted classifier`.

---

## 15. Submission checklist (Devpost)

- [ ] **Project name:** ghost.reviews
- [ ] **Elevator pitch:** "Every product is haunted by reviews no human ever wrote. ghost.reviews crawls
  a product's live reviews and gives you a Ghost Score — the % likely fake — with the evidence."
- [ ] **Whole story:** problem (fake reviews everywhere) → why now (FTC banned them in 2024; LLMs made
  them dirt-cheap to mass-produce) → what it does → how (Nimble live crawl + transparent hybrid engine)
  → the domain reframe → roadmap (extension, API, brand dashboards).
- [ ] **Selected challenges:** tag **name.com Domain Roulette** AND **Nimble**.
- [ ] **Built with:** Next.js, TypeScript, Tailwind, shadcn/ui, Nimble, Anthropic Claude, Vercel.
- [ ] **Live link** + **public repo** + **screenshots** (gauge + hauntings = hero shots).
- [ ] **Video (≤ 2–3 min)** — see script beats below.
- [ ] **Submit early with margin** (deadline 10:00 AM EST June 10 — do not risk 9:59).

**Video script beats:** brand reveal → paste a real review-gamed product → live scan ("powered by
Nimble, the live web") → Ghost Score reveal → expand evidence (show the duplicate reviews side by side)
→ share → close on the FTC/market line (feasibility).

**Pitch hook (for the 3 PM top-5 pitch, if selected):** *"Every product you buy is haunted — by reviews
that were never written by a real customer. ghost.reviews finds the ghosts. The FTC banned fake reviews
in 2024, and AI made them infinitely cheap to produce. We're the detector — and we see the live web."*

---

## 16. 18-hour timeline (polish-weighted)

| Block | Hrs | Focus | Maps to phases |
|------|-----|-------|----------------|
| Setup | 0–1 | repo, keys, hello-world Nimble + LLM | 1 |
| Crawl | 1–4 | Nimble → real reviews on screen + build fixtures | 4, 5 |
| Engine | 4–7 | deterministic + LLM signals → score JSON | 2, 3 |
| UI (most time) | 7–11 | gauge, hauntings, review cards, states | 6, 7 |
| Brand | 11–13 | hero, mascot, theme, share, mobile | 8 |
| Integrate | 13–14 | end-to-end on 3 demo inputs; deploy | 9 |
| Freeze + buffer | 14–16 | HARD freeze. sleep/buffer. no new features. | — |
| Ship | 16–18 | record video, write Devpost, tag challenges, submit early | 9, 15 |

---

## 17. Risks & mitigations

- **Time** → defend the hour-14 freeze; reach an ugly end-to-end by hour 7, then polish.
- **Crawl flakiness / no reviews** → demo-mode fixtures are mandatory; never let the demo depend on the
  network.
- **"Score looks arbitrary"** → every signal shows real, concrete evidence; show the duplicate reviews
  on screen.
- **Too jokey** → hedged copy, clean professional UI. Spooky brand, serious tool.
- **Nimble endpoint uncertainty** → confirm base URL/auth/endpoints in current docs before Phase 4;
  keep the parser behind an interface so fixtures can stand in.

---

## 18. Reference summary (so this file stands alone)

- **Hackathon:** DeveloperWeek New York 2026 Hackathon. Deadline **June 10, 2026, 10:00 AM EST**.
- **Cash target:** name.com Domain Roulette **$2,500 / $1,000**. Stack: Nimble **$500 + $500 credits**.
- **Domain:** ghost.reviews. **Reframe:** ghost = ghostwritten/fake reviews.
- **name.com criteria:** creative interpretation · technical execution · polish · concept/originality ·
  depth of domain connection. They reward an **unexpected** domain made **surprisingly useful**.
- **Nimble req:** agentic app using Nimble to analyze **live** web data.
- **Core feature:** paste product → crawl live reviews (Nimble) → Ghost Score + hauntings + per-review
  verdicts (hybrid deterministic + LLM engine).

---

## 19. Progress tracker

Phase 0 — Repo & docs  ✅
- [x] 1 docs: master build plan + repo init
- [x] (extra) chore: secret-scanning pre-commit hook + hardened gitignore (tested)
- [x] (extra) docs: switch to free-tier LLM providers + $0 cost path

Phase 1 — Scaffolding  ✅ (build + tests green)
- [x] 2 next.js scaffold — Next 15.5 + React 19 + Tailwind v4 + TS (Next 16 preview was broken)
- [x] 3 shadcn/ui button + framer-motion + lucide + cn()
- [x] 4 eslint 9 + prettier + vitest (cn() test passing)
- [x] 5 folder structure (engine / nimble / llm / fixtures / types)
- [x] 6 zod env config + theme tokens

NEXT UP → Phase 2 (commits 7-16): core types + deterministic detection engine. See §14.

Phase 2 — Types & engine
- [ ] 7 core types
- [ ] 8 normalization utils
- [ ] 9 burstiness
- [ ] 10 rating anomaly
- [ ] 11 near-duplication
- [ ] 12 incentivized language
- [ ] 13 sentiment-rating mismatch
- [ ] 14 ghost score blend + tiers
- [ ] 15 per-review verdict
- [ ] 16 hauntings aggregator

Phase 3 — LLM
- [ ] 17 anthropic client
- [ ] 18 batched analysis prompt
- [ ] 19 integrate llm signals
- [ ] 20 haunting explanations
- [ ] 21 engine integration test

Phase 4 — Nimble
- [ ] 22 nimble client
- [ ] 23 source resolution
- [ ] 24 extract/crawl
- [ ] 25 normalize to Review[]
- [ ] 26 trustpilot + amazon adapters
- [ ] 27 parser tests

Phase 5 — Demo mode
- [ ] 28 fixtures
- [ ] 29 demo toggle + loader
- [ ] 30 snapshot test

Phase 6 — API
- [ ] 31 /api/scan orchestration
- [ ] 32 zod validation + errors
- [ ] 33 caching + rate-limit

Phase 7 — UI
- [ ] 34 gauge
- [ ] 35 verdict banner
- [ ] 36 hauntings list
- [ ] 37 signal meters
- [ ] 38 review card + filter
- [ ] 39 duplicate evidence view
- [ ] 40 loading state
- [ ] 41 results page + form wiring

Phase 8 — Brand polish
- [ ] 42 landing hero
- [ ] 43 mascot/theme/favicon/OG
- [ ] 44 empty/error + mobile
- [ ] 45 share button + OG card
- [ ] 46 microcopy/animation polish

Phase 9 — Deploy & submission
- [ ] 47 vercel deploy
- [ ] 48 README finalize
- [ ] 49 submission materials
- [ ] 50 demo lock + smoke test
