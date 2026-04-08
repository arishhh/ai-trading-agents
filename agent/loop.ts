import { ConvexHttpClient } from "convex/browser"
import * as kraken from "./kraken"
import * as claude from "./claude"
import * as prism from "./prism"
import { checkRisk } from "./risk"
import { registerAgent, claimAllocation, submitTradeIntent, getAgentAddress, getWalletBalance } from "./erc8004"
import dotenv from "dotenv"
import http from "http"

dotenv.config()

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Main agent cycle.
 */
async function runCycle() {
  const timestamp = Date.now()
  const timeStr = new Date(timestamp).toLocaleTimeString()
  
  try {
    // 0. Update heartbeat in Convex
    await client.mutation("state:upsertValue" as any, { key: "heartbeat", value: timestamp })

    // 1. Check if agent is paused
    const pausedState = await client.query("state:getValue" as any, { key: "paused" })
    if (pausedState?.value === true) {
      console.log(`[${timeStr}] Agent paused, skipping cycle.`)
      return
    }

    // 2. Cloud Persistence: Fetch Paper Trading State from Convex
    let paperStateState = await client.query("state:getValue" as any, { key: "paperTradingState" })
    // Maximize leaderboard impact: $20,000 per trade strategy. 
    let currentPaperState: kraken.PaperState

    if (!paperStateState?.value) {
      console.log(`[${timeStr}] Initializing Cloud State with $100,000 baseline...`)
      currentPaperState = {
        balance: 100000,
        holdings: 0,
        total_trades: 0,
        avg_price: 0
      }
      await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: currentPaperState })
    } else {
      currentPaperState = paperStateState.value
    }

    // 3. Fetch Market Data
    const { price: currentPrice } = await kraken.getTicker()
    const candles = await kraken.getOHLC()
    const portfolioStatus = await kraken.getPaperStatus(currentPaperState)
    const signals = await prism.getSignals()

    // 4. PRE-AI FILTER (Gated Strategy to save Quota)
    // Scaled for 20 5-minute candles (100 mins) to match previous logic
    const greenCount = candles.filter((c: any) => c.isGreen).length
    const redCount = candles.length - greenCount
    const pnlPct = currentPaperState.avg_price > 0 
      ? (currentPrice - currentPaperState.avg_price) / currentPaperState.avg_price 
      : 0

    // Trigger AI Advisor only on potential shifts
    const rsiTrigger = signals && (signals.rsi < 30 || signals.rsi > 75)
    // 12/20 = 60%, same as 6/10
    const trendTrigger = (greenCount >= 12 && currentPaperState.holdings === 0) || (redCount >= 12 && currentPaperState.holdings > 0)
    const profitTrigger = pnlPct >= 0.025 || pnlPct <= -0.015

    let decision: any
    let isGated = false
    let executed = false
    let krakenResponse: any = null
    let intentTx: string | undefined = undefined

    if (trendTrigger || rsiTrigger || profitTrigger) {
      console.log(`[${timeStr}] Gating Triggered: ${trendTrigger ? 'Trend Shift' : rsiTrigger ? 'RSI Extreme' : 'PnL Limit'}. consulting AI...`)
      
      const marketData: claude.MarketData = {
        currentPrice,
        candles,
        portfolioValue: portfolioStatus.current_value,
        unrealizedPnl: portfolioStatus.unrealized_pnl,
        totalTrades: portfolioStatus.total_trades,
        avgEntryPrice: currentPaperState.avg_price,
        signals
      }
      decision = await claude.makeDecision(marketData)
    } else {
      isGated = true
      decision = {
        action: 'hold',
        volume: 0,
        reason: `[Gated] Trend stable (G:${greenCount}/R:${redCount}), RSI:${signals?.rsi || 'N/A'}, PnL:${(pnlPct * 100).toFixed(2)}%`,
        confidence: 0.5
      }
    }

    // 5. Normalization & Execution
    if (typeof decision.volume === 'number') {
      decision.volume = Math.min(decision.volume, 20000 / currentPrice)
    } else {
      decision.volume = 20000 / currentPrice
    }

    const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
    const agentId = agentIdState?.value
    
    if (agentId && (decision.action === "buy" || decision.action === "sell")) {
      console.log(`[${timeStr}] Submitting Trade Intent to RiskRouter...`)
      intentTx = await submitTradeIntent(agentId, decision.action, "XBTUSD", decision.volume || 0, currentPrice) || undefined
    }

    if (decision.action === "buy" || decision.action === "sell") {
      const risk = await checkRisk(decision.volume, currentPrice)
      if (risk.allowed) {
        if (decision.action === "buy") {
          currentPaperState = await kraken.paperBuy(currentPaperState, decision.volume)
          executed = true
        } else if (decision.action === "sell") {
          currentPaperState = await kraken.paperSell(currentPaperState, decision.volume)
          executed = true
        }
        // Save new state to Cloud
        await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: currentPaperState })
      } else {
        decision.action = "hold"
        decision.reason = `risk rejected: ${risk.reason}`
      }
    }

    // 6. Log Cycle and update dashboard
    const balance = await getWalletBalance()
    await client.mutation("state:upsertValue" as any, { key: "walletBalance", value: balance })

    await client.mutation("decisions:insertDecision" as any, {
      timestamp,
      action: decision.action,
      volume: decision.volume || 0,
      price: currentPrice,
      reason: decision.reason,
      confidence: decision.confidence || 0,
      executed,
      krakenResponse, // Always pass (even if null)
      pnlSnapshot: portfolioStatus.unrealized_pnl,
      totalEquity: portfolioStatus.current_value,
      intentTx,
      source: `InnovAgent-Cloud${isGated ? '-Gated' : ''}`
    })

    console.log(`[${timeStr}] ${decision.action.toUpperCase()} | Price: $${currentPrice.toFixed(2)} | PnL: $${portfolioStatus.unrealized_pnl.toFixed(2)} | Confidence: ${(decision.confidence * 100).toFixed(0)}%`)

  } catch (error: any) {
    console.error(`[${timeStr}] CYCLE ERROR:`, error)
  }
}

/**
 * Startup sequence.
 */
async function main() {
  console.log("--- Starting Hybrid Gated InnovAgent (V2) ---")
  const agentId = await registerAgent()
  if (agentId) await claimAllocation(agentId)

  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('InnovAgent is healthy and running.\n')
  }).listen(process.env.PORT || 8080)

  const interval = parseInt(process.env.LOOP_INTERVAL_MS || "600000")
  runCycle().catch(err => console.error(err))
  setInterval(() => {
    runCycle().catch(err => console.error(err))
  }, interval)
}

main()
