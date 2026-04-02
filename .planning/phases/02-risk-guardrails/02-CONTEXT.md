# Context: Phase 2 - Risk Guardrails

## Goal
Implement safety boundaries before automated execution scales.

## Requirements
- [RISK-01]: `agent/risk.ts` prevents trades exceeding $200.
- [RISK-02]: Daily loss limit of $500 is correctly calculated from recent history.
- [RISK-03]: 3-loss circuit breaker successfully pauses the agent interval.

## Implementation Details
1. **Risk Manager**: Create `agent/risk.ts` with logic for all three rules.
2. **Convex Data**: `checkRisk` must query Convex for recent trade history to calculate daily loss and count consecutive losses.
3. **Integration**: `agent/loop.ts` already calls `checkRisk`. Ensure it handles the return value correctly.

## Verification Plan
- Unit tests for `checkRisk` with mock trade history.
- Integration test by forcing a large trade volume.
