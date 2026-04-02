# Phase 01: Infrastructure + Agent Core - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Initialize the complete project foundation (Step 1), define the Convex reactive schema and mutations (Step 2), implement a robust Kraken CLI shell wrapper with pair-agnostic parsing (Step 3), integrate Claude via Groq (Step 4), and build the 24/7 agent loop (Step 5).

</domain>

<decisions>
## Implementation Decisions

### Project Infrastructure
- **D-01:** Tooling: Use `tsx` for running TypeScript agent code and `npx convex dev/deploy` for backend.
- **D-02:** Dependencies: `groq-sdk`, `convex`, `tsx`, `typescript`, `@types/node`, `dotenv`.
- **D-03:** Folder Structure: `agent/` (logic), `convex/` (backend), `dashboard/` (frontend), root for configs.
- **D-04:** Build Process: `npm run setup:kraken` for CLI binary, followed by `convex deploy` and `next build`.

### Convex Backend
- **D-05:** Schema: Two tables: `decisions` (full trade/decision log) and `state` (agent heartbeat/control).
- **D-06:** Mutations: `insertDecision`, `upsertValue`. Queries: `getRecent` (limit 50), `getValue`.

### Kraken CLI Shell Wrapper
- **D-07:** Shell Mode: Uses `child_process.exec` wrapped in a Promise (`util.promisify`).
- **D-08:** Logic: All calls use `kraken <command> -o json`.
- **D-09:** Pair-Agnostic Parsing: Always use `Object.values(result)[0]` instead of specific pair names (e.g., `XXBTZUSD`) to ensure robustness.
- **D-10:** Error Handling: Throw Node error if `result.error` exists in parsed JSON.

### AI Trading Brain (Claude via Groq)
- **D-11:** Provider: Use **Groq** with `llama-3.1-70b-versatile` model instead of direct Anthropic.
- **D-12:** Strategy: Conservative trend-following (6/10 hourly candles).
- **D-13:** Response Format: Strict JSON only; parser must strip markdown fences.

### Agent Loop (loop.ts)
- **D-14:** Interval: 5 minutes (300000ms).
- **D-15:** State Check: Check Convex `state.paused` before every cycle.
- **D-16:** Error Handling: Full cycle try/catch; errors logged to Convex `decisions` table (action='error').
- **D-17:** Paper Mode: Initialize once at startup (`kraken paper init`) if `PAPER_MODE=true`.

</decisions>

<canonical_refs>
## Canonical References
- `ROADMAP.md` — Phase 1 definition.
- `REQUIREMENTS.md` — Core requirements for Agent and Data tiers.
- `PROJECT.md` — Monorepo structure and Convex/Railway strategy.
</canonical_refs>

---
*Created 2026-04-02 following total phase specification from user.*
