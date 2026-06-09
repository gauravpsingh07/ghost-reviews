# Agent instructions (Codex / Claude / any coding agent)

**Read [`BUILD_PLAN.md`](BUILD_PLAN.md) in full before doing anything.** It is the single source of
truth: full product spec, architecture, data types, API contract, and a phased commit-by-commit plan.

## How to work on this repo

1. Open `BUILD_PLAN.md`. Find the **Progress tracker (§19)** — the first unchecked item is your next task.
2. Implement that one commit's scope only. Specs for each piece are in §3 (engine), §5 (types),
   §6 (API), §7 (Nimble), §8 (LLM), §10 (UI).
3. Use the **exact commit message** from §14 for that item.
4. Before committing: `npm run lint && npm run test`. Then commit and check the box in §19.
5. Push after each phase (or each commit). Target ~50 commits total.

## Hard rules

- **Never commit secrets.** `.env*` is gitignored; `.env.example` is the template.
- Keep the detection engine (`lib/engine/`) **pure and unit-tested** — no network calls inside it.
- Every detection signal must produce **real, human-readable evidence** — never fabricate findings.
- Demo mode (`DEMO_MODE=true` or a fixture-matching query) must return a result with **no network**.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `style:`, `refactor:`).
- Stack is committed (Next.js + TS + Tailwind + shadcn/ui). Do not swap frameworks without updating
  `BUILD_PLAN.md` first.

## Secret protection (already set up — keep it working)

This repo blocks secrets at commit time:
- `.gitignore` ignores all `.env*` (except `.env.example`) plus key/credential files.
- A pre-commit hook at `.githooks/pre-commit` rejects any staged env/key file and any content that
  looks like an API key, access token, or private key. It is enabled via `core.hooksPath`.
- GitHub secret-scanning push protection is enabled on the remote as a server-side backstop.

**After a fresh clone, enable the hook once:**
```
git config core.hooksPath .githooks
```
Rules: real keys live ONLY in `.env.local` (gitignored). Never put real keys in tracked files, docs,
or chat. To bypass the hook for a genuine false positive: `git commit --no-verify` (use rarely).

## Context (one paragraph)

ghost.reviews is a hackathon project for DeveloperWeek New York 2026, targeting the name.com
"Domain Roulette" $2,500 cash prize + the Nimble live-web prize. Deadline: **June 10, 2026, 10:00 AM
EST**. It detects fake/ghostwritten product reviews by crawling the live web (Nimble) and scoring them
with a transparent hybrid engine. Polish and a flawless demo matter more than technical breadth.
