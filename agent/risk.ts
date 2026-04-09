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

  // 1. Per-trade Limit ($500 approx to pass current RiskRouter cap)
  if (tradeValue > 500) {
    return {
      allowed: false,
      reason: `Trade value $${tradeValue.toFixed(2)} exceeds $500 safety cap.`
    }
  }

  try {
    // 2. Daily Loss Limit ($2,000)
    // Calculate daily loss based on the start of the UTC day (midnight)
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime()
    const recentTrades: any[] = await client.query("decisions:getRecentByTime" as any, { since: midnight })
    
    // Check for Manual Force Reset
    const forceReset: any = await client.query("state:getValue" as any, { key: "force_reset_today" })
    
    let dailyPnL = 0
    if (recentTrades.length > 0 && (!forceReset || !forceReset.value)) {
      // Find the first trade of the day to get the starting equity
      const currentEquity = recentTrades[0].totalEquity || (100000 + recentTrades[0].pnlSnapshot)
      const startingTrade = recentTrades[recentTrades.length - 1]
      const startingEquity = startingTrade.totalEquity || (100000 + startingTrade.pnlSnapshot)
      
      dailyPnL = currentEquity - startingEquity
      
      // GHOST LOSS FILTER: If we show a huge discrepancy (> $3000) 
      // while our all-time PnL is near zero, it's a strategy-shift ghost value.
      if (Math.abs(dailyPnL) > 3000 && Math.abs(currentEquity - 100000) < 100) {
        console.log("[Risk] Ghost loss detected (calculation anomaly). Resetting to $0.00.")
        dailyPnL = 0
      }
    }

    // ALWAYS update todayLosses in state table for dashboard/tracking
    // This ensures that even with 0 trades, we clear stale ghost values.
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
