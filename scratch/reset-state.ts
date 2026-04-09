import { ConvexHttpClient } from "convex/browser"
import dotenv from "dotenv"

dotenv.config()

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

async function resetState() {
  console.log("Resetting Paper Trading State to clear out-of-sync $20k trades...")
  const newState = {
    balance: 100000,
    holdings: 0,
    total_trades: 0,
    avg_price: 0
  }
  await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: newState })
  console.log("SUCCESS: State reset to $100,000 baseline.")
}

resetState()
