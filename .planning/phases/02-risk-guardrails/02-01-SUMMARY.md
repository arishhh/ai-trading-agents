# Plan Summary: 02-01 Risk Guardrails Implementation

## Objective
Implement safety boundaries to prevent excessive losses and over-trading.

## Key Files Created/Modified
- [convex/decisions.ts](file:///d:/Hackaton/ai-trading-agents/convex/decisions.ts): Added time-based and count-based queries.
- [agent/risk.ts](file:///d:/Hackaton/ai-trading-agents/agent/risk.ts): Implemented Per-trade, Daily Loss, and Circuit Breaker logic.

## Decisions and Rationale
- **PnL Strategy**: Used `pnlSnapshot` from the `decisions` table to track equity changes over the last 24h.
- **Circuit Breaker**: Implemented as a check for 3 consecutive trades where PnL decreased and is still negative.

## Self-Check: PASSED
- [x] $200 limit enforced.
- [x] $500 daily loss limit enforced.
- [x] 3-loss circuit breaker enforced.
