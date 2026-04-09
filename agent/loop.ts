import { ConvexHttpClient } from "convex/browser"
import * as kraken from "./kraken"
import * as claude from "./claude"
import * as prism from "./prism"
import { checkRisk } from "./risk"
import { registerAgent, claimAllocation, submitTradeIntent, postCheckpoint, postReputation, signHeartbeat, getAgentAddress, getWalletBalance } from "./erc8004"
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
    // Cache for fallback resilience
    await client.mutation("state:upsertValue" as any, { key: "lastPrice", value: currentPrice })
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

    // Trigger AI Advisor more easily for the hackathon final stretch
    // RSI: 40/65 allows for much more frequent AI evaluations
    const rsiTrigger = signals && (signals.rsi < 40 || signals.rsi > 65)
    // 10/20 = 50% trend shift (relaxed from 60%)
    const trendTrigger = (greenCount >= 10 && currentPaperState.holdings === 0) || (redCount >= 10 && currentPaperState.holdings > 0)
    // PROFIT TARGET: 1.25% or -1.0% stop-loss for high frequency
    const profitTrigger = pnlPct >= 0.0125 || pnlPct <= -0.01 

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

    // 5. Normalization & Execution - CRITICAL: $480 cap to pass $500 limit
    if (typeof decision.volume === 'number') {
      decision.volume = Math.min(decision.volume, 480 / currentPrice)
    } else {
      decision.volume = 480 / currentPrice
    }

    // STRICT GATING: One trade at a time for Leaderboard accuracy
    if (decision.action === "buy" && currentPaperState.holdings > 0) {
      console.log(`[${timeStr}] Skipping BUY: Already holding ${currentPaperState.holdings.toFixed(5)} BTC. Ensuring leaderboard sync.`)
      decision.action = "hold"
      decision.reason = "Position already open. Waiting for SELL trigger."
    } else if (decision.action === "sell" && currentPaperState.holdings === 0) {
      console.log(`[${timeStr}] Skipping SELL: No holdings detected.`)
      decision.action = "hold"
      decision.reason = "Nothing to sell. Waiting for BUY trigger."
    }

    let intentSig: string | undefined
    const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
    const agentId = agentIdState?.value
    
    if (agentId && (decision.action === "buy" || decision.action === "sell")) {
      console.log(`[${timeStr}] Submitting Trade Intent to RiskRouter...`)
      const intent = await submitTradeIntent(agentId, decision.action, "XBTUSD", decision.volume || 0, currentPrice)
      intentTx = intent?.hash
      intentSig = intent?.signature
    }

    // Always Generate a Signature (Heartbeat for HOLD / Evidence for Trades)
    if (agentId && !intentSig) {
      console.log(`[${timeStr}] Generating cryptographic Heartbeat signature...`)
      intentSig = await signHeartbeat(agentId, decision.action, decision.reason, timestamp) || undefined
    }

    if (decision.action === "buy" || decision.action === "sell") {
      const risk = await checkRisk(decision.volume, currentPrice)
      if (risk.allowed) {
        let result: any
        if (decision.action === "buy") {
          result = await kraken.paperBuy(currentPaperState, decision.volume)
        } else if (decision.action === "sell") {
          result = await kraken.paperSell(currentPaperState, decision.volume)
        }

        if (result?.success) {
          currentPaperState = result.state
          executed = true
          // Save new state to Cloud
          await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: currentPaperState })
          
          // Boost reputation after execution
          if (agentId) {
            postReputation(agentId, decision.confidence, { 
              action: decision.action, 
              pnlSnapshot: portfolioStatus.unrealized_pnl,
              executed: true 
            }).catch(e => console.warn(`[ERC-8004] Reputation Posting failed: ${e.message}`))
          }
        } else {
          decision.action = "hold"
          decision.reason = `execution failed: ${result?.error || 'unknown error'}`
        }
      } else {
        decision.action = "hold"
        decision.reason = `risk rejected: ${risk.reason}`
      }
    }

    // 6. Log Cycle and update dashboard
    const walletBalance = await getWalletBalance()
    await client.mutation("state:upsertValue" as any, { key: "walletBalance", value: walletBalance })

    await client.mutation("decisions:insertDecision" as any, {
      timestamp,
      action: decision.action,
      volume: decision.volume || 0,
      price: currentPrice,
      reason: decision.reason,
      confidence: decision.confidence || 0,
      executed,
      krakenResponse,
      pnlSnapshot: portfolioStatus.unrealized_pnl,
      totalEquity: portfolioStatus.current_value,
      intentTx,
      eip712Signature: intentSig,
      source: `InnovAgent-Cloud${isGated ? '-Gated' : ''}`
    })

    console.log(`[${timeStr}] ${decision.action.toUpperCase()} | Price: $${currentPrice.toFixed(2)} | PnL: $${portfolioStatus.unrealized_pnl.toFixed(2)} | Confidence: ${(decision.confidence * 100).toFixed(0)}%`)

    // 7. ERC-8004 Validation (Steve whitelisted all operators!)
    if (agentId) {
       console.log(`[${timeStr}] Initiating background Validation Checkpoint...`)
       postCheckpoint(agentId, decision, decision.confidence, portfolioStatus.unrealized_pnl).catch(e => {
         console.warn(`[ERC-8004] Background Checkpoint failed: ${e.message}`)
       })
    }

  } catch (error: any) {
    console.error(`[${timeStr}] CYCLE ERROR:`, error)
  }
}

/**
 * Startup sequence.
 */
async function main() {
  console.log("--- ACTIVATE: Hackathon Boost Mode (V3) ---")
  
  // 1. Start Heartbeat Loop immediately (Crash-Proof)
  // 1. Force Clean Slate for "Boost Mode V3" (One-time reset to sync with rejected on-chain intents)
  const resetConfig = { balance: 100000, holdings: 0, total_trades: 0, avg_price: 0 }
  await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: resetConfig })
  console.log("[Lifecycle] State hard-reset to $100,000 to clear rejected $20k trades.")

  const interval = parseInt(process.env.LOOP_INTERVAL_MS || "360000")
  console.log(`[Lifecycle] Starting 6-minute cycle loop (Interval: ${interval}ms)`)
  
  runCycle().catch(err => console.error("[Cycle Error]", err))
  setInterval(() => {
    runCycle().catch(err => console.error("[Cycle Error]", err))
  }, interval)

  // 2. Start Health Check Server
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('InnovAgent is healthy and running in Boost Mode.\n')
  }).listen(process.env.PORT || 8080)

  // 3. Perform background registration/allocation
  try {
    const agentId = await registerAgent()
    if (agentId) {
      console.log(`[Registration] Agent verified/registered: ${agentId}`)
      await claimAllocation(agentId)
    }
  } catch (err) {
    console.warn(`[Registration] Initial registration failed, will retry in background:`, err)
  }
}

main()
