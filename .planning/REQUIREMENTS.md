# Requirements: KrakenAI Trader

**Defined:** 2026-04-02
**Core Value:** Provide a transparent, AI-driven autonomous trading loop that demonstrates quantifiable PnL through real market data in the paper trading engine.

## v1 Requirements

### Environment & Setup
- [ ] **ENV-01**: Convex backend initialized with `decisions` and `state` tables.
- [ ] **ENV-02**: Railway Node.js environment configured with `kraken-cli` binary installation script.
- [ ] **ENV-03**: Environment Variables (Railway): `ANTHROPIC_API_KEY`, `CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `PAPER_MODE=true`.
- [ ] **ENV-04**: Environment Variables (Vercel): `NEXT_PUBLIC_CONVEX_URL`.

### Agent Core
- [ ] **CORE-01**: `agent/kraken.ts` successfully shell-execs `kraken ticker BTCUSD -o json`.
- [ ] **CORE-02**: `agent/kraken.ts` handles JSON parsing and error detection from the CLI.
- [ ] **CORE-03**: `agent/loop.ts` runs 24/7 on a 5-minute interval using `setInterval`.
- [ ] **CORE-04**: Agent initializes paper dev account with `kraken paper init --balance 10000`.

### Trading Strategy & AI
- [ ] **STRAT-01**: `agent/claude.ts` sends last 10 OHLC candles to Claude 3.5 Sonnet.
- [ ] **STRAT-02**: Conservative trend-following logic: BUY if >= 6 candles closed higher AND current price > 10-candle average.
- [ ] **STRAT-03**: SELL if holding BTC AND >= 6 candles closed lower.
- [ ] **STRAT-04**: Claude returns structured JSON for the Agent to process.

### Risk & Safety
- [ ] **RISK-01**: `agent/risk.ts` enforces $200 per trade maximum.
- [ ] **RISK-02**: Daily loss limit of $500 is monitored via Convex history.
- [ ] **RISK-03**: Circuit breaker pauses trading after 3 consecutive losses.

### Data Reactive Bridge
- [ ] **DB-01**: Core `decisions` table: `timestamp`, `action`, `volume`, `price`, `reason`, `confidence`, `executed`, `krakenResponse`, `pnlSnapshot`.
- [ ] **DB-02**: `state` table for agent health and rate limit delays.
- [ ] **DB-03**: Agent writes mutations via `ConvexHttpClient`.

### Dashboard Visualizer
- [ ] **DASH-01**: Real-time update of PnL and trade feed using `useQuery`.
- [ ] **DASH-02**: Dark terminal aesthetic with monospace typography and shadcn/ui.
- [ ] **DASH-03**: Interactive pause/resume controls that update the Convex `state` table.

## Out of Scope
| Feature | Reason |
|---------|--------|
| ERC-8004 Smart Contracts | Hackathon focus is on AI Agent + Kraken CLI performance. |
| Live Trading | Real-money trading is out of scope due to regional limitations. |
| Multiple Trading Pairs | Focused exclusively on BTC/USD for the 10-day sprint. |

## Traceability
| Requirement | Phase | Status |
|-------------|-------|--------|
| ENV-01-04 | Phase 1 | Pending |
| CORE-01-04 | Phase 1 | Pending |
| STRAT-01-04 | Phase 1 | Pending |
| RISK-01-03 | Phase 2 | Pending |
| DASH-01-03 | Phase 3 | Pending |
| DEADLINE-4/12 | Phase 4 | Pending |

---
*Requirements defined: 2026-04-02*
