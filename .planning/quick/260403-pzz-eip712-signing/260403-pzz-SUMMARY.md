---
quick_id: 260403-pzz
status: complete
commit: d91aa12
date: 2026-04-03
---

# Quick Task 260403-pzz: EIP-712 Trade Intent Signing — Summary

## What Was Done

### 1. Created `agent/erc8004.ts` (new file)
- Added `signTradeIntent(intent: TradeIntent): Promise<string>` using `ethers.Wallet.signTypedData()`.
- Domain: `{ name: 'KrakenAI Agent', version: '1', chainId: 1 }`.
- Typed structure `TradeIntent` covers: action, volume, price, confidence, timestamp.
- Uses `AGENT_PRIVATE_KEY` env var (falls back to Hardhat demo key for development).
- Also exports `getAgentAddress()` for logging the agent signer's address.

### 2. Wired into `agent/loop.ts`
- Imported `signTradeIntent` from `./erc8004`.
- Called immediately after volume normalization, before `insertDecision`.
- Logs a truncated preview of the signature each cycle.
- Passes full `eip712Signature` field to the Convex mutation.

### 3. Updated `convex/schema.ts`
- Added `eip712Signature: v.optional(v.string())` to the `decisions` table.
- `v.optional` ensures backward compatibility with existing rows that don't have the field.

### 4. Installed `ethers` package
- Added to root `package.json` (will be included in Docker build on Railway).

## Verification
- Commit `d91aa12` pushed to GitHub → Railway redeploy triggered automatically.
- After next 5-minute cycle, every decision row in Convex will include a `0x...` hex string in `eip712Signature`.
