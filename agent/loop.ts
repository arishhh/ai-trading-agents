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
    // 0. Update heartbeat in Convex
    await client.mutation("state:upsertValue" as any, { 
      key: "heartbeat", 
      value: timestamp 
    })

    // 1. Check if agent is paused in Convex
    const pausedState = await client.query("state:getValue" as any, { key: "paused" })
    if (pausedState?.value === true) {
      console.log(`[${timeStr}] Agent paused, skipping cycle.`)
      return
    }

    // 2. Fetch data from Kraken
    console.log(`[${timeStr}] Fetching market data...`)
    const { price: currentPrice } = await kraken.getTicker()
    const candles = await kraken.getOHLC()
    const portfolioStatus = await kraken.getPaperStatus()
    const signals = await prism.getSignals()

    const marketData: claude.MarketData = {
      currentPrice,
      candles,
      portfolioValue: portfolioStatus.current_value,
      unrealizedPnl: portfolioStatus.unrealized_pnl,
      totalTrades: portfolioStatus.total_trades,
      signals
    }

    // 2.5 Market Sensitivity Check (Gas/Quota Optimization)
    const lastPriceState = await client.query("state:getValue" as any, { key: "lastPrice" })
    const lastPrice = lastPriceState?.value || currentPrice
    const priceChangePct = Math.abs((currentPrice - lastPrice) / lastPrice) * 100
    
    // threshold of 0.05% change to trigger AI analysis, otherwise default to HOLD
    let decision: any
    if (priceChangePct < 0.05 && portfolioStatus.total_trades > 0) {
      console.log(`[${timeStr}] Market is flat (< 0.05% change). Skipping AI call to save quota.`)
      decision = {
        action: 'hold',
        volume: 0,
        reason: 'market stability; caching previous sentiment',
        confidence: 0.5
      }
    } else {
      // 3. Get AI decision
      decision = await claude.makeDecision(marketData)
      console.log(`[${timeStr}] AI Decision: ${decision.action.toUpperCase()} | Reason: ${decision.reason}`)
      
      // Update last price in Convex only when we actually do a full cycle
      await client.mutation("state:upsertValue" as any, { key: "lastPrice", value: currentPrice })
    }
    
    // Normalize volume to prevent math expression errors and hard cap at $200
    if (typeof decision.volume === 'number') {
      decision.volume = Math.min(decision.volume, 200 / currentPrice)
    } else {
      decision.volume = 200 / currentPrice
    }

    // 3.5 ERC-8004: Submit Trade Intent to RiskRouter
    const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
    const agentId = agentIdState?.value
    
    let intentTx: string | undefined = undefined
    if (agentId && (decision.action === "buy" || decision.action === "sell")) {
      console.log(`[${timeStr}] Submitting Trade Intent to RiskRouter for Agent ${agentId}...`)
      intentTx = await submitTradeIntent(
        agentId,
        decision.action,
        "XBTUSD",
        decision.volume || 0,
        currentPrice
      ) || undefined
    }

    // EIP-712: Local signature for decision stream (legacy/dual-purpose)
    const eip712Signature = await getAgentAddress() // Simplified for now since RiskRouter handles the heavy lifting

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

    // 4.5 ERC-8004: Validation & Reputation are now JUDGE-ONLY per Discord update
    // The judge bot now handles all attestations every 4 hours automatically.
    const checkpointTx: string | undefined = undefined
    const reputationTx: string | undefined = undefined

    // 4.6 Update Wallet Balance and Gas Warning
    const balance = await getWalletBalance()
    await client.mutation("state:upsertValue" as any, { key: "walletBalance", value: balance })
    if (parseFloat(balance) < 0.005) {
      console.warn(`[${timeStr}] LOW GAS WARNING: Wallet balance is only ${balance} ETH!`)
    }

    await client.mutation("decisions:insertDecision" as any, {
      timestamp,
      action: decision.action,
      volume: decision.volume || 0,
      price: currentPrice,
      reason: decision.reason,
      confidence: decision.confidence || 0,
      executed,
      krakenResponse,
      pnlSnapshot: finalStatus.unrealized_pnl,
      totalEquity: finalStatus.current_value,
      eip712Signature,
      intentTx,
      checkpointTx,
      reputationTx,
      source: process.env.RAILWAY_SERVICE_ID ? "Railway (Cloud)" : "Local Terminal"
    })

    console.log(`[${timeStr}] ${decision.action.toUpperCase()} | Price: $${currentPrice.toFixed(2)} | Confidence: ${(decision.confidence * 100).toFixed(0)}% | PnL: $${finalStatus.unrealized_pnl.toFixed(2)}`)

  } catch (error: any) {
    console.error(`[${timeStr}] CYCLE ERROR:`, error)
    
    // Log error row to Convex
    try {
      await client.mutation("decisions:insertDecision" as any, {
        timestamp,
        action: "error",
        volume: 0,
        price: 0,
        reason: error.message || String(error),
        confidence: 0,
        executed: false,
        krakenResponse: null,
        pnlSnapshot: 0,
        source: process.env.RAILWAY_SERVICE_ID ? "Railway (Cloud)" : "Local Terminal"
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
  console.log("--- Starting InnovAgent Trader Agent ---")
  
  try {
    if (process.env.PAPER_MODE === "true") {
      console.log("Initializing Paper Trading account...")
      try {
        await kraken.initPaper()
      } catch (err: any) {
        console.warn("Paper account initialization note:", err.message || err)
      }
    }

    // Set startup heartbeat
    await client.mutation("state:upsertValue" as any, {
      key: "agentStarted",
      value: Date.now()
    })

    // ERC-8004 Startup Registration
    const agentId = await registerAgent()
    if (agentId) {
      await claimAllocation(agentId)
    }
  } catch (error: any) {
    console.error("Startup failed:", error)
    if (String(error).includes("Function not found")) {
      console.error("TIP: Ensure your Convex functions are deployed to the current CONVEX_URL.")
    }
  }

  // Add a basic health-check server to satisfy Railway/Vercel/Render health checks
  const PORT = process.env.PORT || 8080
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('InnovAgent is healthy and running.\n')
  }).listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`)
  })

  // Start the 10-minute loop
  const interval = parseInt(process.env.LOOP_INTERVAL_MS || "600000")
  console.log(`Loop started - taking trades every ${interval / 1000} seconds.`)
  
  // Initial run
  runCycle().catch(err => console.error("Initial cycle failed:", err))
  
  // Interval run
  setInterval(() => {
    runCycle().catch(err => console.error("Cycle failed:", err))
  }, interval)
}

main()
