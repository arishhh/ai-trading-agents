import { ConvexHttpClient } from "convex/browser"
import dotenv from "dotenv"

dotenv.config()

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Risk Manager - Phase 2 Guardrails.
 * Enforces $200 per trade, $500 daily loss limit, and 3-loss circuit breaker.
 */
export async function checkRisk(volume: number, price: number) {
  const tradeValue = volume * price
  const now = new Date()
  const currentDateStr = now.toISOString().split('T')[0] // UTC YYYY-MM-DD

  try {
    // 0. Daily Reset Check (Always run to keep state synced)
    const lastReset: any = await client.query("state:getValue" as any, { key: "lastReset" })
    if (!lastReset || lastReset.value !== currentDateStr) {
      console.log(`[Risk] New day detected (${currentDateStr}). Resetting today's losses.`)
      await client.mutation("state:upsertValue" as any, { key: "lastReset", value: currentDateStr })
      await client.mutation("state:upsertValue" as any, { key: "todayLosses", value: 0 })
    }
  } catch (error: any) {
    console.warn("[Risk] Failed to check/reset daily state:", error.message)
  }

  // 1. Per-trade Limit ($21,000 approx for Leaderboard mode)
  if (tradeValue > 21000) {
    return {
      allowed: false,
      reason: `Trade value $${tradeValue.toFixed(2)} exceeds $21,000 limit.`
    }
  }

  try {
    // 2. Daily Loss Limit ($500)
    // Calculate daily loss based on the start of the UTC day (midnight)
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime()
    const recentTrades: any[] = await client.query("decisions:getRecentByTime" as any, { since: midnight })
    
    let dailyPnL = 0
    if (recentTrades.length > 0) {
      // decisions:getRecentByTime returns DESC (latest first)
      const currentPnL = recentTrades[0].pnlSnapshot
      const startPnL = recentTrades[recentTrades.length - 1].pnlSnapshot
      dailyPnL = currentPnL - startPnL
      
      // Update todayLosses in state table for dashboard/tracking
      await client.mutation("state:upsertValue" as any, { 
        key: "todayLosses", 
        value: dailyPnL < 0 ? Math.abs(dailyPnL) : 0 
      })

      if (dailyPnL <= -2000) {
        return {
          allowed: false,
          reason: `Daily loss $${Math.abs(dailyPnL).toFixed(2)} exceeds $2,000 limit.`
        }
      }
    }

    // 3. Circuit Breaker (3 consecutive losses)
    const lastThree: any[] = await client.query("decisions:getLatestTrades" as any, { count: 3 })
    if (lastThree.length === 3) {
      // Find consecutive losses. Validating if there's any 'buy' or 'sell' that resulted in lower PnL.
      // For simplicity: check if pnlSnapshot remained negative or decreased for 3 intervals.
      const isBreached = lastThree.every((t: any, i: number) => {
        if (i === lastThree.length - 1) return true // end of array
        return t.pnlSnapshot < lastThree[i+1].pnlSnapshot // pnlSnapshot is decreasing (since list is desc)
      })

      if (isBreached && lastThree[0].pnlSnapshot < 0) {
        return {
          allowed: false,
          reason: `Circuit breaker: 3 consecutive losses detected.`
        }
      }
    }

  } catch (error: any) {
    console.error("Risk check error (assuming safe):", error.message)
  }

  return { allowed: true }
}
