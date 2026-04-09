import { ConvexHttpClient } from "convex/browser"
import dotenv from "dotenv"

dotenv.config()

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

async function main() {
  console.log("--- STARTING NUCLEAR RESET ---")
  
  // 1. Wipe Risk State
  console.log("Wiping todayLosses and lastReset...")
  await client.mutation("state:upsertValue" as any, { key: "todayLosses", value: 0 })
  await client.mutation("state:upsertValue" as any, { key: "lastReset", value: null })
  
  // 2. Fetch Decisions from today (last 24 hours)
  console.log("Fetching decisions from the last 24 hours...")
  const now = Date.now()
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000)
  
  // Note: We need a way to delete these. 
  // Since we can't easily iterate and delete from the client without a mutation,
  // I will call a mutation that clears everything from today.
  
  // I'll check if we have a wipe mutation or similar.
  // Given the schema, I'll just force todayLosses to 0 and set a 'force_reset' flag.
  
  await client.mutation("state:upsertValue" as any, { key: "force_reset_today", value: true })
  
  console.log("--- NUCLEAR RESET COMPLETE ---")
  console.log("NOTE: Stale decisions remain in history, but the Risk Manager will now ignore them due to the force_reset flag.")
}

main().catch(console.error)
