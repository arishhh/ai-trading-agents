# KrakenAI Trader

## What This Is

An autonomous AI crypto trading agent built for the lablab.ai AI Trading Agents hackathon. It executes paper trades on Kraken via its CLI shell, driven by Anthropic's Claude API, and features a real-time Next.js 14 dashboard powered by Convex for instant synchronization.

## Core Value

Provide a transparent, AI-driven autonomous paper trading loop that demonstrates quantifiable performance through execution on Railway by the April 12 deadline.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Agent Loop**: Robust `setInterval` Node.js process deployed on Railway.app running 24/7.
- [ ] **Kraken CLI Shell Wrapper**: Utility (`agent/kraken.ts`) wrapping `child_process.exec` calls to the `kraken` binary with JSON parsing.
- [ ] **Convex Database**: Reactive backend with `decisions` and `state` tables for real-time agent-to-dashboard sync.
- [ ] **AI Decision Engine**: Claude 3.5 Sonnet integration with conservative trend-following strategy logic.
- [ ] **Risk Guardrails**: Automated risk manager (`agent/risk.ts`) to prevent catastrophic losses.
- [ ] **Next.js Dashboard**: Real-time frontend (Vercel) using `useQuery` hooks to display performance and trade reasoning.
- [ ] **Paper Execution**: Dedicated focus on the `kraken paper` engine for reliable evaluation.

### Out of Scope

- **MCP Tools (Deployed)**: MCP tools are for development only; deployed agent uses shell CLI.
- **Smart Contracts**: No ERC-8004 or on-chain execution for v1.
- **Multi-Asset**: Focused exclusively on BTC/USD for the hackathon.
- **Live Trading**: Real-money trading is out of scope due to regional limitations.

## Context

- **Hackathon**: lablab.ai AI Trading Agents (Deadline: April 12, 2026).
- **Execution Layer**: Kraken CLI binary must be installed on Railway via `package.json` setup script.
- **Data Reactive Layer**: Convex handles all state; Railway agent uses `ConvexHttpClient` for mutations.
- **Architecture**: Monorepo with `agent/`, `convex/`, and `dashboard/` directories.

## Folder Structure

```
ai-trading-agents/
├── agent/
│   ├── loop.ts          — main agent loop with setInterval
│   ├── kraken.ts        — shell exec wrapper for kraken binary
│   ├── claude.ts        — Anthropic API calls and prompt
│   └── risk.ts          — RiskManager class
├── convex/
│   ├── schema.ts        — decisions and state table definitions
│   ├── decisions.ts     — insert mutation + getRecent query
│   └── state.ts         — get and upsert mutations
├── dashboard/           — Next.js 14 app
│   ├── app/
│   ├── components/
│   └── lib/
├── .env.example
├── package.json
└── README.md
```

## Constraints

- **Timeline**: 10 days until April 12 deadline.
- **Execution**: Must use Kraken CLI shell commands per hackathon rules.
- **Infrastructure**: Railway (Agent Server) + Vercel (Dashboard) + Convex (Reactive DB).
- **Environment**: Limited to paper trading mode (`kraken paper`).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Convex** | Reactivity for instant dashboard updates without polling; easy Node.js integration. | — Pending |
| **Railway Shell CLI** | Hackathon requirement for Kraken binary execution; persistent 24/7 environment. | — Pending |
| **Paper-Only Focus** | Strategic decision to focus on a robust paper trading demo due to geographic trading restrictions. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-02 after geographic/paper-trading calibration*
