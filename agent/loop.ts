import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import * as kraken from "./kraken"
import * as claude from "./claude"
import { checkRisk } from "./risk"
import dotenv from "dotenv"

dotenv.config()

const CONVEX_URL = process.env.CONVEX_URL || ""
if (!CONVEX_URL) {
  console.error("FATAL: CONVEX_URL is not set in environment variables.")
} else {
  const maskedUrl = CONVEX_URL.replace(/(.{8}).+(.{4})/, "$1...$2")
  console.log(`Convex Client Initialized: ${maskedUrl}`)
}

const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Main agent cycle.
 */
async function runCycle() {
  const timestamp = Date.now()
  const timeStr = new Date(timestamp).toLocaleTimeString()
  
  try {
    // 1. Check if agent is paused in Convex
    const pausedState = await client.query(api.state.getValue, { key: "paused" })
    if (pausedState?.value === true) {
      console.log(`[${timeStr}] Agent paused, skipping cycle.`)
      return
    }

    // 2. Fetch data from Kraken
    console.log(`[${timeStr}] Fetching market data...`)
    const { price: currentPrice } = await kraken.getTicker()
    const candles = await kraken.getOHLC()
    const portfolioStatus = await kraken.getPaperStatus()

    const marketData: claude.MarketData = {
      currentPrice,
      candles,
      portfolioValue: portfolioStatus.current_value,
      unrealizedPnl: portfolioStatus.unrealized_pnl,
      totalTrades: portfolioStatus.total_trades
    }

    // 3. Get AI decision
    const decision = await claude.makeDecision(marketData)
    console.log(`[${timeStr}] AI Decision: ${decision.action.toUpperCase()} | Reason: ${decision.reason}`)

    let executed = false
    let krakenResponse: any = null

    // 4. Execution logic with risk check
    if (decision.action === "buy" || decision.action === "sell") {
      const risk = await checkRisk(decision.volume, currentPrice)
      
      if (risk.allowed) {
        if (decision.action === "buy") {
          krakenResponse = await kraken.paperBuy(decision.volume)
          executed = true
        } else if (decision.action === "sell") {
          krakenResponse = await kraken.paperSell(decision.volume)
          executed = true
        }
      } else {
        console.warn(`[${timeStr}] Risk Rejected: ${risk.reason}`)
        decision.action = "hold"
        decision.reason = `risk rejected: ${risk.reason}`
      }
    }

    // 5. Log decision and final state to Convex
    const finalStatus = await kraken.getPaperStatus()
    await client.mutation(api.decisions.insertDecision, {
      timestamp,
      action: decision.action,
      volume: decision.volume || 0,
      price: currentPrice,
      reason: decision.reason,
      confidence: decision.confidence || 0,
      executed,
      krakenResponse,
      pnlSnapshot: finalStatus.unrealized_pnl
    })

    console.log(`[${timeStr}] ${decision.action.toUpperCase()} | Price: $${currentPrice.toFixed(2)} | Confidence: ${(decision.confidence * 100).toFixed(0)}% | PnL: $${finalStatus.unrealized_pnl.toFixed(2)}`)

  } catch (error: any) {
    console.error(`[${timeStr}] CYCLE ERROR:`, error)
    
    // Log error row to Convex
    try {
      await client.mutation(api.decisions.insertDecision, {
        timestamp,
        action: "error",
        volume: 0,
        price: 0,
        reason: error.message || String(error),
        confidence: 0,
        executed: false,
        krakenResponse: null,
        pnlSnapshot: 0
      })
    } catch (dbError: any) {
      console.error("Critical: Failed to log error to Convex", dbError)
    }
  }
}

/**
 * Startup sequence.
 */
async function main() {
  console.log("--- Starting KrakenAI Trader Agent ---")
  
  if (process.env.PAPER_MODE === "true") {
    console.log("Initializing Paper Trading account...")
    try {
      await kraken.initPaper()
    } catch (err: any) {
      console.warn("Paper account initialization note:", err.message || err)
    }
  }

  // Set startup heartbeat
  try {
    await client.mutation(api.state.upsertValue, {
      key: "agentStarted",
      value: Date.now()
    })
  } catch (error: any) {
    console.error("Startup heartbeat failed:", error)
    // If it's a function not found error, it means we might need a deploy
    if (String(error).includes("Function not found")) {
      console.error("TIP: Ensure your Convex functions are deployed to the current CONVEX_URL.")
    }
  }

  // Start the 5-minute loop
  const interval = parseInt(process.env.LOOP_INTERVAL_MS || "300000")
  console.log(`Loop started - taking trades every ${interval / 1000} seconds.`)
  
  // Initial run
  runCycle().catch(err => console.error("Initial cycle failed:", err))
  
  // Interval run
  setInterval(() => {
    runCycle().catch(err => console.error("Cycle failed:", err))
  }, interval)
}

main()
