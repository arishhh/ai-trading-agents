---
quick_id: 260403-pzz
slug: eip712-signing
date: 2026-04-03
---

# Quick Task 260403-pzz: EIP-712 Trade Intent Signing

## Objective
Add cryptographic auditability to every AI trade decision by signing it with EIP-712 typed data
(ethers v6). Store the resulting `0x...` hex signature in Convex alongside each decision row.

## Tasks

### Task 1: Create agent/erc8004.ts
- **Files:** `agent/erc8004.ts` [NEW]
- **Action:** Create the module with `signTradeIntent(intent)` using `ethers.Wallet.signTypedData()`.
  Domain: `{ name: 'KrakenAI Agent', version: '1', chainId: 1 }`. Types: `TradeIntent` with action, volume, price, confidence, timestamp.
- **Verify:** Function exists and returns a `0x`-prefixed 132-char hex string.
- **Done:** `agent/erc8004.ts` committed.

### Task 2: Wire into agent/loop.ts
- **Files:** `agent/loop.ts` [MODIFY]
- **Action:** Import `signTradeIntent` from `./erc8004`. Call it after volume normalization, before `insertDecision`. Pass result as `eip712Signature`.
- **Verify:** `loop.ts` imports erc8004, calls sign, passes field to insertDecision.
- **Done:** `agent/loop.ts` committed.

### Task 3: Update convex/schema.ts
- **Files:** `convex/schema.ts` [MODIFY]
- **Action:** Add `eip712Signature: v.optional(v.string())` to decisions table.
- **Verify:** Field present in schema.
- **Done:** Schema committed and deployed.
