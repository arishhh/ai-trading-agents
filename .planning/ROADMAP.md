# Roadmap: KrakenAI Trader

## Overview

A focused 10-day sprint to build an autonomous AI trading agent. We focus on a reliable persistent Node.js agent (Railway) using shell execution of the Kraken CLI paper engine, a reactive database layer (Convex) for instant updates, and a Next.js 14 visualizer for real-time trade tracking.

## Phases

- [ ] **Phase 1: Infrastructure + Agent Core** - From Convex schema setup to local 5-minute loop tests.
- [ ] **Phase 2: Risk Guardrails** - Build and integrate the RiskManager to ensure safe trading behavior.
- [ ] **Phase 3: Dashboard Visualizer** - Build the Next.js dark-themed UI with real-time Convex sync.
- [ ] **Phase 4: Deploy + Polish + Submission** - 24/7 on Railway, Vercel dashboard, and full hackathon submission.

## Phase Details

### Phase 1: Infrastructure + Agent Core
**Goal**: Test a full cycle locally (Kraken data → Claude decision → Convex write).
**Depends on**: Nothing
**Requirements**: ENV-01-04, CORE-01-04, STRAT-01-04
**Success Criteria**:
  1. `agent/kraken.ts` successfully parses ticker and OHLC data.
  2. Claude decision is generated based on real market data.
  3. `ConvexHttpClient` successfully inserts a trade row into the `decisions` table.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Convex schema and mutations setup.
- [ ] 01-02: `kraken.ts` and `claude.ts` core utilities development.
- [ ] 01-03: `loop.ts` integration and local environmental setup (`.env.example`).

### Phase 2: Risk Guardrails
**Goal**: Implement safety boundaries before automated execution scales.
**Depends on**: Phase 1
**Requirements**: RISK-01, RISK-02, RISK-03
**Success Criteria**:
  1. `agent/risk.ts` prevents trades exceeding $200.
  2. Daily loss limit of $500 is correctly calculated from recent history.
  3. 3-loss circuit breaker successfully pauses the agent interval.
**Plans**: 1 plan

### Phase 3: Dashboard Visualizer
**Goal**: High-fidelity terminal UI with real-time reactivity.
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria**:
  1. `useQuery` hooks react instantly to new agent decisions.
  2. Dark theme with monospace typography achieves premium feel.
  3. Manual pause/resume controls successfully update Convex state.
**Plans**: 2 plans

### Phase 4: Deploy + Polish + Submission
**Goal**: Live 24/7 deployment with paper trading running on Railway, dashboard live on Vercel, full submission on lablab.ai.
**Depends on**: Phase 2, Phase 3
**Requirements**: ENV-02, CORE-03, DEADLINE-4/12
**Success Criteria**:
  1. Railway deployment runs kraken binary build step successfully.
  2. Agent loop runs every 5 minutes on Railway with paper trades writing to Convex in real time.
  3. Vercel dashboard shows live data from Convex with zero manual refresh.
  4. README.md and SUBMISSION.md complete.
  5. Submitted on lablab.ai before April 12 with repo link, Vercel URL, and demo video.
**Plans**: 1 plan

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure + Agent Core | 0/3 | Not started | - |
| 2. Risk Guardrails | 0/1 | Not started | - |
| 3. Dashboard Visualizer | 0/2 | Not started | - |
| 4. Deploy + Polish + Submission | 0/1 | Not started | - |

---
*Roadmap defined: 2026-04-02*
