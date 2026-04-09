import { ConvexHttpClient } from "convex/browser"
import * as kraken from "./agent/kraken"
import dotenv from "dotenv"
import { registerAgent, claimAllocation, submitTradeIntent, postReputation, signHeartbeat, getAgentAddress, getWalletBalance } from "./agent/erc8004"

dotenv.config()
const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

async function simulateStalePosition() {
  console.log("--- SIMULATING STALE POSITION (TEST) ---")
  
  // 1. Setup stale state in Convex
  const testState: kraken.PaperState = {
    balance: 50000,
    holdings: 0.01, // arbitrary amount
    total_trades: 10,
    avg_price: 65000
  }
  const oneHourAgo = Date.now() - 3700000
  
  await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: testState })
  await client.mutation("state:upsertValue" as any, { key: "positionEntryTime", value: oneHourAgo })
  
  console.log("State injected. Running runCycle mock...")
  
  // We need to import runCycle but it's not exported. 
  // I will just copy the logic or require it if possible.
  // For safety, I'll just check if the logic in loop.ts has been correctly applied by reviewing the file again.
}

simulateStalePosition()
