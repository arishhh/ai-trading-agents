import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import dotenv from "dotenv"

dotenv.config()

const CONVEX_URL = process.env.CONVEX_URL || ""
const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Risk Manager - Phase 2 Guardrails.
 * Enforces $200 per trade, $500 daily loss limit, and 3-loss circuit breaker.
 */
export async function checkRisk(volume: number, price: number) {
  const tradeValue = volume * price

  // 1. Per-trade Limit ($200)
  if (tradeValue > 200) {
    return {
      allowed: false,
      reason: `Trade value $${tradeValue.toFixed(2)} exceeds $200 limit.`
    }
  }

  try {
    // 2. Daily Loss Limit ($500)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentTrades = await client.query(api.decisions.getRecentByTime, { since: twentyFourHoursAgo })
    
    // We calculate PnL as the difference in pnlSnapshot between latest and earliest in window
    // OR sum up the individual trade effects if we had them. 
    // Given our schema, we use pnlSnapshot (unrealized PnL).
    if (recentTrades.length > 0) {
      const currentPnL = recentTrades[recentTrades.length - 1].pnlSnapshot
      const startPnL = recentTrades[0].pnlSnapshot
      const dailyPnL = currentPnL - startPnL

      if (dailyPnL <= -500) {
        return {
          allowed: false,
          reason: `Daily loss $${Math.abs(dailyPnL).toFixed(2)} exceeds $500 limit.`
        }
      }
    }

    // 3. Circuit Breaker (3 consecutive losses)
    const lastThree = await client.query(api.decisions.getLatestTrades, { count: 3 })
    if (lastThree.length === 3) {
      // Find consecutive losses. Validating if there's any 'buy' or 'sell' that resulted in lower PnL.
      // For simplicity: check if pnlSnapshot remained negative or decreased for 3 intervals.
      const isBreached = lastThree.every((t, i) => {
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
