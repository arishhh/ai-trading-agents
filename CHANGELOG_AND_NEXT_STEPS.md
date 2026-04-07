# Project Update: Risk Management & Dashboard Enhancements

This document summarizes the recent mission-critical fixes and UI enhancements implemented in the InnovAgent project, as well as the proposed next steps for the engineering team.

---

## 🚀 Recent Implementations

### 1. Daily Loss Reset Logic (Fixed)
The agent previously used a rolling 24-hour window for loss calculation, which caused "stuck" states even after a new day began.
- **Change**: Replaced rolling window with a **Calendar Day Reset (UTC Midnight)**.
- **Mechanism**: Utilizes the Convex `state` table to track `lastReset` (date string) and `todayLosses` (current day's total).
- **Impact**: Trading resume automatically at 00:00 UTC regardless of the previous day's performance, while still enforcing a strict $500 daily safety cap.

### 2. High-Fidelity Terminal Dashboard
The frontend has been transformed into a reactive "Command Center":
- **Kraken Real-time Liquidity Chart**: Integrated an advanced TradingView widget specifically synced to the **Kraken API** (KRAKEN:BTCUSD) to eliminate price discrepancies.
- **Account Equity Tracking**: New live card showing "Total Equity" (Starting Balance + Unrealized PnL).
- **Daily Risk Gauge**: A visual progress bar for the $500 daily limit, which changes color as the agent approaches the risk threshold.
- **Neural Stream Polish**: 
    - Added **AI Confidence Meters** for every decision.
    - Improved reasoning text formatting.
    - Integrated **Security Protocol** documentation in the sidebar.

---

## 💡 Backend Discussion Points (Next Steps)

These are technical refinements suggested for the next engineering cycle to further harden the system and improve the UI's data depth:

1.  **Equity Snapshots**:
    - *Proposed Change*: Modify `decisions:insertDecision` mutation to capture and log the `totalAccountBalance` obtained from `kraken.getPaperStatus()`.
    - *Goal*: Allow the dashboard to show a true historical line chart of account growth instead of just a real-time snapshot.

2.  **Agent Heartbeat System**:
    - *Proposed Change*: Implement a background pulse that updates a `last_seen` timestamp in the `state` table every 60 seconds.
    - *Goal*: Show a "Live/Offline" indicator with high precision even when the agent is between trading cycles.

3.  **Advanced Performance Queries**:
    - *Proposed Change*: Add a Convex query to pre-calculate the **Sharpe Ratio** and **Drawdown** directly in the backend.
    - *Goal*: Offload heavy math from the React frontend to the Edge-backend for smoother dashboard performance.

4.  **WebSocket Integration**:
    - *Proposed Change*: Shift from 10-minute polling to a Kraken Private WebSocket for real-time portfolio balance updates.
    - *Goal*: Instantaneous balance updates without waiting for the next agent cycle.

---

**InnovAgent is now safer, more visual, and ready for full-scale autonomous paper trading testing.**
